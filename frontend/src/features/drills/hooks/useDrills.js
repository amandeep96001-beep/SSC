import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';

function extractVocabWord(question = '') {
  const m = String(question).match(/"([^"]+)"/);
  return m ? m[1] : null;
}

export function useDrills(isAuthenticated = false) {
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

  const { execute: fetchNextDrill, loading: nextDrillLoading, error: nextDrillError } = useApi(
    useCallback(({ type, maxBase }) => apiService.get(`/drill/next?type=${type}&maxBase=${maxBase}`), [])
  );
  const { execute: verifyDrill, loading: verifyLoading, error: verifyError } = useApi(
    useCallback((body) => apiService.post('/drill/verify', body), [])
  );

  // Load next question
  const loadNextDrill = useCallback(async (typeToLoad = drillType, baseLimit = maxTableBase) => {
    setUserAnswer('');
    setFeedback({ isChecked: false, isCorrect: false, showAnswer: false });
    
    const result = await fetchNextDrill({ type: typeToLoad, maxBase: baseLimit });
    if (result.success && result.data.data) {
      setCurrentDrill(result.data.data);
    }
  }, [fetchNextDrill, drillType, maxTableBase]);

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

    const result = await verifyDrill(payload);
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
            updated[existingIdx] = {
              ...updated[existingIdx],
              wrongCount: updated[existingIdx].wrongCount + 1,
              userAnswer: finalAnswer,
              lastWrongAt: Date.now(),
            };
          } else {
            updated = [
              {
                question: currentDrill.question,
                correctAnswer: currentDrill.correctAnswer,
                userAnswer: finalAnswer,
                options: currentDrill.options || null,
                placeholder: currentDrill.placeholder || null,
                explanation: currentDrill.explanation || null,
                category: currentDrill.category || null,
                type: currentDrill.type,
                word: currentDrill.word || extractVocabWord(currentDrill.question),
                // vocab-specific reveal fields
                revealDefinition: currentDrill.revealDefinition || null,
                revealSynonyms: currentDrill.revealSynonyms || null,
                revealAntonyms: currentDrill.revealAntonyms || null,
                pos: currentDrill.pos || null,
                wrongCount: 1,
                lastWrongAt: Date.now(),
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
  }, [currentDrill, userAnswer, verifyDrill, loadNextDrill, drillType]);

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

  const initialDrillLoadedRef = useRef(false);

  // Load first drill once after sign-in (changeDrillType handles type switches)
  useEffect(() => {
    if (!isAuthenticated) {
      initialDrillLoadedRef.current = false;
      return;
    }
    if (initialDrillLoadedRef.current) return;
    initialDrillLoadedRef.current = true;
    loadNextDrill();
  }, [isAuthenticated, loadNextDrill]);

  const clearWrongLog = () => setWrongQuestions([]);

  const removeWrongQuestion = useCallback((question) => {
    if (!question) return;
    setWrongQuestions((prev) => prev.filter((wq) => wq.question !== question));
  }, []);

  const clearWrongVocab = useCallback(() => {
    setWrongQuestions((prev) => prev.filter((wq) => wq.type !== 'vocab'));
  }, []);

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
    removeWrongQuestion,
    clearWrongVocab,
    loading: nextDrillLoading || verifyLoading,
    error: nextDrillError || verifyError,
    changeDrillType,
    submitAnswer,
    skipQuestion,
    loadNextDrill
  };
}
