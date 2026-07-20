const LIMITS_STORAGE_KEY = 'examprep_mock_section_limits_by_exam';

export function sectionKeysFromLimits(limits) {
  if (!limits || typeof limits !== 'object') return [];
  return Object.keys(limits);
}

export function countBySection(questions, sections = null) {
  const keys = sections?.length
    ? sections
    : [...new Set((questions || []).map((q) => q?.section).filter(Boolean))];
  const counts = Object.fromEntries(keys.map((s) => [s, 0]));
  for (const q of questions || []) {
    const s = q?.section;
    if (!s) continue;
    if (counts[s] == null) counts[s] = 0;
    counts[s] += 1;
  }
  return counts;
}

/**
 * @param {Array<{ section?: string }>} questions
 * @param {Record<string, number>|null|undefined} limits
 */
export function validateMockSectionLimits(questions, limits) {
  const sections = sectionKeysFromLimits(limits);
  const counts = countBySection(questions, sections);
  if (!limits || typeof limits !== 'object' || sections.length === 0) {
    return { ok: true, counts, issues: [], summary: '', expectedTotal: 0, actualTotal: questions?.length || 0 };
  }

  const issues = [];
  for (const section of sections) {
    const limit = Number(limits[section] ?? 0);
    const n = counts[section] || 0;
    if (!Number.isFinite(limit) || limit < 0) continue;

    if (limit === 0) {
      if (n > 0) {
        issues.push({
          section,
          count: n,
          limit,
          type: 'extra',
          message: `${section}: ${n} added, but this pattern expects 0.`,
        });
      }
      continue;
    }

    if (n < limit) {
      issues.push({
        section,
        count: n,
        limit,
        type: 'few',
        message: `${section}: ${n} questions — too few (expected ${limit}).`,
      });
    } else if (n > limit) {
      issues.push({
        section,
        count: n,
        limit,
        type: 'many',
        message: `${section}: ${n} questions — too many (expected ${limit}).`,
      });
    }
  }

  // Unexpected sections not in pattern
  for (const q of questions || []) {
    const s = q?.section;
    if (s && limits[s] == null) {
      const already = issues.some((i) => i.section === s && i.type === 'unexpected');
      if (!already) {
        const n = (questions || []).filter((row) => row.section === s).length;
        issues.push({
          section: s,
          count: n,
          limit: 0,
          type: 'unexpected',
          message: `${s}: not part of this exam pattern.`,
        });
      }
    }
  }

  const expectedTotal = sections.reduce((sum, s) => sum + Number(limits[s] || 0), 0);
  const actualTotal = questions?.length || 0;

  let summary = '';
  if (issues.length) {
    summary =
      `Not a proper ${expectedTotal}-question mock for this exam. `
      + issues.map((i) => i.message).join(' ');
  }

  return {
    ok: issues.length === 0,
    counts,
    issues,
    expectedTotal,
    actualTotal,
    summary,
  };
}

export function formatSectionLimitsLabel(limits) {
  if (!limits) return '';
  return sectionKeysFromLimits(limits)
    .filter((s) => Number(limits[s]) > 0)
    .map((s) => `${s} ${limits[s]}`)
    .join(' · ');
}

export function totalFromLimits(limits) {
  if (!limits) return 0;
  return sectionKeysFromLimits(limits).reduce((sum, s) => sum + Number(limits[s] || 0), 0);
}

export function loadStoredLimitsByExam() {
  try {
    const raw = localStorage.getItem(LIMITS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStoredLimitsForExam(examId, limits) {
  const all = loadStoredLimitsByExam();
  all[examId] = limits;
  localStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(all));
}

export function getEffectiveLimits(examId, examDefaults) {
  const stored = loadStoredLimitsByExam()[examId];
  if (stored && typeof stored === 'object') return { ...stored };
  return examDefaults ? { ...examDefaults } : {};
}

/** Ensure limits object has a key for every exam section */
export function mergeLimitsWithSections(limits, sections) {
  const next = { ...(limits || {}) };
  (sections || []).forEach((s) => {
    if (next[s] == null) next[s] = 0;
  });
  return next;
}
