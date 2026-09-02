/** Default exam → subjects (admin can override in DB). These are safe fallbacks for SSC while admin-managed data is still allowed to take precedence. */
export const EXAM_DEFAULTS = {
  ssc: {
    name: 'SSC',
    fullName: 'SSC CGL / CHSL / MTS',
    subjects: [],
  },
  banking: {
    name: 'Banking',
    fullName: 'IBPS / SBI / RBI',
    subjects: [],
  },
  railways: {
    name: 'Railways',
    fullName: 'RRB NTPC / Group D / ALP',
    subjects: [],
  },
  upsc: {
    name: 'UPSC',
    fullName: 'UPSC CSE Prelims',
    subjects: [],
  },
  cat: {
    name: 'CAT',
    fullName: 'CAT / XAT / SNAP',
    subjects: [],
  },
  state_psc: {
    name: 'State PSC',
    fullName: 'State PCS / Police / Teaching',
    subjects: [],
  },
  other: {
    name: 'Custom',
    fullName: 'Any competitive exam',
    subjects: [],
  },
};
