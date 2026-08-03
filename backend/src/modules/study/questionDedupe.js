/** Shared topic-question dedupe helpers (normalize + filter). */

export function normalizeQuestionText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate + dedupe incoming MCQs against an optional existing set.
 * @param {Array} rawList
 * @param {string} topicId
 * @param {Iterable<string>} [existingNormalizedKeys]
 * @returns {{ toInsert: object[], duplicates: number, invalid: number, received: number }}
 */
export function filterNewTopicQuestions(rawList, topicId, existingNormalizedKeys = []) {
  const list = Array.isArray(rawList) ? rawList : [];
  const seen = new Set(
    [...existingNormalizedKeys].map((k) => normalizeQuestionText(k)).filter(Boolean)
  );

  const toInsert = [];
  let duplicates = 0;
  let invalid = 0;

  for (const raw of list) {
    const q = String(raw?.q ?? '').trim();
    const o = Array.isArray(raw?.o) ? raw.o.map((x) => String(x ?? '').trim()) : [];
    const a = Number(raw?.a);
    if (!q || o.length < 4 || o.some((x) => !x) || !Number.isInteger(a) || a < 0 || a > 3) {
      invalid++;
      continue;
    }
    const key = normalizeQuestionText(q);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    toInsert.push({
      topicId,
      q,
      o: o.slice(0, 4),
      a,
      e: String(raw?.e ?? '').trim(),
      ...(raw?.state ? { state: String(raw.state) } : {}),
    });
  }

  return {
    toInsert,
    duplicates,
    invalid,
    received: list.length,
  };
}
