/**
 * Normalize subject names for comparison (spacing, hyphens, case).
 */
export function normalizeSubjectKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function namesMatch(a, b) {
  if (!a || !b) return false;
  return normalizeSubjectKey(a) === normalizeSubjectKey(b);
}

/**
 * Show every catalog subject. Exam config (from DB) only affects sort order.
 */
export function sortSubjectsForExam(catalogList, examSubjects, { isMine = false } = {}) {
  const list = Array.isArray(catalogList) ? catalogList : [];
  if (isMine || !list.length) return list;

  const order = Array.isArray(examSubjects) ? examSubjects : [];
  if (!order.length) return list;

  const byKey = new Map(list.map((row) => [normalizeSubjectKey(row.name), row]));
  const used = new Set();
  const sorted = [];

  order.forEach((label) => {
    const key = normalizeSubjectKey(label);
    const row = byKey.get(key);
    if (!row || used.has(key)) return;
    used.add(key);
    sorted.push(row);
  });

  list.forEach((row) => {
    const key = normalizeSubjectKey(row.name);
    if (!used.has(key)) {
      used.add(key);
      sorted.push(row);
    }
  });

  return sorted;
}
