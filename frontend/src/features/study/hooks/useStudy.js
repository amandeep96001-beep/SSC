import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiService } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';
import { getListFromResponse } from '@/shared/utils/apiResponse';
import { useExam } from '@/shared/context/useExam';
import { showAppToast } from '@/shared/utils/appToast';
import { disableGsiAutoSelect } from '@/shared/utils/gsi';
import { normalizeQuestions } from '@/shared/utils/answerNormalizer';
import { namesMatch, sortSubjectsForExam } from '@/shared/utils/subjectNames';
import { useAppNavigation } from '@/shared/hooks/useAppNavigation';
import { parseAppPath } from '@/app/paths';

const CONTENT_SOURCE_KEY = 'ssc_content_source';

function normalizeSubjects(list) {
  return (list || []).map((item) => {
    if (typeof item === 'string') return { name: item, isOwned: false };
    return {
      name: item.name,
      isOwned: Boolean(item.isOwned || item.ownerId)
    };
  });
}

export function useStudy() {
  const { exam, examId, examSubjects, refreshExamConfigs } = useExam();
  const [contentSource, setContentSourceState] = useState(() => {
    try {
      const stored = localStorage.getItem(CONTENT_SOURCE_KEY);
      return stored === 'mine' ? 'mine' : 'global';
    } catch {
      return 'global';
    }
  });
  const [subjectsRaw, setSubjectsRaw] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [topicsList, setTopicsList] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [activeNotes, setActiveNotes] = useState(null);

  const {
    activeView,
    goToView,
    parsed,
    contentSourceFromUrl,
    location,
  } = useAppNavigation({
    source: contentSource,
    subject: selectedSubject,
    topicId: selectedTopicId,
  });

  /** Backward-compatible alias used across workspaces */
  const setActiveView = goToView;
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ssc_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Refresh role/profile from server so admin promotions apply without re-register
  useEffect(() => {
    const token = localStorage.getItem('ssc_token');
    if (!token || !user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.get('/auth/me');
        const profile = res?.data;
        if (!cancelled && profile?.username) {
          const next = {
            ...user,
            ...profile,
            role: profile.role || user.role || 'user'
          };
          localStorage.setItem('ssc_user', JSON.stringify(next));
          setUser(next);
        }
      } catch {
        // keep cached session
      }
    })();
    return () => { cancelled = true; };
    // only on mount / when token appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TCS iON Mock Exam states
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [questionStatuses, setQuestionStatuses] = useState([]);
  const [timer, setTimer] = useState(900); // 15 Minutes
  const [testSummary, setTestSummary] = useState(null);

  const timerValueRef = useRef(900);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const contentSourceRef = useRef(contentSource);

  // Keep ref in sync after each render so callbacks always read the latest value
  // without needing contentSource in their dependency arrays.
  // Must be in useEffect (not render body) — React 19 disallows ref mutation during render.
  useEffect(() => {
    contentSourceRef.current = contentSource;
  });

  // APIs
  const { execute: fetchSubjectsApi, loading: subjectsLoading, error: subjectsError } = useApi(
    useCallback((source) => apiService.get(`/study/subjects?source=${encodeURIComponent(source || 'global')}`), [])
  );
  const getTopicsApi = useApi(useCallback((subName, source) =>
    apiService.get(`/study/subjects/${encodeURIComponent(subName)}/topics?source=${encodeURIComponent(source || 'global')}`), []));
  const fetchTopicsRef = useRef(getTopicsApi.execute);
  fetchTopicsRef.current = getTopicsApi.execute;
  const getNotesApi = useApi(useCallback((id) => apiService.get(`/study/topics/${id}/notes`), []));
  const getTestApi = useApi(useCallback((id, count) => {
    const url = count && count > 0
      ? `/study/topics/${id}/test?count=${encodeURIComponent(count)}`
      : `/study/topics/${id}/test`;
    return apiService.get(url);
  }, []));
  const addTopicApi = useApi(useCallback(({ subjectName, body }) => apiService.post(`/study/subjects/${encodeURIComponent(subjectName)}/topics`, body), []));
  const addSubjectApi = useApi(useCallback((body) => apiService.post('/study/subjects', body), []));
  const deleteSubjectApi = useApi(useCallback(({ name, scope } = {}) => {
    const subjectName = typeof name === 'string' ? name : String(name || '');
    const q = scope === 'global' ? '?scope=global' : '';
    return apiService.delete(`/study/subjects/${encodeURIComponent(subjectName)}${q}`);
  }, []));

  const loginApi = useApi(useCallback((body) => apiService.post('/auth/login', body), []));
  const registerApi = useApi(useCallback((body) => apiService.post('/auth/register', body, { timeout: 25000 }), []));
  const requestOtpApi = useApi(useCallback((body) => apiService.post('/auth/otp/request', body), []));
  const verifyOtpApi = useApi(useCallback((body) => apiService.post('/auth/otp/verify', body), []));
  const forgotPasswordApi = useApi(useCallback((body) => apiService.post('/auth/password/forgot', body), []));
  const resetPasswordApi = useApi(useCallback((body) => apiService.post('/auth/password/reset', body), []));
  const googleAuthApi = useApi(useCallback((body) => apiService.post('/auth/google', body), []));
  const updateProgressApi = useApi(useCallback((body) => apiService.post('/auth/progress', body), []));
  const updateMockProgressApi = useApi(useCallback((body) => apiService.post('/auth/mock-progress', body), []));
  const updateTopicApi = useApi(useCallback(({ topicId, body }) => apiService.put(`/study/topics/${topicId}`, body), []));
  const deleteTopicApi = useApi(useCallback((topicId) => apiService.delete(`/study/topics/${topicId}`), []));

  const fetchSubjects = useCallback(async (sourceOverride) => {
    const source = sourceOverride || contentSourceRef.current;
    const result = await fetchSubjectsApi(source);
    const list = getListFromResponse(result);
    setSubjectsRaw(normalizeSubjects(list));
  }, [fetchSubjectsApi]);

  const isMineMode = contentSource === 'mine';
  const isAdminUser = user?.role === 'admin';
  /** Admin can manage Official Syllabus; anyone can manage My Notes */
  const canManageContent = isMineMode || (contentSource === 'global' && isAdminUser);

  const subjects = useMemo(() => {
    if (contentSource === 'mine') return subjectsRaw;
    return sortSubjectsForExam(subjectsRaw, examSubjects, { isMine: false });
  }, [subjectsRaw, examSubjects, contentSource]);

  const setContentSource = useCallback(async (source) => {
    const next = source === 'mine' ? 'mine' : 'global';
    setContentSourceState(next);
    localStorage.setItem(CONTENT_SOURCE_KEY, next);
    setSelectedSubject(null);
    setTopicsList([]);
    setSelectedTopicId(null);
    setActiveNotes(null);
    goToView('subjects', { source: next });
    await fetchSubjects(next);
  }, [fetchSubjects, goToView]);

  const persistUser = (userData) => {
    const { token, ...profile } = userData;
    if (token) localStorage.setItem('ssc_token', token);
    localStorage.setItem('ssc_user', JSON.stringify(profile));
    setUser(profile);
  };

  const loginUser = useCallback(async (username, password) => {
    const res = await loginApi.execute({ username, password });
    if (res.success && res.data?.data?.needsVerification) {
      return {
        success: false,
        needsVerification: true,
        email: res.data.data.email,
        message: res.data.message,
      };
    }
    if (res.success && res.data?.data?.token) {
      persistUser(res.data.data);
      return { success: true };
    }
    return { success: false, message: loginApi.error || 'Login failed.' };
  }, [loginApi]);

  const registerUser = useCallback(async (email, password) => {
    const res = await registerApi.execute({ email, password });
    if (res.success && res.data?.data?.needsVerification) {
      return {
        success: true,
        needsVerification: true,
        email: res.data.data.email,
        mailSent: Boolean(res.data.data.mailSent),
        debugOtp: res.data.data.debugOtp || '',
        message: res.data.message,
      };
    }
    if (res.success && res.data?.data?.token) {
      persistUser(res.data.data);
      return { success: true };
    }
    return { success: false, message: registerApi.error || res.data?.message || 'Registration failed.' };
  }, [registerApi]);

  const requestOtp = useCallback(async (email) => {
    const res = await requestOtpApi.execute({ email });
    if (res.success && res.data) {
      return {
        success: true,
        message: res.data.message,
        alreadyVerified: res.data.data?.alreadyVerified,
        mailSent: Boolean(res.data.data?.mailSent),
        debugOtp: res.data.data?.debugOtp || '',
      };
    }
    return { success: false, message: requestOtpApi.error || 'Could not send OTP.' };
  }, [requestOtpApi]);

  const verifyOtp = useCallback(async (email, code) => {
    const res = await verifyOtpApi.execute({ email, code });
    if (res.success && res.data?.data?.verified) {
      return { success: true, message: res.data.message };
    }
    return { success: false, message: verifyOtpApi.error || 'OTP verification failed.' };
  }, [verifyOtpApi]);

  const forgotPassword = useCallback(async (email) => {
    const res = await forgotPasswordApi.execute({ email });
    if (res.success) {
      return {
        success: true,
        message: res.data?.message,
        email: res.data?.data?.email || email,
      };
    }
    return { success: false, message: forgotPasswordApi.error || 'Unable to send reset code.' };
  }, [forgotPasswordApi]);

  const resetPassword = useCallback(async (email, code, password) => {
    const res = await resetPasswordApi.execute({ email, code, password });
    if (res.success && res.data?.data?.reset) {
      return { success: true, message: res.data.message };
    }
    return { success: false, message: resetPasswordApi.error || 'Password reset failed.' };
  }, [resetPasswordApi]);

  const loginWithGoogle = useCallback(async (payload) => {
    const body = typeof payload === 'string'
      ? { credential: payload }
      : payload;
    const res = await googleAuthApi.execute(body);
    if (res.success && res.data?.data) {
      persistUser(res.data.data);
      return { success: true };
    }
    return { success: false, message: googleAuthApi.error || 'Google sign-in failed.' };
  }, [googleAuthApi]);

  const logoutUser = useCallback(() => {
    disableGsiAutoSelect();
    setUser(null);
    localStorage.removeItem('ssc_user');
    localStorage.removeItem('ssc_token');
    goToView('home');
  }, [goToView]);

  const skipToSubjects = useCallback(() => {
    fetchSubjects();
    goToView('subjects', { source: contentSourceRef.current });
  }, [fetchSubjects, goToView]);

  const selectSubject = useCallback((subName) => {
    goToView('topics', { subject: subName, source: contentSourceRef.current });
  }, [goToView]);

  const notesFetchAbortRef = useRef(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const syncedRouteRef = useRef('');

  const loadTopicNotes = useCallback(async (topicId) => {
    if (notesFetchAbortRef.current) {
      notesFetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    notesFetchAbortRef.current = controller;

    setSelectedTopicId(topicId);
    setActiveNotes(null);
    setNotesLoading(true);

    try {
      const result = await apiService.get(`/study/topics/${topicId}/notes`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (result?.data) {
        setActiveNotes(result.data);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.warn('[loadTopicNotes] notes fetch failed:', err.message);
    } finally {
      if (!controller.signal.aborted) {
        setNotesLoading(false);
        notesFetchAbortRef.current = null;
      }
    }
  }, []);

  const loadTopicNotesRef = useRef(loadTopicNotes);
  loadTopicNotesRef.current = loadTopicNotes;

  const selectTopic = useCallback((topicId, subjectName = null) => {
    goToView('notes', {
      subject: subjectName || selectedSubject,
      topicId,
      source: contentSourceRef.current,
    });
  }, [goToView, selectedSubject]);

  const submitExam = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const elapsedSeconds = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : Math.max(0, timerValueRef.current > 0 ? (900 - timerValueRef.current) : 0);
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let errorLog = "=== TOPIC TEST ERROR LOG ===\n\n";

    testQuestions.forEach((item, index) => {
      const userAns = selectedAnswers[index];
      const correctAns = item.a;

      if (userAns === null) {
        unattemptedCount++;
        errorLog += `Q${index + 1} [Topic area: ${item.state || 'GK'}] ${item.q}\n[Unattempted]\n[Correct Key]: ${item.o[correctAns]}\n\n`;
      } else if (userAns === correctAns) {
        correctCount++;
      } else {
        wrongCount++;
        errorLog += `Q${index + 1} [Topic area: ${item.state || 'GK'}] ${item.q}\n[Your Input]: ${item.o[userAns]}\n[Correct Key]: ${item.o[correctAns]}\n\n`;
      }
    });

    const marking = exam?.marking || { correct: 2, wrong: -0.5 };
    const totalScore = (correctCount * marking.correct) + (wrongCount * marking.wrong);
    const maxScore = testQuestions.length * marking.correct;
    const accuracy = correctCount + wrongCount > 0
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
      : 0;

    const summaryText = `Time Taken: ${elapsedMins} Mins ${elapsedSecs} Secs | Correct: ${correctCount} | Wrong: ${wrongCount} | Blank: ${unattemptedCount}`;

    setTestSummary({
      score: totalScore,
      maxScore,
      correct: correctCount,
      wrong: wrongCount,
      blank: unattemptedCount,
      accuracy,
      elapsedTime: `${elapsedMins} Mins ${elapsedSecs} Secs`,
      summaryText,
      errorLog: totalScore === maxScore ? "Perfect Score! Excellent performance!" : errorLog
    });

    if (user && selectedTopicId) {
      updateProgressApi.execute({
        topicId: selectedTopicId,
        score: totalScore,
        maxScore,
        elapsedTime: `${elapsedMins} Mins ${elapsedSecs} Secs`,
        examId,
        subjectName: selectedSubject || null
      }).then(res => {
        if (res.success && res.data?.data) {
          const updatedProgress = res.data.data;
          setUser(prev => {
            const next = {
              ...prev,
              progress: updatedProgress,
              lastStudyAt: res.data?.lastStudyAt || new Date().toISOString(),
            };
            localStorage.setItem('ssc_user', JSON.stringify(next));
            return next;
          });
        }
      });
    }

    goToView('results');
  }, [testQuestions, selectedAnswers, user, selectedTopicId, selectedSubject, examId, updateProgressApi, exam, goToView]);

  const submitMockExam = useCallback(async (mockData, answers, remainingTimer = 0, sectionTimes = null) => {
    const totalSeconds = (exam?.mockMinutes || 60) * 60;
    const elapsedSeconds = Math.max(0, totalSeconds - remainingTimer);
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;
    const qCount = mockData?.questions?.length || 0;
    const marking = exam?.marking || { correct: 2, wrong: -0.5 };

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let errorLog = `=== FULL MOCK ERROR LOG (${qCount} Q) ===\n\n`;

    (mockData.questions || []).forEach((item, index) => {
      const userAns = answers[index];
      const correctAns = item.a;

      if (userAns === undefined || userAns === null) {
        unattemptedCount++;
        errorLog += `Q${index + 1} [Section: ${item.section || 'General'}] ${item.q}\n[Unattempted]\n[Correct Key]: ${item.o[correctAns]}\n\n`;
      } else if (userAns === correctAns) {
        correctCount++;
      } else {
        wrongCount++;
        errorLog += `Q${index + 1} [Section: ${item.section || 'General'}] ${item.q}\n[Your Input]: ${item.o[userAns]}\n[Correct Key]: ${item.o[correctAns]}\n\n`;
      }
    });

    const totalScore = (correctCount * marking.correct) + (wrongCount * marking.wrong);
    const maxScore = qCount * marking.correct;
    const accuracy = correctCount + wrongCount > 0
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
      : 0;

    const summaryText = `Time Taken: ${elapsedMins} Mins ${elapsedSecs} Secs | Correct: ${correctCount} | Wrong: ${wrongCount} | Blank: ${unattemptedCount}`;

    setTestSummary({
      score: totalScore,
      maxScore,
      correct: correctCount,
      wrong: wrongCount,
      blank: unattemptedCount,
      accuracy,
      elapsedTime: `${elapsedMins} Mins ${elapsedSecs} Secs`,
      summaryText,
      sectionTimes,
      errorLog: wrongCount === 0 && unattemptedCount === 0 && qCount > 0
        ? 'Perfect Score! Excellent performance!'
        : errorLog,
      isMock: true
    });

    setTestQuestions(mockData.questions || []);

    const answersArray = Array(qCount).fill(null);
    Object.keys(answers || {}).forEach((idx) => {
      const i = Number(idx);
      if (i >= 0 && i < qCount) answersArray[i] = answers[idx];
    });
    setSelectedAnswers(answersArray);

    if (user) {
      updateMockProgressApi.execute({
        mockTestId: mockData._id,
        title: mockData.title,
        score: totalScore,
        correct: correctCount,
        wrong: wrongCount,
        blank: unattemptedCount,
        accuracy,
        elapsedTime: `${elapsedMins} Mins ${elapsedSecs} Secs`,
        sectionTimes,
        examId
      }).then(res => {
        if (res.success && res.data?.data) {
          const updatedMockProgress = res.data.data;
          setUser(prev => {
            const next = {
              ...prev,
              mockProgress: updatedMockProgress,
              lastStudyAt: res.data?.lastStudyAt || new Date().toISOString(),
            };
            localStorage.setItem('ssc_user', JSON.stringify(next));
            return next;
          });
        }
      });
    }

    goToView('results');
  }, [user, updateMockProgressApi, examId, exam, goToView]);

  const startTest = useCallback(async (count) => {
    if (!selectedTopicId) return { success: false };
    // Default to 25 if count is empty or invalid
    const validCount = count && Number(count) > 0 ? count : 25;
    const result = await getTestApi.execute(selectedTopicId, validCount);
    if (result.success && result.data.data) {
      const questions = result.data.data;
      // Filter out the auto-seeded placeholder question
      const realQuestions = questions.filter(q =>
        !q.q?.startsWith('Syllabus Check:')
      );
      if (realQuestions.length === 0) {
        return { success: false, noQuestions: true };
      }
      // Normalize answers (convert letter-based answers to numeric indices)
      const normalizedQuestions = normalizeQuestions(realQuestions);
      const qLen = normalizedQuestions.length;
      setTestQuestions(normalizedQuestions);
      setCurrentQuestionIdx(0);
      setSelectedAnswers(Array(qLen).fill(null));

      const initialStatuses = Array(qLen).fill('not-visited');
      initialStatuses[0] = 'not-answered';
      setQuestionStatuses(initialStatuses);

      // Timer scales with question count: 36 seconds per question, min 10 min, max 3 hrs
      const seconds = count && count > 0
        ? Math.min(10800, Math.max(600, count * 36))
        : 900;
      setTimer(seconds);
      timerValueRef.current = seconds;
      startTimeRef.current = Date.now();
      goToView('test', {
        subject: selectedSubject,
        topicId: selectedTopicId,
        source: contentSourceRef.current,
      });
      return { success: true, count: qLen };
    }
    return { success: false };
  }, [selectedTopicId, selectedSubject, getTestApi, goToView]);

  const cancelTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTestQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedAnswers([]);
    setQuestionStatuses([]);
    setTimer(900);
    setTestSummary(null);
    goToView('notes', {
      subject: selectedSubject,
      topicId: selectedTopicId,
      source: contentSourceRef.current,
    });
  }, [selectedSubject, selectedTopicId, goToView]);

  const jumpToQuestion = useCallback((idx) => {
    setCurrentQuestionIdx(idx);
    setQuestionStatuses((prev) => {
      const next = [...prev];
      if (next[idx] === 'not-visited') {
        next[idx] = 'not-answered';
      }
      return next;
    });
  }, []);

  const selectOptionValue = useCallback((optIdx) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = optIdx;
      return next;
    });
  }, [currentQuestionIdx]);

  const saveAndNext = useCallback(() => {
    setQuestionStatuses((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = selectedAnswers[currentQuestionIdx] !== null ? 'answered' : 'not-answered';
      return next;
    });

    if (currentQuestionIdx < testQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setQuestionStatuses((prev) => {
        const next = [...prev];
        if (next[currentQuestionIdx + 1] === 'not-visited') {
          next[currentQuestionIdx + 1] = 'not-answered';
        }
        return next;
      });
    } else {
      showAppToast("Last question — tap Submit to finish the test.", { variant: 'info', durationMs: 2800 });
    }
  }, [currentQuestionIdx, selectedAnswers, testQuestions.length]);

  const markForReview = useCallback(() => {
    setQuestionStatuses((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = 'marked';
      return next;
    });

    if (currentQuestionIdx < testQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setQuestionStatuses((prev) => {
        const next = [...prev];
        if (next[currentQuestionIdx + 1] === 'not-visited') {
          next[currentQuestionIdx + 1] = 'not-answered';
        }
        return next;
      });
    } else {
      showAppToast("Last question — tap Submit to finish the test.", { variant: 'info', durationMs: 2800 });
    }
  }, [currentQuestionIdx, testQuestions.length]);

  const clearResponse = useCallback(() => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = null;
      return next;
    });
    setQuestionStatuses((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = 'not-answered';
      return next;
    });
  }, [currentQuestionIdx]);

  useEffect(() => {
    timerValueRef.current = timer;
  }, [timer]);

  useEffect(() => {
    if (activeView === 'test') {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeView, submitExam]);

  const refreshTopics = useCallback(async () => {
    if (!selectedSubject) return;
    const topicsResult = await fetchTopicsRef.current(selectedSubject, contentSourceRef.current);
    setTopicsList(getListFromResponse(topicsResult));
  }, [selectedSubject]);

  const addCustomTopic = useCallback(async (topicData) => {
    if (!selectedSubject) return { success: false, message: 'No active subject selected.' };
    const isAdminUser = user?.role === 'admin';
    const source = contentSourceRef.current;
    if (source !== 'mine' && !(source === 'global' && isAdminUser)) {
      return { success: false, message: 'Switch to My Notes to create custom topics.' };
    }
    const body = source === 'global' && isAdminUser
      ? { ...topicData, scope: 'global' }
      : topicData;
    const result = await addTopicApi.execute({
      subjectName: selectedSubject,
      body
    });
    if (result.success && result.data.data) {
      await refreshTopics();
      return { success: true };
    }
    return { success: false, message: addTopicApi.error || 'Failed to create custom topic.' };
  }, [selectedSubject, addTopicApi, refreshTopics, user?.role]);

  const addCustomSubject = useCallback(async (name) => {
    const isAdminUser = user?.role === 'admin';
    const source = contentSourceRef.current;
    const body = (source === 'global' && isAdminUser)
      ? { name, scope: 'global' }
      : { name };

    const result = await addSubjectApi.execute(body);
    if (result.success && result.data?.data) {
      if (body.scope === 'global') {
        await fetchSubjects('global');
        await refreshExamConfigs();
      } else if (contentSourceRef.current !== 'mine') {
        await setContentSource('mine');
      } else {
        await fetchSubjects('mine');
      }
      return { success: true, data: result.data.data };
    }
    return { success: false, message: addSubjectApi.error || 'Failed to create subject.' };
  }, [addSubjectApi, setContentSource, fetchSubjects, user?.role, refreshExamConfigs]);

  const deleteCustomSubject = useCallback(async (subjectName) => {
    const isAdminUser = user?.role === 'admin';
    const source = contentSourceRef.current;
    const result = await deleteSubjectApi.execute({
      name: subjectName,
      scope: source === 'global' && isAdminUser ? 'global' : undefined
    });
    if (result.success) {
      await fetchSubjects(source);
      if (selectedSubject === subjectName) {
        setSelectedSubject(null);
        setTopicsList([]);
        goToView('subjects', { source });
      }
      return { success: true };
    }
    return { success: false, message: deleteSubjectApi.error || 'Failed to delete subject.' };
  }, [deleteSubjectApi, fetchSubjects, selectedSubject, user?.role, goToView]);

  const updateCustomTopic = useCallback(async (topicId, topicData) => {
    const result = await updateTopicApi.execute({
      topicId,
      body: topicData
    });
    if (result.success && result.data.data) {
      await refreshTopics();
      return {
        success: true,
        message: result.data.message,
        questionsReport: result.data.data.questionsReport || null,
      };
    }
    return { success: false, message: updateTopicApi.error || 'Failed to update custom topic.' };
  }, [updateTopicApi, refreshTopics]);

  const deleteCustomTopic = useCallback(async (topicId) => {
    const result = await deleteTopicApi.execute(topicId);
    if (result.success) {
      await refreshTopics();
      return { success: true };
    }
    return { success: false, message: deleteTopicApi.error || 'Failed to delete topic.' };
  }, [deleteTopicApi, refreshTopics]);

  const subjectsLoadedForRef = useRef(null);

  useEffect(() => {
    const userKey = user?.id ?? user?.username ?? null;
    if (!userKey) {
      subjectsLoadedForRef.current = null;
      return;
    }
    const cacheKey = `${userKey}:${contentSource}`;
    if (subjectsLoadedForRef.current === cacheKey) return;
    subjectsLoadedForRef.current = cacheKey;
    fetchSubjects(contentSource);
  }, [user?.id, user?.username, contentSource, fetchSubjects]);

  // If exam changes while viewing a subject that was only valid for the previous exam,
  // keep the subject open if it still exists in the official catalog.
  useEffect(() => {
    if (contentSource !== 'global' || !selectedSubject) return;
    const stillInCatalog = subjectsRaw.some(
      (s) => namesMatch(s.name, selectedSubject)
    );
    if (stillInCatalog) return;
    setSelectedSubject(null);
    setTopicsList([]);
    setSelectedTopicId(null);
    setActiveNotes(null);
    if (activeView === 'topics' || activeView === 'notes') {
      goToView('subjects', { source: contentSource });
    }
  }, [examId, contentSource, selectedSubject, activeView, subjectsRaw, goToView]);

  // Sync ?source= from URL on study routes
  useEffect(() => {
    if (!location.pathname.startsWith('/study')) return;
    if (!contentSourceFromUrl || contentSourceFromUrl === contentSource) return;
    syncedRouteRef.current = '';
    setContentSourceState(contentSourceFromUrl);
    localStorage.setItem(CONTENT_SOURCE_KEY, contentSourceFromUrl);
    fetchSubjects(contentSourceFromUrl);
  }, [location.pathname, contentSourceFromUrl, contentSource, fetchSubjects]);

  // Load study data from URL — single source of truth (no duplicate fetch loops)
  useEffect(() => {
    const userKey = user?.id ?? user?.username;
    if (!userKey) return undefined;

    const routeKey = `${location.pathname}${location.search}`;
    if (syncedRouteRef.current === routeKey) return undefined;
    syncedRouteRef.current = routeKey;

    const { view, subjectSlug, topicId } = parseAppPath(location.pathname);
    let cancelled = false;

    if (view === 'subjects') {
      setSelectedSubject(null);
      setTopicsList([]);
      setSelectedTopicId(null);
      setActiveNotes(null);
      setNotesLoading(false);
      return undefined;
    }

    (async () => {
      try {
        if (subjectSlug && (view === 'topics' || view === 'notes' || view === 'test')) {
          setSelectedSubject(subjectSlug);
          const result = await fetchTopicsRef.current(subjectSlug, contentSourceRef.current);
          if (!cancelled) setTopicsList(getListFromResponse(result));
        }

        if (view === 'topics') {
          setSelectedTopicId(null);
          setActiveNotes(null);
          setNotesLoading(false);
        }

        if (topicId && view === 'notes') {
          await loadTopicNotesRef.current(topicId);
        }

        if (topicId && view === 'test') {
          setSelectedTopicId(topicId);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[study route sync]', err.message || err);
        }
      }
    })();

    return () => {
      cancelled = true;
      syncedRouteRef.current = '';
      if (notesFetchAbortRef.current) {
        notesFetchAbortRef.current.abort();
        notesFetchAbortRef.current = null;
      }
    };
  }, [location.pathname, location.search, user?.id, user?.username]);

  return {
    activeView,
    setActiveView,
    parsed,
    contentSource,
    setContentSource,
    isMineMode,
    canManageContent,
    isAdminUser,
    subjects,
    selectedSubject,
    topicsList,
    selectedTopicId,
    activeNotes,
    testQuestions,
    currentQuestionIdx,
    selectedAnswers,
    questionStatuses,
    timer,
    testSummary,
    user,
    subjectsLoading,
    topicsLoading: getTopicsApi.loading,
    loading: getTestApi.loading || addTopicApi.loading || updateTopicApi.loading || deleteTopicApi.loading || addSubjectApi.loading || deleteSubjectApi.loading,
    notesLoading,
    error: subjectsError || getTopicsApi.error || getNotesApi.error || getTestApi.error || addTopicApi.error || updateTopicApi.error || deleteTopicApi.error || addSubjectApi.error || deleteSubjectApi.error,
    skipToSubjects,
    selectSubject,
    selectTopic,
    startTest,
    cancelTest,
    jumpToQuestion,
    selectOptionValue,
    saveAndNext,
    markForReview,
    clearResponse,
    submitExam,
    submitMockExam,
    addCustomTopic,
    addCustomSubject,
    deleteCustomSubject,
    loginUser,
    registerUser,
    requestOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    loginWithGoogle,
    logoutUser,
    updateCustomTopic,
    deleteCustomTopic
  };
}
