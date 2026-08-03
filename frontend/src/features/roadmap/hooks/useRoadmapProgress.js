import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TOPIC_STATUS,
  flattenTopics,
  getExamSyllabus,
  EXAM_PROFILE_TO_SYLLABUS,
  DEFAULT_EXAM_KEY,
} from '../data/syllabus';

const STORAGE_PREFIX = 'examprep_roadmap_progress_';

/**
 * @typedef {Object} TopicProgress
 * @property {'pending'|'in_progress'|'completed'} status
 * @property {string|null} updatedAt
 * @property {string} notes
 */

/**
 * @param {string} examKey
 * @returns {Record<string, TopicProgress>}
 */
function loadProgress(examKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + examKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} examKey
 * @param {Record<string, TopicProgress>} progress
 */
function saveProgress(examKey, progress) {
  try {
    localStorage.setItem(STORAGE_PREFIX + examKey, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save roadmap progress', e);
  }
}

/**
 * @param {Partial<TopicProgress>=} entry
 * @returns {TopicProgress}
 */
function normalizeEntry(entry) {
  return {
    status: entry?.status || TOPIC_STATUS.PENDING,
    updatedAt: entry?.updatedAt || null,
    notes: entry?.notes || '',
  };
}

/**
 * Resolve syllabus key from app exam profile id.
 * @param {string} [examProfileId]
 */
export function resolveSyllabusKey(examProfileId) {
  if (!examProfileId) return DEFAULT_EXAM_KEY;
  return EXAM_PROFILE_TO_SYLLABUS[examProfileId] || DEFAULT_EXAM_KEY;
}

/**
 * Hook: syllabus + progress for one exam roadmap.
 * @param {{ examKey?: string }} [opts]
 */
export function useRoadmapProgress({ examKey = DEFAULT_EXAM_KEY } = {}) {
  const syllabus = useMemo(() => getExamSyllabus(examKey), [examKey]);
  const [progress, setProgress] = useState(() => loadProgress(examKey));

  useEffect(() => {
    setProgress(loadProgress(examKey));
  }, [examKey]);

  useEffect(() => {
    saveProgress(examKey, progress);
  }, [examKey, progress]);

  const allTopics = useMemo(() => flattenTopics(syllabus), [syllabus]);

  const getTopic = useCallback(
    (topicId) => normalizeEntry(progress[topicId]),
    [progress]
  );

  const setTopicStatus = useCallback((topicId, status) => {
    setProgress((prev) => ({
      ...prev,
      [topicId]: {
        ...normalizeEntry(prev[topicId]),
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const cycleTopicStatus = useCallback((topicId) => {
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

  const toggleCompleted = useCallback((topicId) => {
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

  const setTopicNotes = useCallback((topicId, notes) => {
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

    /** @type {Record<string, { total: number, completed: number, inProgress: number, pending: number, percent: number }>} */
    const bySubject = {};
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
