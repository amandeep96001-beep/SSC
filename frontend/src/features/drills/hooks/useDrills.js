import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useApi } from './useApi';

export function useDrills() {
  const [drillType, setDrillType] = useState('table'); // table, fraction, percentage, vocab
  const [currentDrill, setCurrentDrill] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [maxTableBase, setMaxTableBase] = useState(20);

  // Game session scores
  const [stats, setStats] = useState({
    score: 0,
    skips: 0,
    totalAsked: 0,
    streak: 0
  });

  // Wrong questions log — { question, correctAnswer, explanation, category, type, wrongCount }
  const [wrongQuestions, setWrongQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('wrongQuestions');
      return saved ? JSON.parse(saved).slice(0, 20) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
    } catch (e) {
      console.error('Error saving wrongQuestions to localStorage', e);
    }
  }, [wrongQuestions]);

  // Micro-feedback states for card glow animations
  const [feedback, setFeedback] = useState({
    isChecked: false,
    isCorrect: false,
    showAnswer: false
  });

  const nextDrillApi = useApi(useCallback(({ type, maxBase }) => apiService.get(`/drill/next?type=${type}&maxBase=${maxBase}`), []));
  const verifyApi = useApi(useCallback((body) => apiService.post('/drill/verify', body), []));

  // Load next question
  const loadNextDrill = useCallback(async (typeToLoad = drillType, baseLimit = maxTableBase) => {
    setUserAnswer('');
    setFeedback({ isChecked: false, isCorrect: false, showAnswer: false });
    
    const result = await nextDrillApi.execute({ type: typeToLoad, maxBase: baseLimit });
    if (result.success && result.data.data) {
      setCurrentDrill(result.data.data);
    }
  }, [nextDrillApi, drillType, maxTableBase]);

  // Submit Answer
  const submitAnswer = useCallback(async (e, directAnswer = null) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    const finalAnswer = directAnswer !== null ? directAnswer : userAnswer;
    if (!currentDrill || !finalAnswer.trim()) return;

    const payload = {
      type: currentDrill.type,
      question: currentDrill.question,
      userAnswer: finalAnswer,
      correctAnswer: currentDrill.correctAnswer
    };

    const result = await verifyApi.execute(payload);
    if (result.success && result.data.data) {
      const isCorrect = result.data.data.isCorrect;
      
      setFeedback({
        isChecked: true,
        isCorrect,
        showAnswer: true
      });

      setStats((prev) => ({
        ...prev,
        score: prev.score + (isCorrect ? 1 : 0),
        totalAsked: prev.totalAsked + 1,
        streak: isCorrect ? prev.streak + 1 : 0
      }));

      // Track wrong answers in the log
      if (!isCorrect && currentDrill) {
        setWrongQuestions((prev) => {
          const existingIdx = prev.findIndex((wq) => wq.question === currentDrill.question);
          let updated;
          if (existingIdx >= 0) {
            updated = [...prev];
            updated[existingIdx] = { ...updated[existingIdx], wrongCount: updated[existingIdx].wrongCount + 1 };
          } else {
            updated = [
              {
                question: currentDrill.question,
                correctAnswer: currentDrill.correctAnswer,
                options: currentDrill.options || null,
                placeholder: currentDrill.placeholder || null,
                explanation: currentDrill.explanation || null,
                category: currentDrill.category || null,
                type: currentDrill.type,
                // vocab-specific reveal fields
                revealDefinition: currentDrill.revealDefinition || null,
                revealSynonyms: currentDrill.revealSynonyms || null,
                revealAntonyms: currentDrill.revealAntonyms || null,
                pos: currentDrill.pos || null,
                wrongCount: 1
              },
              ...prev
            ];
          }
          return updated.slice(0, 20);
        });
      }

      if (isCorrect) {
        // Automatically load next drill after a short delay for correct answers
        setTimeout(() => {
          loadNextDrill(drillType);
        }, 1200);
      }
    }
  }, [currentDrill, userAnswer, verifyApi, loadNextDrill, drillType]);

  // Skip Question
  const skipQuestion = useCallback(() => {
    if (!currentDrill) return;

    setStats((prev) => ({
      ...prev,
      skips: prev.skips + 1,
      totalAsked: prev.totalAsked + 1,
      streak: 0
    }));

    loadNextDrill(drillType);
  }, [currentDrill, loadNextDrill, drillType]);

  // Select another Category
  const changeDrillType = useCallback((newType) => {
    setDrillType(newType);
    loadNextDrill(newType);
  }, [loadNextDrill]);

  // Initial question load on boot
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNextDrill(drillType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearWrongLog = () => setWrongQuestions([]);

  return {
    drillType,
    currentDrill,
    userAnswer,
    setUserAnswer,
    maxTableBase,
    setMaxTableBase,
    stats,
    feedback,
    wrongQuestions,
    clearWrongLog,
    loading: nextDrillApi.loading || verifyApi.loading,
    error: nextDrillApi.error || verifyApi.error,
    changeDrillType,
    submitAnswer,
    skipQuestion,
    loadNextDrill
  };
}
