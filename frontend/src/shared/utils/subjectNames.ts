export function normalizeSubjectKey(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function namesMatch(a: unknown, b: unknown): boolean {
  if (!a || !b) return false;
  return normalizeSubjectKey(a) === normalizeSubjectKey(b);
}

export function sortSubjectsForExam<T extends { name: string }>(
  catalogList: T[] | null | undefined,
  examSubjects: unknown,
  { isMine = false }: { isMine?: boolean } = {}
): T[] {
  const list = Array.isArray(catalogList) ? catalogList : [];
  if (isMine || !list.length) return list;

  const order = Array.isArray(examSubjects) ? examSubjects : [];
  if (!order.length) return list;

  const byKey = new Map(list.map((row) => [normalizeSubjectKey(row.name), row]));
  const used = new Set<string>();
  const sorted: T[] = [];

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
