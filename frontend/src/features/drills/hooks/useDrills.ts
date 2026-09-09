import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';
import type { ApiJson } from '@/shared/services/apiService';
import { isRecord } from '@/types/app';

export function sameDrillAnswer(a: unknown, b: unknown, type?: string): boolean {
  const fold = (value: unknown) => {
    let text = String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (type === 'fraction' || type === 'percentage') {
      text = text.replace(/%/g, '');
    }
    return text;
  };
  const left = fold(a);
  const right = fold(b);
  return Boolean(left) && left === right;
}

export interface DrillItem {
  type?: string;
  question?: string;
  correctAnswer?: string;
  _id?: string;
  options?: string[] | null;
  placeholder?: string | null;
  explanation?: string | null;
  category?: string | null;
  word?: string | null;
  revealDefinition?: string | null;
  revealSynonyms?: string[] | null;
  revealAntonyms?: string[] | null;
  pos?: string | null;
  definition?: string | null;
}

export interface WrongQuestion {
  question: string;
  correctAnswer?: string;
  userAnswer?: string;
  options?: string[] | null;
  placeholder?: string | null;
  explanation?: string | null;
  category?: string | null;
  type?: string;
  word?: string | null;
  revealDefinition?: string | null;
  revealSynonyms?: string[] | null;
  revealAntonyms?: string[] | null;
  pos?: string | null;
  wrongCount: number;
  lastWrongAt: number;
}

export interface DrillStats {
  score: number;
  skips: number;
  totalAsked: number;
  streak: number;
}

export interface DrillFeedback {
  isChecked: boolean;
  isCorrect: boolean;
  showAnswer: boolean;
  selectedAnswer?: string;
}

function extractVocabWord(question = ''): string | null {
  const m = String(question).match(/"([^"]+)"/);
  return m ? m[1] : null;
}

function asDrill(value: unknown): DrillItem | null {
  if (!isRecord(value)) return null;
  return value as unknown as DrillItem;
}

export function useDrills(isAuthenticated = false) {
  const [drillType, setDrillType] = useState('table'); // table, fraction, percentage, vocab
  const [currentDrill, setCurrentDrill] = useState<DrillItem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [maxTableBase, setMaxTableBase] = useState(20);

  // Game session scores
  const [stats, setStats] = useState<DrillStats>({
    score: 0,
    skips: 0,
    totalAsked: 0,
    streak: 0
  });

  // Wrong questions log — { question, correctAnswer, explanation, category, type, wrongCount }
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('wrongQuestions');
      return saved ? (JSON.parse(saved) as WrongQuestion[]).slice(0, 20) : [];
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
  const [feedback, setFeedback] = useState<DrillFeedback>({
    isChecked: false,
    isCorrect: false,
    showAnswer: false
  });

  const { execute: fetchNextDrill, loading: nextDrillLoading, error: nextDrillError } = useApi<
    [{ type: string; maxBase: number }],
    ApiJson
  >(
    useCallback(({ type, maxBase }: { type: string; maxBase: number }) => apiService.get(`/drill/next?type=${type}&maxBase=${maxBase}`), [])
  );
  const { execute: verifyDrill, loading: verifyLoading, error: verifyError } = useApi<[unknown], ApiJson>(
    useCallback((body: unknown) => apiService.post('/drill/verify', body), [])
  );

  // Load next question
  const loadNextDrill = useCallback(async (typeToLoad = drillType, baseLimit = maxTableBase) => {
    setUserAnswer('');
    setFeedback({ isChecked: false, isCorrect: false, showAnswer: false, selectedAnswer: '' });
    
    const result = await fetchNextDrill({ type: typeToLoad, maxBase: baseLimit });
    if (result.success) {
      const drill = asDrill(result.data.data);
      if (drill) setCurrentDrill(drill);
    }
  }, [fetchNextDrill, drillType, maxTableBase]);

  // Submit Answer
  const submitAnswer = useCallback(async (e?: { preventDefault?: () => void } | null, directAnswer: string | null = null) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    const finalAnswer = directAnswer !== null ? directAnswer : userAnswer;
    if (!currentDrill || !finalAnswer.trim()) return;

    const payload = {
      type: currentDrill.type,
      question: currentDrill.question,
      userAnswer: finalAnswer,
      correctAnswer: currentDrill.correctAnswer,
      questionId: currentDrill._id || null,
    };

    const result = await verifyDrill(payload);
    if (result.success && isRecord(result.data.data)) {
      const isCorrect = Boolean(result.data.data.isCorrect);
      const serverCorrect = typeof result.data.data.correctAnswer === 'string'
        ? result.data.data.correctAnswer
        : currentDrill.correctAnswer;

      if (serverCorrect && serverCorrect !== currentDrill.correctAnswer) {
        setCurrentDrill((prev) => (prev ? { ...prev, correctAnswer: serverCorrect } : prev));
      }
      setUserAnswer(finalAnswer);

      setFeedback({
        isChecked: true,
        isCorrect,
        showAnswer: true,
        selectedAnswer: finalAnswer,
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
          let updated: WrongQuestion[];
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
                question: currentDrill.question || '',
                correctAnswer: serverCorrect || currentDrill.correctAnswer,
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
  const changeDrillType = useCallback((newType: string) => {
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

  const removeWrongQuestion = useCallback((question: string | null | undefined) => {
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

export type UseDrillsReturn = ReturnType<typeof useDrills>;
