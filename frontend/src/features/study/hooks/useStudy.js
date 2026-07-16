import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';
import { getListFromResponse } from '@/shared/utils/apiResponse';

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
  const [activeView, setActiveView] = useState('drill'); // drill, subjects, topics, notes, test, results, revision
  const [contentSource, setContentSourceState] = useState(() => {
    try {
      const stored = localStorage.getItem(CONTENT_SOURCE_KEY);
      return stored === 'mine' ? 'mine' : 'global';
    } catch {
      return 'global';
    }
  });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // User Authentication state
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ssc_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Topic Notes view details
  const [topicsList, setTopicsList] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [activeNotes, setActiveNotes] = useState(null);

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
  contentSourceRef.current = contentSource;

  // APIs
  const { execute: fetchSubjectsApi, loading: subjectsLoading, error: subjectsError } = useApi(
    useCallback((source) => apiService.get(`/study/subjects?source=${encodeURIComponent(source || 'global')}`), [])
  );
  const getTopicsApi = useApi(useCallback((subName, source) =>
    apiService.get(`/study/subjects/${encodeURIComponent(subName)}/topics?source=${encodeURIComponent(source || 'global')}`), []));
  const getNotesApi = useApi(useCallback((id) => apiService.get(`/study/topics/${id}/notes`), []));
  const getTestApi = useApi(useCallback((id) => apiService.get(`/study/topics/${id}/test`), []));
  const addTopicApi = useApi(useCallback(({ subjectName, body }) => apiService.post(`/study/subjects/${encodeURIComponent(subjectName)}/topics`, body), []));
  const addSubjectApi = useApi(useCallback((body) => apiService.post('/study/subjects', body), []));
  const deleteSubjectApi = useApi(useCallback((subjectName) => apiService.delete(`/study/subjects/${encodeURIComponent(subjectName)}`), []));

  const loginApi = useApi(useCallback((body) => apiService.post('/auth/login', body), []));
  const registerApi = useApi(useCallback((body) => apiService.post('/auth/register', body), []));
  const updateProgressApi = useApi(useCallback((body) => apiService.post('/auth/progress', body), []));
  const updateMockProgressApi = useApi(useCallback((body) => apiService.post('/auth/mock-progress', body), []));
  const updateTopicApi = useApi(useCallback(({ topicId, body }) => apiService.put(`/study/topics/${topicId}`, body), []));
  const deleteTopicApi = useApi(useCallback((topicId) => apiService.delete(`/study/topics/${topicId}`), []));

  const fetchSubjects = useCallback(async (sourceOverride) => {
    const source = sourceOverride || contentSourceRef.current;
    const result = await fetchSubjectsApi(source);
    setSubjects(normalizeSubjects(getListFromResponse(result)));
  }, [fetchSubjectsApi]);

  const setContentSource = useCallback(async (source) => {
    const next = source === 'mine' ? 'mine' : 'global';
    setContentSourceState(next);
    localStorage.setItem(CONTENT_SOURCE_KEY, next);
    setSelectedSubject(null);
    setTopicsList([]);
    setSelectedTopicId(null);
    setActiveNotes(null);
    setActiveView('subjects');
    await fetchSubjects(next);
  }, [fetchSubjects]);

  const persistUser = (userData) => {
    const { token, ...profile } = userData;
    if (token) localStorage.setItem('ssc_token', token);
    localStorage.setItem('ssc_user', JSON.stringify(profile));
    setUser(profile);
  };

  const loginUser = useCallback(async (username, password) => {
    const res = await loginApi.execute({ username, password });
    if (res.success && res.data?.data) {
      persistUser(res.data.data);
      return { success: true };
    }
    return { success: false, message: loginApi.error || 'Login verification failed.' };
  }, [loginApi]);

  const registerUser = useCallback(async (username, password) => {
    const res = await registerApi.execute({ username, password });
    if (res.success && res.data?.data) {
      persistUser(res.data.data);
      return { success: true };
    }
    return { success: false, message: registerApi.error || 'Sign up verification failed.' };
  }, [registerApi]);

  const logoutUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ssc_user');
    localStorage.removeItem('ssc_token');
    setActiveView('drill');
  }, []);

  const skipToSubjects = useCallback(() => {
    fetchSubjects();
    setActiveView('subjects');
  }, [fetchSubjects]);

  const selectSubject = useCallback(async (subName) => {
    setSelectedSubject(subName);
    const result = await getTopicsApi.execute(subName, contentSourceRef.current);
    setTopicsList(getListFromResponse(result));
    setActiveView('topics');
  }, [getTopicsApi]);

  const selectTopic = useCallback(async (topicId) => {
    setSelectedTopicId(topicId);
    const result = await getNotesApi.execute(topicId);
    if (result.success && result.data.data) {
      setActiveNotes(result.data.data);
      setActiveView('notes');
    }
  }, [getNotesApi]);

  const submitExam = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const elapsedSeconds = 900 - timerValueRef.current;
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
        errorLog += `Q${index + 1} [TCS Hidden Target State: ${item.state || 'GK'}] ${item.q}\n[Unattempted]\n[Correct Key]: ${item.o[correctAns]}\n\n`;
      } else if (userAns === correctAns) {
        correctCount++;
      } else {
        wrongCount++;
        errorLog += `Q${index + 1} [TCS Hidden Target State: ${item.state || 'GK'}] ${item.q}\n[Your Input]: ${item.o[userAns]}\n[Correct Key]: ${item.o[correctAns]}\n\n`;
      }
    });

    const totalScore = (correctCount * 2) - (wrongCount * 0.5);
    const maxScore = testQuestions.length * 2;
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
        elapsedTime: `${elapsedMins} Mins ${elapsedSecs} Secs`
      }).then(res => {
        if (res.success && res.data?.data) {
          const updatedProgress = res.data.data;
          setUser(prev => {
            const next = { ...prev, progress: updatedProgress };
            localStorage.setItem('ssc_user', JSON.stringify(next));
            return next;
          });
        }
      });
    }

    setActiveView('results');
  }, [testQuestions, selectedAnswers, user, selectedTopicId, updateProgressApi]);

  const submitMockExam = useCallback(async (mockData, answers, remainingTimer = 0, sectionTimes = null) => {
    const elapsedSeconds = 3600 - remainingTimer;
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let errorLog = "=== EXAM 100-QUESTION FULL MOCK ERROR LOG ===\n\n";

    mockData.questions.forEach((item, index) => {
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

    const totalScore = (correctCount * 2) - (wrongCount * 0.5);
    const accuracy = correctCount + wrongCount > 0
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
      : 0;

    const summaryText = `Time Taken: ${elapsedMins} Mins ${elapsedSecs} Secs | Correct: ${correctCount} | Wrong: ${wrongCount} | Blank: ${unattemptedCount}`;

    setTestSummary({
      score: totalScore,
      maxScore: 200,
      correct: correctCount,
      wrong: wrongCount,
      blank: unattemptedCount,
      accuracy,
      elapsedTime: `${elapsedMins} Mins ${elapsedSecs} Secs`,
      summaryText,
      sectionTimes,
      errorLog: totalScore === 200 ? "Perfect Score! Excellent performance!" : errorLog,
      isMock: true
    });

    setTestQuestions(mockData.questions);

    const answersArray = Array(100).fill(null);
    Object.keys(answers).forEach((idx) => {
      answersArray[Number(idx)] = answers[idx];
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
        sectionTimes
      }).then(res => {
        if (res.success && res.data?.data) {
          const updatedMockProgress = res.data.data;
          setUser(prev => {
            const next = { ...prev, mockProgress: updatedMockProgress };
            localStorage.setItem('ssc_user', JSON.stringify(next));
            return next;
          });
        }
      });
    }

    setActiveView('results');
  }, [user, updateMockProgressApi]);

  const startTest = useCallback(async () => {
    if (!selectedTopicId) return;
    const result = await getTestApi.execute(selectedTopicId);
    if (result.success && result.data.data) {
      const qLen = result.data.data.length;
      setTestQuestions(result.data.data);
      setCurrentQuestionIdx(0);
      setSelectedAnswers(Array(qLen).fill(null));

      const initialStatuses = Array(qLen).fill('not-visited');
      if (qLen > 0) initialStatuses[0] = 'not-answered';
      setQuestionStatuses(initialStatuses);

      setTimer(900);
      startTimeRef.current = Date.now();
      setActiveView('test');
    }
  }, [selectedTopicId, getTestApi]);

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
    setActiveView('notes');
  }, []);

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
      alert("No more questions available! Please click 'Submit Section' to view your results.");
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
      alert("No more questions available! Please click 'Submit Section' to view your results.");
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
    const topicsResult = await getTopicsApi.execute(selectedSubject, contentSourceRef.current);
    setTopicsList(getListFromResponse(topicsResult));
  }, [selectedSubject, getTopicsApi]);

  const addCustomTopic = useCallback(async (topicData) => {
    if (!selectedSubject) return { success: false, message: 'No active subject selected.' };
    if (contentSourceRef.current !== 'mine') {
      return { success: false, message: 'Switch to My Notes to create custom topics.' };
    }
    const result = await addTopicApi.execute({
      subjectName: selectedSubject,
      body: topicData
    });
    if (result.success && result.data.data) {
      await refreshTopics();
      return { success: true };
    }
    return { success: false, message: addTopicApi.error || 'Failed to create custom topic.' };
  }, [selectedSubject, addTopicApi, refreshTopics]);

  const addCustomSubject = useCallback(async (name) => {
    const result = await addSubjectApi.execute({ name });
    if (result.success && result.data?.data) {
      if (contentSourceRef.current !== 'mine') {
        await setContentSource('mine');
      } else {
        await fetchSubjects('mine');
      }
      return { success: true, data: result.data.data };
    }
    return { success: false, message: addSubjectApi.error || 'Failed to create subject.' };
  }, [addSubjectApi, setContentSource, fetchSubjects]);

  const deleteCustomSubject = useCallback(async (subjectName) => {
    const result = await deleteSubjectApi.execute(subjectName);
    if (result.success) {
      await fetchSubjects('mine');
      if (selectedSubject === subjectName) {
        setSelectedSubject(null);
        setTopicsList([]);
        setActiveView('subjects');
      }
      return { success: true };
    }
    return { success: false, message: deleteSubjectApi.error || 'Failed to delete subject.' };
  }, [deleteSubjectApi, fetchSubjects, selectedSubject]);

  const updateCustomTopic = useCallback(async (topicId, topicData) => {
    const result = await updateTopicApi.execute({
      topicId,
      body: topicData
    });
    if (result.success && result.data.data) {
      await refreshTopics();
      return { success: true };
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

  const isMineMode = contentSource === 'mine';

  return {
    activeView,
    setActiveView,
    contentSource,
    setContentSource,
    isMineMode,
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
    loading: subjectsLoading || getTopicsApi.loading || getNotesApi.loading || getTestApi.loading || addTopicApi.loading || updateTopicApi.loading || deleteTopicApi.loading || addSubjectApi.loading || deleteSubjectApi.loading,
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
    logoutUser,
    updateCustomTopic,
    deleteCustomTopic
  };
}
