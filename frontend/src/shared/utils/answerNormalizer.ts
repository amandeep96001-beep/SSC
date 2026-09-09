export const normalizeAnswer = (answer: unknown): number | null => {
  if (answer === null || answer === undefined) return null;

  if (typeof answer === 'number') return answer;

  if (typeof answer === 'string') {
    const upper = answer.toUpperCase().trim();
    if (upper === 'A') return 0;
    if (upper === 'B') return 1;
    if (upper === 'C') return 2;
    if (upper === 'D') return 3;

    const num = parseInt(answer, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 3) return num;
  }

  return null;
};

export const indexToLetter = (idx: number | null | undefined): string | null => {
  if (idx === null || idx === undefined) return null;
  const letters = ['A', 'B', 'C', 'D'];
  return letters[idx] || null;
};

export const normalizeQuestion = <T extends { a?: unknown }>(question: T): T & { a: number | null } => {
  return {
    ...question,
    a: normalizeAnswer(question.a),
  };
};

export const normalizeQuestions = <T extends { a?: unknown }>(questions?: T[] | null) => {
  return (questions || []).map(normalizeQuestion);
};
