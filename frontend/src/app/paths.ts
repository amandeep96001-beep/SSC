/**
 * App route paths — reload-safe URLs for every workspace.
 */

import type { PathContext } from '@/types/app';

export function encodeSlug(value: unknown): string {
  return encodeURIComponent(String(value || '').trim());
}

export function decodeSlug(value: unknown): string {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
}

function withSource(path: string, source?: string | null): string {
  if (source === 'mine') return `${path}?source=mine`;
  return path;
}

export const paths = {
  home: '/',
  drill: '/drill',
  study: (source?: string | null) => withSource('/study', source),
  studySubject: (subject: string, source?: string | null) =>
    withSource(`/study/${encodeSlug(subject)}`, source),
  studyTopic: (subject: string, topicId: string, source?: string | null) =>
    withSource(`/study/${encodeSlug(subject)}/${encodeSlug(topicId)}`, source),
  studyTest: (subject: string, topicId: string, source?: string | null) =>
    withSource(`/study/${encodeSlug(subject)}/${encodeSlug(topicId)}/test`, source),
  results: '/results',
  mock: '/mock',
  mockExam: (mockId: string) => `/mock/${encodeSlug(mockId)}/exam`,
  admin: '/admin',
  roadmap: '/roadmap',
  revision: '/revision',
  performance: '/performance',
  analytics: '/analytics',
  competition: '/competition',
  reminders: '/reminders',
};

const TOP_LEVEL: Record<string, string> = {
  '/': 'home',
  '/home': 'home',
  '/drill': 'drill',
  '/study': 'subjects',
  '/results': 'results',
  '/mock': 'mock',
  '/admin': 'admin',
  '/roadmap': 'roadmap',
  '/revision': 'revision',
  '/performance': 'performance',
  '/analytics': 'analytics',
  '/competition': 'competition',
  '/reminders': 'reminders',
};

export interface ParsedAppPath {
  view: string;
  subjectSlug?: string;
  topicId?: string;
  mockId?: string;
}

/** Parse pathname → view + study/mock params (works without Route context). */
export function parseAppPath(pathname = ''): ParsedAppPath {
  const path = String(pathname || '').split('?')[0].replace(/\/+$/, '') || '/';

  if (TOP_LEVEL[path]) {
    return { view: TOP_LEVEL[path] };
  }

  const mockExam = path.match(/^\/mock\/([^/]+)\/exam$/);
  if (mockExam) {
    return { view: 'mock_exam_active', mockId: decodeSlug(mockExam[1]) };
  }

  const studyTest = path.match(/^\/study\/([^/]+)\/([^/]+)\/test$/);
  if (studyTest) {
    return {
      view: 'test',
      subjectSlug: decodeSlug(studyTest[1]),
      topicId: decodeSlug(studyTest[2]),
    };
  }

  const studyNotes = path.match(/^\/study\/([^/]+)\/([^/]+)$/);
  if (studyNotes) {
    return {
      view: 'notes',
      subjectSlug: decodeSlug(studyNotes[1]),
      topicId: decodeSlug(studyNotes[2]),
    };
  }

  const studyTopics = path.match(/^\/study\/([^/]+)$/);
  if (studyTopics) {
    return {
      view: 'topics',
      subjectSlug: decodeSlug(studyTopics[1]),
    };
  }

  return { view: 'home' };
}

export function resolveViewFromPath(pathname: string): string {
  return parseAppPath(pathname).view;
}

/** Map legacy activeView + context → URL path. */
export function pathForView(view: string, ctx: PathContext = {}): string {
  const source = ctx.source === 'mine' ? 'mine' : undefined;
  switch (view) {
    case 'home':
      return paths.home;
    case 'drill':
      return paths.drill;
    case 'subjects':
      return paths.study(source);
    case 'topics':
      return ctx.subject ? paths.studySubject(ctx.subject, source) : paths.study(source);
    case 'notes':
      return ctx.subject && ctx.topicId
        ? paths.studyTopic(ctx.subject, ctx.topicId, source)
        : paths.study(source);
    case 'test':
      return ctx.subject && ctx.topicId
        ? paths.studyTest(ctx.subject, ctx.topicId, source)
        : paths.study(source);
    case 'results':
      return paths.results;
    case 'mock':
      return paths.mock;
    case 'mock_exam_active':
      return ctx.mockId ? paths.mockExam(ctx.mockId) : paths.mock;
    case 'admin':
      return paths.admin;
    case 'roadmap':
      return paths.roadmap;
    case 'revision':
      return paths.revision;
    case 'performance':
      return paths.performance;
    case 'analytics':
      return paths.analytics;
    case 'competition':
      return paths.competition;
    case 'reminders':
      return paths.reminders;
    default:
      return paths.home;
  }
}

export function isStudyView(view: string): boolean {
  return ['subjects', 'topics', 'notes'].includes(view);
}
