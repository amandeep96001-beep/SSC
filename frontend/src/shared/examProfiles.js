/**
 * Multi-exam profiles — drives marking, paper shape, copy, and Today Focus tips.
 * Content banks can stay shared; UX adapts to the selected target exam.
 */

export const EXAM_PROFILES = {
  ssc: {
    id: 'ssc',
    name: 'SSC',
    fullName: 'SSC CGL / CHSL / MTS',
    tagline: 'Speed + accuracy for Tier-I style papers',
    accent: '#6366f1',
    sections: ['English', 'GK', 'Quant', 'Reasoning'],
    mockQuestions: 100,
    mockMinutes: 60,
    marking: { correct: 2, wrong: -0.5, unattempted: 0 },
    markingLabel: '+2 correct · −0.5 wrong',
    coachLabel: 'SSC Tier-I coach',
    pyqLabel: 'Previous year questions',
    subjectsFocus: ['Quantitative Aptitude', 'English Comprehension', 'General Awareness', 'Reasoning'],
    dailyGoals: [
      { id: 'drill', label: '20 speed drills', view: 'drill' },
      { id: 'notes', label: 'Revise 1 syllabus topic', view: 'subjects' },
      { id: 'mock', label: '1 sectional / full mock practice', view: 'mock' },
      { id: 'wrong', label: 'Clear 5 wrong questions', view: 'drill' },
    ],
    caTips: [
      'Scan last 6 months current affairs — appointments, schemes, sports.',
      'Revise static GK: polity articles, geography capitals, history timelines.',
      'One newspaper editorial + 10 one-liners daily beats cramming.',
    ],
    missFixes: [
      'Sectional timing — many lose marks rushing Quant.',
      'Negative marking discipline — skip doubtful GK.',
      'Previous-year pattern recognition over random PDFs.',
    ],
  },
  banking: {
    id: 'banking',
    name: 'Banking',
    fullName: 'IBPS / SBI / RBI',
    tagline: 'Prelims + Mains speed with banking awareness',
    accent: '#0ea5e9',
    sections: ['English', 'Quant', 'Reasoning', 'GA'],
    mockQuestions: 100,
    mockMinutes: 60,
    marking: { correct: 1, wrong: -0.25, unattempted: 0 },
    markingLabel: '+1 correct · −0.25 wrong (typical prelims)',
    coachLabel: 'Banking prelims coach',
    pyqLabel: 'Banking PYQs',
    subjectsFocus: ['Quantitative Aptitude', 'English Comprehension', 'Reasoning', 'General Awareness'],
    dailyGoals: [
      { id: 'drill', label: 'DI / simplification set', view: 'drill' },
      { id: 'notes', label: 'Banking awareness notes', view: 'subjects' },
      { id: 'mock', label: 'Prelims-style mock / sectional', view: 'mock' },
      { id: 'wrong', label: 'Puzzle + seating revision', view: 'revision' },
    ],
    caTips: [
      'RBI circulars, repo/reverse repo, and recent monetary policy.',
      'Bank mergers, digital payments schemes, financial inclusion.',
      'Budget & economic survey one-pagers every week.',
    ],
    missFixes: [
      'Puzzle accuracy under time — most fail here in prelims.',
      'Approximation & DI speed practice daily.',
      'Banking awareness is ignored until too late — start now.',
    ],
  },
  railways: {
    id: 'railways',
    name: 'Railways',
    fullName: 'RRB NTPC / Group D / ALP',
    tagline: 'High-volume GK + maths accuracy',
    accent: '#f59e0b',
    sections: ['Maths', 'Reasoning', 'GK', 'General Science'],
    mockQuestions: 100,
    mockMinutes: 90,
    marking: { correct: 1, wrong: -0.33, unattempted: 0 },
    markingLabel: '+1 correct · −⅓ wrong (typical CBT)',
    coachLabel: 'RRB CBT coach',
    pyqLabel: 'Railway PYQs',
    subjectsFocus: ['Quantitative Aptitude', 'Reasoning', 'General Awareness'],
    dailyGoals: [
      { id: 'drill', label: 'Maths speed set', view: 'drill' },
      { id: 'notes', label: 'Science + static GK revision', view: 'subjects' },
      { id: 'mock', label: 'CBT-style practice paper', view: 'mock' },
      { id: 'wrong', label: 'Review wrong log', view: 'drill' },
    ],
    caTips: [
      'Railway zones, ministers, recent infra projects.',
      'General science NCERT class 6–10 high-yield facts.',
      'Current affairs: awards, sports, national schemes.',
    ],
    missFixes: [
      'Volume practice — Railway papers reward speed stamina.',
      'Science basics over advanced theory.',
      'Don’t ignore previous CBT cutoffs for your zone.',
    ],
  },
  upsc: {
    id: 'upsc',
    name: 'UPSC',
    fullName: 'UPSC CSE Prelims',
    tagline: 'Concept depth + current affairs consistency',
    accent: '#10b981',
    sections: ['GS Paper I', 'CSAT'],
    mockQuestions: 100,
    mockMinutes: 120,
    marking: { correct: 2, wrong: -0.66, unattempted: 0 },
    markingLabel: '+2 correct · −⅔ wrong (GS Paper I)',
    coachLabel: 'UPSC Prelims coach',
    pyqLabel: 'UPSC PYQs',
    subjectsFocus: ['General Awareness', 'English Comprehension', 'Reasoning'],
    dailyGoals: [
      { id: 'notes', label: '1 GS topic + short notes', view: 'subjects' },
      { id: 'drill', label: 'CSAT aptitude set', view: 'drill' },
      { id: 'mock', label: 'PYQ / mock analysis', view: 'mock' },
      { id: 'wrong', label: 'Revise weak GS areas', view: 'performance' },
    ],
    caTips: [
      'Daily newspaper + monthly CA compilation — map to syllabus.',
      'Link current affairs to polity, economy, environment, IR.',
      'CSAT practice weekly even if you feel strong.',
    ],
    missFixes: [
      'PYQ-first learning — UPSC repeats themes, not questions.',
      'Elimination technique & option analysis.',
      'Revision cycles beat new material binge.',
    ],
  },
  cat: {
    id: 'cat',
    name: 'CAT',
    fullName: 'CAT / XAT / SNAP',
    tagline: 'VARC · DILR · Quant — accuracy under pressure',
    accent: '#8b5cf6',
    sections: ['VARC', 'DILR', 'Quant'],
    mockQuestions: 66,
    mockMinutes: 120,
    marking: { correct: 3, wrong: -1, unattempted: 0 },
    markingLabel: '+3 correct · −1 wrong (CAT MCQ)',
    coachLabel: 'CAT aptitude coach',
    pyqLabel: 'MBA entrance PYQs',
    subjectsFocus: ['Quantitative Aptitude', 'English Comprehension', 'Reasoning'],
    dailyGoals: [
      { id: 'drill', label: 'Quant / LR set', view: 'drill' },
      { id: 'notes', label: 'RC / grammar practice', view: 'subjects' },
      { id: 'mock', label: 'Sectional mock', view: 'mock' },
      { id: 'wrong', label: 'Error log review', view: 'drill' },
    ],
    caTips: [
      'Read diverse editorials for VARC tone & inference.',
      'DILR: one set daily — focus on set selection skill.',
      'Track accuracy % more than attempts early on.',
    ],
    missFixes: [
      'Set selection in DILR — biggest rank differentiator.',
      'Don’t chase 100% attempts; protect accuracy.',
      'Mock analysis > mock count.',
    ],
  },
  state_psc: {
    id: 'state_psc',
    name: 'State PSC',
    fullName: 'State PCS / Police / Teaching',
    tagline: 'State GK + GS + aptitude mix',
    accent: '#ef4444',
    sections: ['GS', 'Aptitude', 'State GK', 'Language'],
    mockQuestions: 150,
    mockMinutes: 120,
    marking: { correct: 1, wrong: -0.25, unattempted: 0 },
    markingLabel: '+1 correct · −0.25 wrong (typical)',
    coachLabel: 'State PSC coach',
    pyqLabel: 'State exam PYQs',
    subjectsFocus: ['General Awareness', 'Quantitative Aptitude', 'English Comprehension', 'Reasoning'],
    dailyGoals: [
      { id: 'notes', label: 'State GK + GS notes', view: 'subjects' },
      { id: 'drill', label: 'Aptitude drills', view: 'drill' },
      { id: 'mock', label: 'Full / sectional practice', view: 'mock' },
      { id: 'wrong', label: 'Weak topic revision', view: 'performance' },
    ],
    caTips: [
      'State budget, schemes, districts, rivers, culture.',
      'National CA + state-specific current affairs split 60/40.',
      'Previous state papers for local pattern.',
    ],
    missFixes: [
      'State GK is the silent rank booster.',
      'Language paper practice if your exam has one.',
      'Map syllabus to official notification every cycle.',
    ],
  },
  other: {
    id: 'other',
    name: 'Custom',
    fullName: 'Any competitive exam',
    tagline: 'Flexible prep for your target paper',
    accent: '#64748b',
    sections: ['Section A', 'Section B', 'Section C', 'Section D'],
    mockQuestions: 100,
    mockMinutes: 60,
    marking: { correct: 1, wrong: 0, unattempted: 0 },
    markingLabel: 'Custom — set marking in your mocks',
    coachLabel: 'Exam coach',
    pyqLabel: 'Previous year questions',
    subjectsFocus: ['Quantitative Aptitude', 'English Comprehension', 'General Awareness', 'Reasoning'],
    dailyGoals: [
      { id: 'drill', label: 'Practice drills', view: 'drill' },
      { id: 'notes', label: 'Cover syllabus topics', view: 'subjects' },
      { id: 'mock', label: 'Timed mock', view: 'mock' },
      { id: 'wrong', label: 'Fix mistakes', view: 'performance' },
    ],
    caTips: [
      'Build a weekly current-affairs habit tied to your syllabus.',
      'Track accuracy and time per section.',
      'Revision > new material in the last 30 days.',
    ],
    missFixes: [
      'Define your exact paper pattern early.',
      'Keep an error notebook / wrong log.',
      'Simulate exam conditions at least weekly.',
    ],
  },
};

export const EXAM_LIST = Object.values(EXAM_PROFILES);

export function getExamProfile(id) {
  return EXAM_PROFILES[id] || EXAM_PROFILES.ssc;
}

export function daysUntil(isoDate) {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}
