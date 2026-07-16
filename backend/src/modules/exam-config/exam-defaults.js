/** Default exam → subjects (admin can override in DB) */
export const EXAM_DEFAULTS = {
  ssc: {
    name: 'SSC',
    fullName: 'SSC CGL / CHSL / MTS',
    subjects: ['Quantitative Aptitude', 'English Comprehension', 'General Awareness', 'Reasoning'],
  },
  banking: {
    name: 'Banking',
    fullName: 'IBPS / SBI / RBI',
    subjects: ['Quantitative Aptitude', 'English Comprehension', 'Reasoning', 'General Awareness'],
  },
  railways: {
    name: 'Railways',
    fullName: 'RRB NTPC / Group D / ALP',
    subjects: ['Quantitative Aptitude', 'Reasoning', 'General Awareness'],
  },
  upsc: {
    name: 'UPSC',
    fullName: 'UPSC CSE Prelims',
    subjects: ['General Awareness', 'English Comprehension', 'Reasoning'],
  },
  cat: {
    name: 'CAT',
    fullName: 'CAT / XAT / SNAP',
    subjects: ['Quantitative Aptitude', 'English Comprehension', 'Reasoning'],
  },
  state_psc: {
    name: 'State PSC',
    fullName: 'State PCS / Police / Teaching',
    subjects: ['General Awareness', 'Quantitative Aptitude', 'English Comprehension', 'Reasoning'],
  },
  other: {
    name: 'Custom',
    fullName: 'Any competitive exam',
    subjects: ['Quantitative Aptitude', 'English Comprehension', 'General Awareness', 'Reasoning'],
  },
};
