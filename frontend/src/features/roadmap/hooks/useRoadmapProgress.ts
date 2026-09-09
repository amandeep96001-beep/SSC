import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TOPIC_STATUS,
  flattenTopics,
  getExamSyllabus,
  EXAM_PROFILE_TO_SYLLABUS,
  DEFAULT_EXAM_KEY,
  type TopicStatus,
  type FlattenedTopic,
  type ExamSyllabus,
} from '../data/syllabus';

const STORAGE_PREFIX = 'examprep_roadmap_progress_';

export interface TopicProgress {
  status: TopicStatus;
  updatedAt: string | null;
  notes: string;
}

export interface SubjectProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percent: number;
}

function loadProgress(examKey: string): Record<string, TopicProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + examKey);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, TopicProgress>
      : {};
  } catch {
    return {};
  }
}

function saveProgress(examKey: string, progress: Record<string, TopicProgress>): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + examKey, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save roadmap progress', e);
  }
}

function normalizeEntry(entry?: Partial<TopicProgress> | null): TopicProgress {
  return {
    status: entry?.status || TOPIC_STATUS.PENDING,
    updatedAt: entry?.updatedAt || null,
    notes: entry?.notes || '',
  };
}

export function resolveSyllabusKey(examProfileId?: string): string {
  if (!examProfileId) return DEFAULT_EXAM_KEY;
  return EXAM_PROFILE_TO_SYLLABUS[examProfileId] || DEFAULT_EXAM_KEY;
}

export function useRoadmapProgress({ examKey = DEFAULT_EXAM_KEY }: { examKey?: string } = {}) {
  const syllabus: ExamSyllabus = useMemo(() => getExamSyllabus(examKey), [examKey]);
  const [progress, setProgress] = useState<Record<string, TopicProgress>>(() => loadProgress(examKey));

  useEffect(() => {
    setProgress(loadProgress(examKey));
  }, [examKey]);

  useEffect(() => {
    saveProgress(examKey, progress);
  }, [examKey, progress]);

  const allTopics: FlattenedTopic[] = useMemo(() => flattenTopics(syllabus), [syllabus]);

  const getTopic = useCallback(
    (topicId: string) => normalizeEntry(progress[topicId]),
    [progress]
  );

  const setTopicStatus = useCallback((topicId: string, status: TopicStatus) => {
    setProgress((prev) => ({
      ...prev,
      [topicId]: {
        ...normalizeEntry(prev[topicId]),
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const cycleTopicStatus = useCallback((topicId: string) => {
    setProgress((prev) => {
      const current = normalizeEntry(prev[topicId]).status;
      const next =
        current === TOPIC_STATUS.PENDING
          ? TOPIC_STATUS.IN_PROGRESS
          : current === TOPIC_STATUS.IN_PROGRESS
            ? TOPIC_STATUS.COMPLETED
            : TOPIC_STATUS.PENDING;
      return {
        ...prev,
        [topicId]: {
          ...normalizeEntry(prev[topicId]),
          status: next,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const toggleCompleted = useCallback((topicId: string) => {
    setProgress((prev) => {
      const current = normalizeEntry(prev[topicId]);
      const nextStatus =
        current.status === TOPIC_STATUS.COMPLETED
          ? TOPIC_STATUS.PENDING
          : TOPIC_STATUS.COMPLETED;
      return {
        ...prev,
        [topicId]: {
          ...current,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const setTopicNotes = useCallback((topicId: string, notes: string) => {
    setProgress((prev) => ({
      ...prev,
      [topicId]: {
        ...normalizeEntry(prev[topicId]),
        notes: notes || '',
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const markAllCompleted = useCallback(() => {
    const now = new Date().toISOString();
    setProgress((prev) => {
      const next = { ...prev };
      for (const { topic } of allTopics) {
        next[topic.id] = {
          ...normalizeEntry(prev[topic.id]),
          status: TOPIC_STATUS.COMPLETED,
          updatedAt: now,
        };
      }
      return next;
    });
  }, [allTopics]);

  const resetProgress = useCallback(() => {
    setProgress({});
  }, []);

  const stats = useMemo(() => {
    const total = allTopics.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    for (const { topic } of allTopics) {
      const status = normalizeEntry(progress[topic.id]).status;
      if (status === TOPIC_STATUS.COMPLETED) completed += 1;
      else if (status === TOPIC_STATUS.IN_PROGRESS) inProgress += 1;
      else pending += 1;
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const bySubject: Record<string, SubjectProgressStats> = {};
    for (const subject of syllabus.subjects) {
      let sTotal = 0;
      let sDone = 0;
      let sProg = 0;
      let sPend = 0;
      for (const cat of subject.categories) {
        for (const topic of cat.topics) {
          sTotal += 1;
          const st = normalizeEntry(progress[topic.id]).status;
          if (st === TOPIC_STATUS.COMPLETED) sDone += 1;
          else if (st === TOPIC_STATUS.IN_PROGRESS) sProg += 1;
          else sPend += 1;
        }
      }
      bySubject[subject.id] = {
        total: sTotal,
        completed: sDone,
        inProgress: sProg,
        pending: sPend,
        percent: sTotal > 0 ? Math.round((sDone / sTotal) * 100) : 0,
      };
    }

    return {
      total,
      completed,
      inProgress,
      pending,
      remaining: total - completed,
      percent,
      bySubject,
    };
  }, [allTopics, progress, syllabus.subjects]);

  return {
    syllabus,
    progress,
    allTopics,
    stats,
    getTopic,
    setTopicStatus,
    cycleTopicStatus,
    toggleCompleted,
    setTopicNotes,
    markAllCompleted,
    resetProgress,
  };
}
