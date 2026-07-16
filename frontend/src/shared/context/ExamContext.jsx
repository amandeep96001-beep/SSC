import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExamContext } from './examContextDef';
import { getExamProfile, daysUntil, EXAM_LIST } from '@/shared/examProfiles';
import { apiService } from '@/shared/services/apiService';

const STORAGE_KEY = 'examprep_target_exam';
const DATE_KEY = 'examprep_exam_date';
const ONBOARD_KEY = 'examprep_exam_onboarded';
const TARGETS_KEY = 'examprep_study_targets';

function loadTargets() {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function defaultSubjectsMap() {
  const map = {};
  EXAM_LIST.forEach((e) => {
    map[e.id] = e.subjectsFocus || [];
  });
  return map;
}

export function ExamProvider({ children }) {
  const [examId, setExamIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'ssc');
  const [examDate, setExamDateState] = useState(() => localStorage.getItem(DATE_KEY) || '');
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARD_KEY) === '1');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targets, setTargets] = useState(loadTargets);
  const [subjectsByExam, setSubjectsByExam] = useState(defaultSubjectsMap);

  const exam = useMemo(() => getExamProfile(examId), [examId]);
  const daysLeft = useMemo(() => daysUntil(examDate), [examDate]);
  const examSubjects = subjectsByExam[examId] || exam.subjectsFocus || [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, examId);
  }, [examId]);

  useEffect(() => {
    if (examDate) localStorage.setItem(DATE_KEY, examDate);
    else localStorage.removeItem(DATE_KEY);
  }, [examDate]);

  useEffect(() => {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
  }, [targets]);

  const refreshExamConfigs = useCallback(async () => {
    try {
      const res = await apiService.get('/exam-config');
      if (res?.status === 'success' && Array.isArray(res.data)) {
        const map = { ...defaultSubjectsMap() };
        res.data.forEach((row) => {
          if (row.examId && Array.isArray(row.subjects)) {
            map[row.examId] = row.subjects;
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

  const setExamId = useCallback((id) => {
    setExamIdState(id);
  }, []);

  const setExamDate = useCallback((date) => {
    setExamDateState(date || '');
  }, []);

  const closeExamPicker = useCallback(() => {
    localStorage.setItem(ONBOARD_KEY, '1');
    setOnboarded(true);
    setPickerOpen(false);
  }, []);

  const addTarget = useCallback((text) => {
    const label = String(text || '').trim();
    if (!label) return;
    setTargets((prev) => [
      { id: `t-${Date.now()}`, label, done: false, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const toggleTarget = useCallback((id) => {
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const removeTarget = useCallback((id) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const saveExamSubjects = useCallback(async (id, subjects) => {
    try {
      const res = await apiService.put(`/exam-config/${id}`, { subjects });
      if (res?.status === 'success') {
        setSubjectsByExam((prev) => ({ ...prev, [id]: subjects }));
        return { success: true };
      }
      return { success: false, message: res?.message || 'Save failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Save failed' };
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
