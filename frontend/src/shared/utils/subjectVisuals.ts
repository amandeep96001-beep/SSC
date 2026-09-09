/**
 * Subject → short label + accent tone for the syllabus roster.
 */
const SUBJECT_VISUALS = [
  {
    match: /quant|aptitude|math|numerical|arithmetic/i,
    label: 'Numbers, arithmetic & DI',
    tone: 'blue',
  },
  {
    match: /english|comprehension|vocab|grammar|language/i,
    label: 'Grammar, vocab & reading',
    tone: 'lavender',
  },
  {
    match: /general.?awareness|g\.?k|current.?affairs|gk\b|awareness/i,
    label: 'GK, current affairs & static',
    tone: 'peach',
  },
  {
    match: /reason|intelligence|logic|puzzle/i,
    label: 'Logic, puzzles & patterns',
    tone: 'mint',
  },
];

const FALLBACK = {
  label: 'Study materials',
  tone: 'blue',
};

export function getSubjectVisual(subjectName = '') {
  const name = String(subjectName).trim();
  const found = SUBJECT_VISUALS.find((entry) => entry.match.test(name));
  return found
    ? { label: found.label, tone: found.tone }
    : { ...FALLBACK };
}
