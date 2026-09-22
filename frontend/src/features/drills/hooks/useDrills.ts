import { useState, useEffect, useCallback, useRef } from 'react';
import { drillApi } from '@/shared/api/drillApi';
import { useApi } from '@/shared/hooks/useApi';
import type { ApiJson } from '@/shared/services/apiService';
import { isRecord } from '@/types/app';
import {
  consumeGuestDrill,
  getGuestDrillRemaining,
  hasGuestDrillQuota,
  GUEST_DRILL_LIMIT,
} from '@/shared/utils/guestQuota';

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
  challengeToken?: string;
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
  id?: string;
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

const LOCAL_WRONG_KEY = 'wrongQuestions';
const LOCAL_MIGRATED_KEY = 'wrongQuestions_migrated_v1';

function extractVocabWord(question = ''): string | null {
  const m = String(question).match(/"([^"]+)"/);
  return m ? m[1] : null;
}

function asDrill(value: unknown): DrillItem | null {
  if (!isRecord(value)) return null;
  return value as unknown as DrillItem;
}

function readLocalWrongLog(): WrongQuestion[] {
  try {
    const saved = localStorage.getItem(LOCAL_WRONG_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as WrongQuestion[];
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

function clearLocalWrongLog() {
  try {
    localStorage.removeItem(LOCAL_WRONG_KEY);
  } catch { /* ignore */ }
}

function mapServerWrong(row: unknown): WrongQuestion | null {
  if (!isRecord(row) || typeof row.question !== 'string') return null;
  return {
    id: typeof row.id === 'string' ? row.id : undefined,
    question: row.question,
    correctAnswer: typeof row.correctAnswer === 'string' ? row.correctAnswer : undefined,
    userAnswer: typeof row.userAnswer === 'string' ? row.userAnswer : undefined,
    options: Array.isArray(row.options) ? row.options.map(String) : null,
    placeholder: typeof row.placeholder === 'string' ? row.placeholder : null,
    explanation: typeof row.explanation === 'string' ? row.explanation : null,
    category: typeof row.category === 'string' ? row.category : null,
    type: typeof row.type === 'string' ? row.type : undefined,
    word: typeof row.word === 'string' ? row.word : null,
    revealDefinition: typeof row.revealDefinition === 'string' ? row.revealDefinition : null,
    revealSynonyms: Array.isArray(row.revealSynonyms) ? row.revealSynonyms.map(String) : null,
    revealAntonyms: Array.isArray(row.revealAntonyms) ? row.revealAntonyms.map(String) : null,
    pos: typeof row.pos === 'string' ? row.pos : null,
    wrongCount: Number(row.wrongCount) || 1,
    lastWrongAt: Number(row.lastWrongAt) || Date.now(),
  };
}

export function useDrills(isAuthenticated = false, onGuestQuotaExhausted?: () => void) {
  const [drillType, setDrillType] = useState('table');
  const [currentDrill, setCurrentDrill] = useState<DrillItem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [maxTableBase, setMaxTableBase] = useState(20);
  const [guestRemaining, setGuestRemaining] = useState(() =>
    isAuthenticated ? GUEST_DRILL_LIMIT : getGuestDrillRemaining(),
  );

  const [stats, setStats] = useState<DrillStats>({
    score: 0,
    skips: 0,
    totalAsked: 0,
    streak: 0,
  });

  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [feedback, setFeedback] = useState<DrillFeedback>({
    isChecked: false,
    isCorrect: false,
    showAnswer: false,
  });

  const syncedRef = useRef(false);
  const guestMode = !isAuthenticated;
  const onQuotaRef = useRef(onGuestQuotaExhausted);
  useEffect(() => {
    onQuotaRef.current = onGuestQuotaExhausted;
  }, [onGuestQuotaExhausted]);

  useEffect(() => {
    setGuestRemaining(isAuthenticated ? GUEST_DRILL_LIMIT : getGuestDrillRemaining());
  }, [isAuthenticated]);

  const { execute: fetchNextDrill, loading: nextDrillLoading, error: nextDrillError } = useApi<
    [{ type: string; maxBase: number }],
    ApiJson
  >(
    useCallback(({ type, maxBase }: { type: string; maxBase: number }) => {
      return drillApi.next(type, maxBase, { guest: !localStorage.getItem('ssc_token') });
    }, []),
  );
  const { execute: verifyDrill, loading: verifyLoading, error: verifyError } = useApi<[unknown], ApiJson>(
    useCallback((body: unknown) => {
      const b = body as { challengeToken: string; userAnswer: string };
      return drillApi.verify(b, { guest: !localStorage.getItem('ssc_token') });
    }, []),
  );

  const bumpGuestUse = useCallback(() => {
    if (isAuthenticated) return true;
    if (!hasGuestDrillQuota()) {
      onQuotaRef.current?.();
      return false;
    }
    const left = consumeGuestDrill();
    setGuestRemaining(left);
    if (left <= 0) onQuotaRef.current?.();
    return true;
  }, [isAuthenticated]);

  // Load server wrong-log (and one-time migrate from localStorage).
  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false;
      setWrongQuestions([]);
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const local = readLocalWrongLog();
        const alreadyMigrated = localStorage.getItem(LOCAL_MIGRATED_KEY) === '1';

        if (local.length > 0 && !alreadyMigrated) {
          const res = await drillApi.migrateWrongLog(
            local.map((item) => ({
              question: item.question,
              correctAnswer: item.correctAnswer,
              userAnswer: item.userAnswer,
              options: item.options,
              placeholder: item.placeholder,
              explanation: item.explanation,
              category: item.category,
              type: item.type,
              word: item.word,
              revealDefinition: item.revealDefinition,
              revealSynonyms: item.revealSynonyms,
              revealAntonyms: item.revealAntonyms,
              pos: item.pos,
            })),
          );
          if (!cancelled && Array.isArray(res.data)) {
            setWrongQuestions(
              res.data.map(mapServerWrong).filter(Boolean) as WrongQuestion[],
            );
          }
          localStorage.setItem(LOCAL_MIGRATED_KEY, '1');
          clearLocalWrongLog();
          return;
        }

        const res = await drillApi.listWrongLog();
        if (!cancelled && Array.isArray(res.data)) {
          setWrongQuestions(
            res.data.map(mapServerWrong).filter(Boolean) as WrongQuestion[],
          );
        }
        if (!alreadyMigrated) {
          localStorage.setItem(LOCAL_MIGRATED_KEY, '1');
          clearLocalWrongLog();
        }
      } catch {
        // Fall back to whatever was local if server is down once.
        if (!cancelled) setWrongQuestions(readLocalWrongLog());
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const loadNextDrill = useCallback(async (typeToLoad = drillType, baseLimit = maxTableBase) => {
    if (!isAuthenticated && !hasGuestDrillQuota()) {
      onQuotaRef.current?.();
      setCurrentDrill(null);
      return;
    }

    setUserAnswer('');
    setFeedback({ isChecked: false, isCorrect: false, showAnswer: false, selectedAnswer: '' });

    const cappedBase = typeToLoad === 'table'
      ? Math.min(50, Math.max(12, Number(baseLimit) || 20))
      : Math.min(50, Math.max(2, Number(baseLimit) || 20));

    const result = await fetchNextDrill({ type: typeToLoad, maxBase: cappedBase });
    if (result.success) {
      const drill = asDrill(result.data.data);
      if (drill) setCurrentDrill(drill);
    }
  }, [fetchNextDrill, drillType, maxTableBase, isAuthenticated]);

  const submitAnswer = useCallback(async (
    e?: { preventDefault?: () => void } | null,
    directAnswer: string | null = null,
  ) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const finalAnswer = directAnswer !== null ? directAnswer : userAnswer;
    if (!currentDrill || !finalAnswer.trim()) return;

    if (!bumpGuestUse()) return;

    const payload = {
      challengeToken: currentDrill.challengeToken,
      userAnswer: finalAnswer,
    };

    const result = await verifyDrill(payload);
    if (result.success && isRecord(result.data.data)) {
      const isCorrect = Boolean(result.data.data.isCorrect);
      const serverCorrect = typeof result.data.data.correctAnswer === 'string'
        ? result.data.data.correctAnswer
        : currentDrill.correctAnswer;

      if (serverCorrect) {
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
        streak: isCorrect ? prev.streak + 1 : 0,
      }));

      if (!isCorrect && currentDrill && isAuthenticated) {
        const entry = {
          question: currentDrill.question || '',
          correctAnswer: serverCorrect || currentDrill.correctAnswer,
          userAnswer: finalAnswer,
          options: currentDrill.options || null,
          placeholder: currentDrill.placeholder || null,
          explanation: currentDrill.explanation || null,
          category: currentDrill.category || null,
          type: currentDrill.type,
          word: currentDrill.word || extractVocabWord(currentDrill.question),
          revealDefinition: currentDrill.revealDefinition || null,
          revealSynonyms: currentDrill.revealSynonyms || null,
          revealAntonyms: currentDrill.revealAntonyms || null,
          pos: currentDrill.pos || null,
        };

        setWrongQuestions((prev) => {
          const existingIdx = prev.findIndex((wq) => wq.question === entry.question);
          let updated: WrongQuestion[];
          if (existingIdx >= 0) {
            updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              wrongCount: updated[existingIdx].wrongCount + 1,
              userAnswer: finalAnswer,
              correctAnswer: entry.correctAnswer,
              lastWrongAt: Date.now(),
            };
          } else {
            updated = [{ ...entry, wrongCount: 1, lastWrongAt: Date.now() }, ...prev];
          }
          return updated.slice(0, 50);
        });

        void drillApi.upsertWrongLog(entry).then((res) => {
          const mapped = mapServerWrong(res.data);
          if (!mapped) return;
          setWrongQuestions((prev) => {
            const without = prev.filter((wq) => wq.question !== mapped.question);
            return [mapped, ...without].slice(0, 50);
          });
        }).catch(() => { /* keep optimistic local row */ });
      }

      if (isCorrect) {
        setTimeout(() => {
          loadNextDrill(drillType);
        }, 1200);
      }
    }
  }, [currentDrill, userAnswer, verifyDrill, loadNextDrill, drillType, bumpGuestUse, isAuthenticated]);

  const skipQuestion = useCallback(() => {
    if (!currentDrill) return;
    if (!bumpGuestUse()) return;
    setStats((prev) => ({
      ...prev,
      skips: prev.skips + 1,
      totalAsked: prev.totalAsked + 1,
      streak: 0,
    }));
    loadNextDrill(drillType);
  }, [currentDrill, loadNextDrill, drillType, bumpGuestUse]);

  const changeDrillType = useCallback((newType: string) => {
    setDrillType(newType);
    if (newType === 'table') {
      setMaxTableBase((prev) => Math.max(12, prev));
      loadNextDrill(newType, Math.max(12, maxTableBase));
      return;
    }
    loadNextDrill(newType);
  }, [loadNextDrill, maxTableBase]);

  const initialDrillLoadedRef = useRef(false);

  useEffect(() => {
    initialDrillLoadedRef.current = false;
    setCurrentDrill(null);
  }, [isAuthenticated]);

  useEffect(() => {
    const canLoad = isAuthenticated || hasGuestDrillQuota();
    if (!canLoad) {
      initialDrillLoadedRef.current = false;
      return;
    }
    if (initialDrillLoadedRef.current) return;
    initialDrillLoadedRef.current = true;
    loadNextDrill();
  }, [isAuthenticated, loadNextDrill]);

  const clearWrongLog = useCallback(() => {
    if (!isAuthenticated) return;
    setWrongQuestions([]);
    void drillApi.clearWrongLog().catch(() => {});
  }, [isAuthenticated]);

  const removeWrongQuestion = useCallback((question: string | null | undefined) => {
    if (!question || !isAuthenticated) return;
    setWrongQuestions((prev) => prev.filter((wq) => wq.question !== question));
    void drillApi.removeWrongLog(question).catch(() => {});
  }, [isAuthenticated]);

  const clearWrongVocab = useCallback(() => {
    if (!isAuthenticated) return;
    setWrongQuestions((prev) => prev.filter((wq) => wq.type !== 'vocab'));
    void drillApi.clearWrongLog('vocab').catch(() => {});
  }, [isAuthenticated]);

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
    loadNextDrill,
    guestRemaining,
    isGuestTrial: guestMode,
  };
}

export type UseDrillsReturn = ReturnType<typeof useDrills>;
