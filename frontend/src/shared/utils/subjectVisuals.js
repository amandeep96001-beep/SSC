/**
 * Subject → Google Material Symbol + accent colors for syllabus cards.
 * Icons from Google Material Symbols (fonts.google.com/icons).
 */
const SUBJECT_VISUALS = [
  {
    match: /quant|aptitude|math|numerical|arithmetic/i,
    icon: 'calculate',
    label: 'Numbers, arithmetic & DI',
    tone: 'blue',
  },
  {
    match: /english|comprehension|vocab|grammar|language/i,
    icon: 'menu_book',
    label: 'Grammar, vocab & reading',
    tone: 'lavender',
  },
  {
    match: /general.?awareness|g\.?k|current.?affairs|gk\b|awareness/i,
    icon: 'public',
    label: 'GK, current affairs & static',
    tone: 'peach',
  },
  {
    match: /reason|intelligence|logic|puzzle/i,
    icon: 'psychology',
    label: 'Logic, puzzles & patterns',
    tone: 'mint',
  },
];

const FALLBACK = {
  icon: 'auto_stories',
  label: 'Study materials',
  tone: 'blue',
};

export function getSubjectVisual(subjectName = '') {
  const name = String(subjectName).trim();
  const found = SUBJECT_VISUALS.find((entry) => entry.match.test(name));
  return found
    ? { icon: found.icon, label: found.label, tone: found.tone }
    : { ...FALLBACK };
}
