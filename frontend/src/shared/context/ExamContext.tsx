import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ExamContext, type StudyTarget } from './examContextDef';
import { getExamProfile, daysUntil, EXAM_LIST } from '@/shared/examProfiles';
import { apiService } from '@/shared/services/apiService';
import { errorMessage, isRecord } from '@/types/app';

const STORAGE_KEY = 'examprep_target_exam';
const DATE_KEY = 'examprep_exam_date';
const ONBOARD_KEY = 'examprep_exam_onboarded';
const TARGETS_KEY = 'examprep_study_targets_by_exam';

function isStudyTarget(value: unknown): value is StudyTarget {
  return isRecord(value) && typeof value.id === 'string' && typeof value.label === 'string';
}

function loadTargetsByExam(): Record<string, StudyTarget[]> {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, StudyTarget[]>;
      }
    }
    const legacy = localStorage.getItem('examprep_study_targets');
    if (legacy) {
      const list: unknown = JSON.parse(legacy);
      if (Array.isArray(list)) {
        const migrated = { ssc: list.filter(isStudyTarget) };
        localStorage.setItem(TARGETS_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return {};
}

function defaultSubjectsMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  EXAM_LIST.forEach((e) => {
    map[e.id] = e.subjectsFocus || [];
  });
  return map;
}

export function ExamProvider({ children }: { children: ReactNode }) {
  const [examId, setExamIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'ssc');
  const [examDate, setExamDateState] = useState(() => localStorage.getItem(DATE_KEY) || '');
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARD_KEY) === '1');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetsByExam, setTargetsByExam] = useState<Record<string, StudyTarget[]>>(loadTargetsByExam);
  const [subjectsByExam, setSubjectsByExam] = useState<Record<string, string[]>>(defaultSubjectsMap);

  const exam = useMemo(() => getExamProfile(examId), [examId]);
  const daysLeft = useMemo(() => daysUntil(examDate), [examDate]);
  const examSubjects = subjectsByExam[examId] || exam.subjectsFocus || [];
  const targets = targetsByExam[examId] || [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, examId);
  }, [examId]);

  useEffect(() => {
    if (examDate) localStorage.setItem(DATE_KEY, examDate);
    else localStorage.removeItem(DATE_KEY);
  }, [examDate]);

  useEffect(() => {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targetsByExam));
  }, [targetsByExam]);

  const refreshExamConfigs = useCallback(async () => {
    try {
      const res = await apiService.get('/exam-config');
      if (res?.status === 'success' && Array.isArray(res.data)) {
        const map = { ...defaultSubjectsMap() };
        res.data.forEach((row: unknown) => {
          if (isRecord(row) && typeof row.examId === 'string' && Array.isArray(row.subjects)) {
            map[row.examId] = row.subjects.filter((s): s is string => typeof s === 'string');
          }
        });
        setSubjectsByExam(map);
      }
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    refreshExamConfigs();
  }, [refreshExamConfigs]);

  const setExamId = useCallback((id: string) => {
    setExamIdState(id);
  }, []);

  const setExamDate = useCallback((date: string) => {
    setExamDateState(date || '');
  }, []);

  const closeExamPicker = useCallback(() => {
    localStorage.setItem(ONBOARD_KEY, '1');
    setOnboarded(true);
    setPickerOpen(false);
  }, []);

  const addTarget = useCallback((text: string) => {
    const label = String(text || '').trim();
    if (!label) return;
    setTargetsByExam((prev) => {
      const current = prev[examId] || [];
      return {
        ...prev,
        [examId]: [
          { id: `t-${Date.now()}`, label, done: false, createdAt: Date.now() },
          ...current,
        ],
      };
    });
  }, [examId]);

  const toggleTarget = useCallback((id: string) => {
    setTargetsByExam((prev) => {
      const current = prev[examId] || [];
      return {
        ...prev,
        [examId]: current.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      };
    });
  }, [examId]);

  const removeTarget = useCallback((id: string) => {
    setTargetsByExam((prev) => {
      const current = prev[examId] || [];
      return {
        ...prev,
        [examId]: current.filter((t) => t.id !== id),
      };
    });
  }, [examId]);

  const saveExamSubjects = useCallback(async (id: string, subjects: string[]) => {
    try {
      const res = await apiService.put(`/exam-config/${id}`, { subjects });
      if (res?.status === 'success') {
        setSubjectsByExam((prev) => ({ ...prev, [id]: subjects }));
        return { success: true };
      }
      return { success: false, message: res?.message || 'Save failed' };
    } catch (err) {
      return { success: false, message: errorMessage(err) || 'Save failed' };
    }
  }, []);

  const value = {
    examId,
    exam,
    examDate,
    daysLeft,
    examSubjects,
    subjectsByExam,
    onboarded,
    pickerOpen,
    setPickerOpen,
    setExamId,
    setExamDate,
    targets,
    addTarget,
    toggleTarget,
    removeTarget,
    refreshExamConfigs,
    saveExamSubjects,
    openExamPicker: () => setPickerOpen(true),
    closeExamPicker,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}
