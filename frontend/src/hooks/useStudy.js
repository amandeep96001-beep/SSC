import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';
import { useApi } from './useApi';

export function useStudy() {
  const [activeView, setActiveView] = useState('drill'); // drill, subjects, topics, notes, test, results, revision
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
  const [selectedAnswers, setSelectedAnswers] = useState(Array(25).fill(null));
  const [questionStatuses, setQuestionStatuses] = useState(Array(25).fill('not-visited'));
  const [timer, setTimer] = useState(900); // 15 Minutes
  const [testSummary, setTestSummary] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // APIs
  const getSubjectsApi = useApi(useCallback(() => apiService.get('/study/subjects'), []));
  const getTopicsApi = useApi(useCallback((subName) => apiService.get(`/study/subjects/${encodeURIComponent(subName)}/topics`), []));
  const getNotesApi = useApi(useCallback((id) => apiService.get(`/study/topics/${id}/notes`), []));
  const getTestApi = useApi(useCallback((id) => apiService.get(`/study/topics/${id}/test`), []));
  const addTopicApi = useApi(useCallback(({ subjectName, body }) => apiService.post(`/study/subjects/${encodeURIComponent(subjectName)}/topics`, body), []));
  
  const loginApi = useApi(useCallback((body) => apiService.post('/auth/login', body), []));
  const registerApi = useApi(useCallback((body) => apiService.post('/auth/register', body), []));
  const updateProgressApi = useApi(useCallback((body) => apiService.post('/auth/progress', body), []));
  const updateMockProgressApi = useApi(useCallback((body) => apiService.post('/auth/mock-progress', body), []));
  const updateTopicApi = useApi(useCallback(({ topicId, body }) => apiService.put(`/study/topics/${topicId}`, body), []));
  const deleteTopicApi = useApi(useCallback((topicId) => apiService.delete(`/study/topics/${topicId}`), []));

  // Load all subjects on mount
  const fetchSubjects = useCallback(async () => {
    const result = await getSubjectsApi.execute();
    if (result.success && result.data.data) {
      setSubjects(result.data.data);
    }
  }, [getSubjectsApi]);

  // Auth helper methods
  const loginUser = useCallback(async (username, password) => {
    const res = await loginApi.execute({ username, password });
    if (res.success && res.data?.data) {
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('ssc_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: loginApi.error || 'Login verification failed.' };
  }, [loginApi]);

  const registerUser = useCallback(async (username, password) => {
    const res = await registerApi.execute({ username, password });
    if (res.success && res.data?.data) {
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('ssc_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: registerApi.error || 'Sign up verification failed.' };
  }, [registerApi]);

  const logoutUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ssc_user');
    setActiveView('drill');
  }, []);

  // Navigate to subjects view
  const skipToSubjects = useCallback(() => {
    fetchSubjects();
    setActiveView('subjects');
  }, [fetchSubjects]);

  // Select Subject -> Load Topics
  const selectSubject = useCallback(async (subName) => {
    setSelectedSubject(subName);
    const result = await getTopicsApi.execute(subName);
    if (result.success && result.data.data) {
      setTopicsList(result.data.data);
      setActiveView('topics');
    }
  }, [getTopicsApi]);

  // Select Topic -> Load Study Notes
  const selectTopic = useCallback(async (topicId) => {
    setSelectedTopicId(topicId);
    const result = await getNotesApi.execute(topicId);
    if (result.success && result.data.data) {
      setActiveNotes(result.data.data);
      setActiveView('notes');
    }
  }, [getNotesApi]);

  // Submit Exam Calculations
  const submitExam = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const elapsedSeconds = 900 - timer;
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let errorLog = "=== CHSL 25-QUESTION MEGA MOCK ERROR LOG ===\n\n";

    testQuestions.forEach((item, index) => {
      const userAns = selectedAnswers[index];
      const correctAns = item.a;

      if (userAns === null) {
        unattemptedCount++;
        errorLog += `Q${index + 1} [TCS Hidden Target State: ${item.state || 'GK'}] ${item.q}\n⚪ Unattempted\n✅ Key: ${item.o[correctAns]}\n\n`;
      } else if (userAns === correctAns) {
        correctCount++;
      } else {
        wrongCount++;
        errorLog += `Q${index + 1} [TCS Hidden Target State: ${item.state || 'GK'}] ${item.q}\n❌ My Input: ${item.o[userAns]}\n✅ Key: ${item.o[correctAns]}\n\n`;
      }
    });

    const totalScore = (correctCount * 2) - (wrongCount * 0.5);
    const accuracy = correctCount + wrongCount > 0 
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100) 
      : 0;

    const summaryText = `Time Taken: ${elapsedMins} Mins ${elapsedSecs} Secs | Correct: ${correctCount} | Wrong: ${wrongCount} | Blank: ${unattemptedCount}`;

    setTestSummary({
      score: totalScore,
      correct: correctCount,
      wrong: wrongCount,
      blank: unattemptedCount,
      accuracy,
      elapsedTime: `${elapsedMins} Mins ${elapsedSecs} Secs`,
      summaryText,
      errorLog: totalScore === 50 ? "ABSOLUTE FLAWLESS LEGENDARY SWEEP! Pure 50/50 Marks Koot Diye Tumne Bhai! 🔥" : errorLog
    });

    // Save progress user metrics to MongoDB Atlas
    if (user && selectedTopicId) {
      updateProgressApi.execute({
        username: user.username,
        topicId: selectedTopicId,
        score: totalScore,
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
  }, [testQuestions, selectedAnswers, timer, user, selectedTopicId, updateProgressApi]);

  // Submit mock test
  const submitMockExam = useCallback(async (mockData, answers, remainingTimer = 0, sectionTimes = null) => {
    const elapsedSeconds = 3600 - remainingTimer;
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let errorLog = "=== SSC 100-QUESTION FULL MOCK ERROR LOG ===\n\n";

    mockData.questions.forEach((item, index) => {
      const userAns = answers[index];
      const correctAns = item.a;

      if (userAns === undefined || userAns === null) {
        unattemptedCount++;
        errorLog += `Q${index + 1} [Section: ${item.section || 'General'}] ${item.q}\n⚪ Unattempted\n✅ Key: ${item.o[correctAns]}\n\n`;
      } else if (userAns === correctAns) {
        correctCount++;
      } else {
        wrongCount++;
        errorLog += `Q${index + 1} [Section: ${item.section || 'General'}] ${item.q}\n❌ My Input: ${item.o[userAns]}\n✅ Key: ${item.o[correctAns]}\n\n`;
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
      errorLog: totalScore === 200 ? "ABSOLUTE FLAWLESS LEGENDARY SWEEP! Pure 200/200 Marks Koot Diye Tumne Bhai! 🔥" : errorLog,
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
        username: user.username,
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

  // Start 25-Question Test
  const startTest = useCallback(async () => {
    if (!selectedTopicId) return;
    const result = await getTestApi.execute(selectedTopicId);
    console.log(result,"getting result")
    if (result.success && result.data.data) {
      setTestQuestions(result.data.data);
      setCurrentQuestionIdx(0);
      setSelectedAnswers(Array(25).fill(null));
      
      const initialStatuses = Array(25).fill('not-visited');
      initialStatuses[0] = 'not-answered';
      setQuestionStatuses(initialStatuses);

      setTimer(900); // 15 Mins
      startTimeRef.current = Date.now();
      setActiveView('test');
    }
  }, [selectedTopicId, getTestApi]);

  // Cancel Test — return to notes without saving progress
  const cancelTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTestQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedAnswers(Array(25).fill(null));
    setQuestionStatuses(Array(25).fill('not-visited'));
    setTimer(900);
    setTestSummary(null);
    setActiveView('notes');
  }, []);

  // Jump to specific question
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

  // Update selected answer for active question
  const selectOptionValue = useCallback((optIdx) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = optIdx;
      return next;
    });
  }, [currentQuestionIdx]);

  // Save current selection & advance index
  const saveAndNext = useCallback(() => {
    setQuestionStatuses((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = selectedAnswers[currentQuestionIdx] !== null ? 'answered' : 'not-answered';
      return next;
    });

    if (currentQuestionIdx < 24) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setQuestionStatuses((prev) => {
        const next = [...prev];
        if (next[currentQuestionIdx + 1] === 'not-visited') {
          next[currentQuestionIdx + 1] = 'not-answered';
        }
        return next;
      });
    } else {
      alert("Bhai pure 25 questions par atack complete! Side panel se 'Submit Section' click karo.");
    }
  }, [currentQuestionIdx, selectedAnswers]);

  // Mark for review & advance index
  const markForReview = useCallback(() => {
    setQuestionStatuses((prev) => {
      const next = [...prev];
      next[currentQuestionIdx] = 'marked';
      return next;
    });

    if (currentQuestionIdx < 24) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setQuestionStatuses((prev) => {
        const next = [...prev];
        if (next[currentQuestionIdx + 1] === 'not-visited') {
          next[currentQuestionIdx + 1] = 'not-answered';
        }
        return next;
      });
    }
  }, [currentQuestionIdx]);

  // Clear active question answer
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

  // Timer countdown hook
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

  // Add Custom User Topic
  const addCustomTopic = useCallback(async (topicData) => {
    if (!selectedSubject) return { success: false, message: 'No active subject selected.' };
    const result = await addTopicApi.execute({
      subjectName: selectedSubject,
      body: topicData
    });
    if (result.success && result.data.data) {
      const topicsResult = await getTopicsApi.execute(selectedSubject);
      if (topicsResult.success && topicsResult.data.data) {
        setTopicsList(topicsResult.data.data);
      }
      return { success: true };
    }
    return { success: false, message: addTopicApi.error || 'Failed to create custom topic.' };
  }, [selectedSubject, addTopicApi, getTopicsApi]);

  const updateCustomTopic = useCallback(async (topicId, topicData) => {
    const result = await updateTopicApi.execute({
      topicId,
      body: topicData
    });
    if (result.success && result.data.data) {
      if (selectedSubject) {
        const topicsResult = await getTopicsApi.execute(selectedSubject);
        if (topicsResult.success && topicsResult.data.data) {
          setTopicsList(topicsResult.data.data);
        }
      }
      return { success: true };
    }
    return { success: false, message: updateTopicApi.error || 'Failed to update custom topic.' };
  }, [selectedSubject, updateTopicApi, getTopicsApi]);

  const deleteCustomTopic = useCallback(async (topicId) => {
    const result = await deleteTopicApi.execute(topicId);
    if (result.success) {
      if (selectedSubject) {
        const topicsResult = await getTopicsApi.execute(selectedSubject);
        if (topicsResult.success && topicsResult.data.data) {
          setTopicsList(topicsResult.data.data);
        }
      }
      return { success: true };
    }
    return { success: false, message: deleteTopicApi.error || 'Failed to delete topic.' };
  }, [selectedSubject, deleteTopicApi, getTopicsApi]);

  // Fetch subjects initially
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    activeView,
    setActiveView,
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
    loading: getSubjectsApi.loading || getTopicsApi.loading || getNotesApi.loading || getTestApi.loading || addTopicApi.loading || updateTopicApi.loading || deleteTopicApi.loading,
    error: getSubjectsApi.error || getTopicsApi.error || getNotesApi.error || getTestApi.error || addTopicApi.error || updateTopicApi.error || deleteTopicApi.error,
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
    loginUser,
    registerUser,
    logoutUser,
    updateCustomTopic,
    deleteCustomTopic
  };
}
