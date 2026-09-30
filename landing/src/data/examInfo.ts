/**
 * Landing exam facts, verified from official notices.
 * Update these objects when a new SSC / RRB notification changes the scheme.
 * Do not copy coaching-site numbers into this file.
 */
import type { ExamDetail } from '../types/landing.types';

export const CONTENT_VERIFIED = {
  lastVerifiedAt: '2026-09-30',
  disclaimer:
    'Pattern, marks and stages follow the recruitment notice. The next notification can change them. Always check the latest official notice.',
};

export interface SourceRef {
  label: string;
  url: string;
}

export const EXAMS_LIST: ExamDetail[] = [
  {
    id: 'cgl',
    name: 'SSC CGL',
    badge: 'Graduate',
    description:
      'Combined Graduate Level exam for Group B and Group C posts. The basic qualification is usually a Bachelor’s degree; some posts ask for a subject-specific degree. The computer-based exam has two tiers.',
    stats: [
      { label: 'Tier-I', value: '100 Q · 200' },
      { label: 'Tier-I time', value: '60 min' },
      { label: 'Tier-I negative', value: '−0.50' },
      { label: 'Mode', value: 'CBT' },
    ],
    subjects: [
      'General Intelligence & Reasoning',
      'General Awareness',
      'Quantitative Aptitude',
      'English Comprehension',
    ],
    stages: [
      'Application',
      'Tier-I (screening)',
      'Tier-II — Paper-I for all posts; Paper-II / Paper-III only for notified posts',
      'DEST is qualifying; document verification and post allocation follow through the user department',
    ],
    source: {
      label: 'SSC CGL 2026 notice',
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf',
    },
  },
  {
    id: 'chsl',
    name: 'SSC CHSL',
    badge: '10+2',
    description:
      'Combined Higher Secondary (10+2) Level exam for posts such as LDC/JSA and DEO. Minimum qualification is 10+2 / equivalent. After Tier-I, Tier-II includes computer sections and a Skill Test or Typing Test, depending on the post.',
    stats: [
      { label: 'Tier-I', value: '100 Q · 200' },
      { label: 'Tier-I time', value: '60 min' },
      { label: 'Tier-I negative', value: '−0.50' },
      { label: 'Skill / Typing', value: 'Qualifying' },
    ],
    subjects: [
      'English Language',
      'General Intelligence',
      'Quantitative Aptitude',
      'General Awareness',
    ],
    stages: [
      'Application',
      'Tier-I',
      'Tier-II Session-I (Maths, Reasoning, English, GA, Computer)',
      'Session-II Skill Test (DEO) or Typing Test (LDC/JSA) — qualifying',
      'Document verification by the user department',
    ],
    source: {
      label: 'SSC CHSL 2026 notice',
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2026.pdf',
    },
  },
  {
    id: 'gd',
    name: 'SSC GD',
    badge: 'Matric',
    description:
      'Constable (GD) / Rifleman (GD) in CAPFs, SSF and Assam Rifles. Matriculation / 10th is required. The written paper is not the full process — CBE is followed by PET/PST, medical examination and document verification.',
    stats: [
      { label: 'CBE', value: '80 Q · 160' },
      { label: 'CBE time', value: '60 min' },
      { label: 'Negative', value: '−0.25' },
      { label: 'Level', value: 'Matric' },
    ],
    subjects: [
      'General Intelligence & Reasoning',
      'General Knowledge & Awareness',
      'Elementary Mathematics',
      'English / Hindi',
    ],
    stages: [
      'Application',
      'Computer Based Examination',
      'PET / PST (shortlisted candidates)',
      'Medical examination and document verification',
    ],
    source: {
      label: 'SSC GD 2026 notice',
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/notice_01122025.pdf',
    },
  },
  {
    id: 'cpo',
    name: 'SSC CPO',
    badge: 'SI',
    description:
      'Sub-Inspector in Delhi Police and CAPFs. Qualification is a Bachelor’s degree. Paper-I is followed by PST/PET, then Paper-II. The 2025 cycle used the same sequence. Height, chest and race standards differ by post and category in the notice.',
    stats: [
      { label: 'Paper-I', value: '200 Q · 200' },
      { label: 'Paper-I time', value: '2 hours' },
      { label: 'Negative', value: '−0.25' },
      { label: 'Paper-II', value: 'English' },
    ],
    subjects: [
      'General Intelligence & Reasoning',
      'General Knowledge & Awareness',
      'Quantitative Aptitude',
      'English Comprehension',
    ],
    stages: [
      'Application',
      'Paper-I',
      'PST / PET (qualifying; ESM PET exemption as per the notice)',
      'Paper-II — only for candidates who qualify PST/PET',
      'Detailed Medical Examination',
    ],
    source: {
      label: 'SSC SI (CPO) 2024 notice; 2025 Paper-I result followed this sequence',
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/final%20notice%20cpo%202024%2004.03.2024.pdf',
    },
  },
  {
    id: 'mts',
    name: 'SSC MTS',
    badge: 'Matric',
    description:
      'Multi-Tasking Staff and Havaldar (CBIC & CBN). MTS is decided through the Computer Based Examination. Havaldar also has PET/PST after the CBE. Session-I has no negative marking; Session-II does.',
    stats: [
      { label: 'Session-I', value: '40 Q · no −ve' },
      { label: 'Session-II', value: '50 Q · −1' },
      { label: 'Each session', value: '45 min' },
      { label: 'Havaldar', value: '+ PET/PST' },
    ],
    subjects: [
      'Numerical & Mathematical Ability',
      'Reasoning & Problem Solving',
      'General Awareness',
      'English Language & Comprehension',
    ],
    stages: [
      'Application',
      'CBE Session-I (must qualify; Session-II is evaluated only then)',
      'CBE Session-II (merit is based on this session)',
      'Havaldar applicants: PET/PST',
      'Document verification / allocation as applicable',
    ],
    source: {
      label: 'SSC MTS & Havaldar 2025 notice',
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_mts_2025.pdf',
    },
  },
];

export interface FlowStep {
  label: string;
  detail: string;
}

export interface ExamProcess {
  id: string;
  name: string;
  steps: FlowStep[];
  caution: string;
}

export const SSC_PROCESSES: ExamProcess[] = [
  {
    id: 'cgl',
    name: 'SSC CGL',
    steps: [
      { label: 'Application', detail: 'Online form on ssc.gov.in' },
      { label: 'Tier-I', detail: 'CBT. Marks are used to shortlist for Tier-II' },
      { label: 'Tier-II', detail: 'Paper-I for all posts. Paper-II for JSO / SI Grade-II. Paper-III for AAO' },
      { label: 'DEST', detail: 'Paper-I Section-IV. Qualifying. Some posts set a higher standard' },
      { label: 'Allocation', detail: 'Merit + post preference. The user department checks documents' },
    ],
    caution: 'The CGL 2026 notice puts a 15-minute sectional timer on each Tier-I subject. Do not treat the older “60 minutes with no section lock” pattern as current.',
  },
  {
    id: 'chsl',
    name: 'SSC CHSL',
    steps: [
      { label: 'Application', detail: '10+2 result must be declared by the cut-off date' },
      { label: 'Tier-I', detail: '100 questions, 60 minutes, 15-minute sectional timer' },
      { label: 'Tier-II Session-I', detail: 'Maths, Reasoning, English, GA, Computer Knowledge' },
      { label: 'Skill / Typing', detail: 'DEO: Skill Test. LDC/JSA: Typing Test. Both qualifying' },
      { label: 'DV', detail: 'The user department checks documents' },
    ],
    caution: 'DEO skill speed can be 15,000 or 8,000 key depressions per hour, depending on the post. The LDC/JSA typing medium chosen in the form is final.',
  },
  {
    id: 'gd',
    name: 'SSC GD',
    steps: [
      { label: 'Application', detail: 'Matric / 10th must be passed by the cut-off date' },
      { label: 'CBE', detail: '80 questions, 160 marks, 60 minutes' },
      { label: 'PET / PST', detail: 'Race plus height, chest and weight. Standards depend on category' },
      { label: 'Medical & DV', detail: 'DME / document scrutiny after shortlisting' },
    ],
    caution: 'Ex-servicemen may be exempt from PET, but measurement and medical still apply as per the notice. PET timings differ by gender and for the Ladakh region.',
  },
  {
    id: 'cpo',
    name: 'SSC CPO',
    steps: [
      { label: 'Application', detail: 'Bachelor’s degree' },
      { label: 'Paper-I', detail: '4 parts × 50 questions, 2 hours' },
      { label: 'PST / PET', detail: 'Qualifying. Paper-II is only after this stage' },
      { label: 'Paper-II', detail: 'English Language & Comprehension, 200 questions, 2 hours' },
      { label: 'DME', detail: 'Detailed Medical Examination' },
    ],
    caution: 'This sequence follows the SSC SI in Delhi Police & CAPFs 2024 notice and the 2025 Paper-I result write-up. Confirm the stage order in the next notice.',
  },
  {
    id: 'mts',
    name: 'SSC MTS',
    steps: [
      { label: 'Application', detail: 'MTS and Havaldar are different posts' },
      { label: 'Session-I', detail: 'Maths + Reasoning. No negative marking. Must qualify' },
      { label: 'Session-II', detail: 'GA + English. −1 per wrong answer. Merit comes from this session' },
      { label: 'Havaldar only', detail: 'PET/PST. Failure here does not automatically cancel an MTS preference' },
    ],
    caution: 'Session-II is evaluated only if Session-I is qualified. Minimum qualifying percentages by category are in the notice.',
  },
];

export interface SyllabusSubject {
  name: string;
  topics: string[];
}

export interface SyllabusStage {
  id: string;
  title: string;
  note?: string;
  subjects: SyllabusSubject[];
}

export interface SyllabusExam {
  id: string;
  name: string;
  stages: SyllabusStage[];
  source: SourceRef;
}

export const SSC_SYLLABUS: SyllabusExam[] = [
  {
    id: 'cgl',
    name: 'SSC CGL',
    source: EXAMS_LIST[0].source!,
    stages: [
      {
        id: 't1',
        title: 'Tier-I',
        note: 'Each subject: 25 questions / 50 marks. Total 60 minutes, with a 15-minute sectional timer per subject. −0.50 for a wrong answer. Quant is around Class 10; Reasoning, GA and English are around graduation level.',
        subjects: [
          {
            name: 'General Intelligence & Reasoning',
            topics: [
              'Analogy (semantic, symbolic, figural)',
              'Classification',
              'Series',
              'Coding-Decoding',
              'Venn Diagrams',
              'Syllogism / statement-conclusion',
              'Space orientation & visualisation',
              'Embedded figures, pattern folding',
              'Problem solving, word building',
            ],
          },
          {
            name: 'Quantitative Aptitude',
            topics: [
              'Number system, decimals, fractions',
              'Percentage, ratio, average',
              'Profit & loss, discount, interest',
              'Mixture, partnership',
              'Time & work, time & distance',
              'Algebra, graphs of linear equations',
              'Geometry, mensuration',
              'Trigonometry, heights & distances',
              'Histogram, bar diagram, pie chart',
            ],
          },
          {
            name: 'English Comprehension',
            topics: [
              'Correct English and basic comprehension',
              'Writing ability — the notice does not list separate topic heads',
              'Tier-II English covers vocabulary, grammar, cloze and reading comprehension in more detail',
            ],
          },
          {
            name: 'General Awareness',
            topics: [
              'History, culture',
              'Geography',
              'Economic scene',
              'General policy',
              'Scientific research',
              'Current events and everyday science',
              'India and neighbouring countries',
            ],
          },
        ],
      },
      {
        id: 't2',
        title: 'Tier-II · Paper-I (all posts)',
        note: 'Session-I: Sections I + II + Computer (2h 15m). Session-II: DEST 15 minutes, qualifying. −1 in Sections I and II. Each section must be qualified separately.',
        subjects: [
          {
            name: 'Mathematical Abilities (30 Q)',
            topics: [
              'Number systems',
              'Percentage, ratio, interest, profit & loss',
              'Time & work, time & distance, mixture',
              'Algebra, geometry, mensuration, trigonometry',
              'Basic statistics and simple probability',
              'DI: histogram, bar, pie',
            ],
          },
          {
            name: 'Reasoning (30 Q)',
            topics: [
              'Analogy, classification, series',
              'Coding, numerical operations',
              'Venn diagrams, embedded figures',
              'Space orientation, critical thinking',
            ],
          },
          {
            name: 'English (45 Q)',
            topics: [
              'Error spotting, fill in the blanks',
              'Synonyms, antonyms, spellings',
              'Idioms, one-word substitution',
              'Active-passive, narration',
              'Sentence improvement, para jumbles',
              'Cloze and reading comprehension',
            ],
          },
          {
            name: 'General Awareness (25 Q)',
            topics: ['History, culture, geography', 'Economy, policy, science', 'Current events'],
          },
          {
            name: 'Computer + DEST',
            topics: [
              'Computer basics, MS Office, internet, networking, cyber security',
              'DEST: ~2000 key depressions, 15 minutes, qualifying',
            ],
          },
        ],
      },
      {
        id: 't2-extra',
        title: 'Tier-II · Paper-II and Paper-III (selected posts only)',
        note: 'Paper-II Statistics: JSO and Statistical Investigator Grade-II. Paper-III Finance & Economics: Assistant Audit Officer / Assistant Accounts Officer. Both: 100 questions, 200 marks, 2 hours, −0.50 per wrong answer.',
        subjects: [
          {
            name: 'Paper-II Statistics',
            topics: [
              'Data collection and presentation',
              'Central tendency, dispersion',
              'Correlation, regression, probability',
              'Sampling, inference, index numbers',
            ],
          },
          {
            name: 'Paper-III Finance & Economics',
            topics: [
              'Accounting principles, journal, final accounts',
              'Microeconomics, demand-supply, markets',
              'Indian economy, money & banking, budget',
              'CAG and Finance Commission',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'chsl',
    name: 'SSC CHSL',
    source: EXAMS_LIST[1].source!,
    stages: [
      {
        id: 't1',
        title: 'Tier-I',
        note: 'English, General Intelligence, Quantitative Aptitude, General Awareness — 25 questions / 50 marks each. 60 minutes, 15-minute sectional timer. −0.50 per wrong answer.',
        subjects: [
          { name: 'English Language', topics: ['Basic knowledge — the notice lists detailed English topics in Tier-II'] },
          { name: 'General Intelligence', topics: ['Verbal and non-verbal reasoning — indicative of CGL Tier-I areas'] },
          { name: 'Quantitative Aptitude', topics: ['Basic arithmetic skill'] },
          { name: 'General Awareness', topics: ['Everyday GK and current events'] },
        ],
      },
      {
        id: 't2',
        title: 'Tier-II',
        note: 'Section-I: Maths 30 + Reasoning 30 (180 marks). Section-II: English 40 + GA 20 (180 marks). Computer: 15 questions, 45 marks, 15 minutes. Negative −1 in Sections I–III. Skill/Typing qualifying.',
        subjects: [
          { name: 'Maths & Reasoning', topics: ['Mathematical Abilities', 'Reasoning and General Intelligence'] },
          { name: 'English & GA', topics: ['English Language and Comprehension', 'General Awareness'] },
          { name: 'Computer', topics: ['Computer Knowledge Test — qualifying, but the section must still be passed'] },
          {
            name: 'Skill / Typing',
            topics: [
              'DEO (specified ministries): 15,000 key depressions/hour, 15 min',
              'Other DEO: 8,000 key depressions/hour, 15 min',
              'LDC/JSA: Typing Test, Hindi or English, qualifying',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gd',
    name: 'SSC GD',
    source: EXAMS_LIST[2].source!,
    stages: [
      {
        id: 'cbe',
        title: 'Computer Based Examination',
        note: 'Matric level. 4 parts × 20 questions × 2 marks. 60 minutes. −0.25 per wrong answer. English/Hindi choice is in Part-D.',
        subjects: [
          {
            name: 'Reasoning',
            topics: ['Analogies, classification, series', 'Coding-decoding', 'Spatial visualisation', 'Mostly non-verbal pattern questions'],
          },
          {
            name: 'GK & Awareness',
            topics: ['Sports, history, culture, geography', 'Economy, polity, constitution', 'Everyday science — no specialised study of one discipline is asked'],
          },
          {
            name: 'Elementary Mathematics',
            topics: [
              'Number system, fractions, decimals',
              'Percentage, ratio, average',
              'Profit & loss, interest, discount',
              'Time & work, time & distance',
              'Mensuration',
            ],
          },
          { name: 'English / Hindi', topics: ['Basic language and simple comprehension'] },
        ],
      },
    ],
  },
  {
    id: 'cpo',
    name: 'SSC CPO',
    source: EXAMS_LIST[3].source!,
    stages: [
      {
        id: 'p1',
        title: 'Paper-I',
        note: '50 questions each in Reasoning, GK, Quant, English. 200 marks, 2 hours. −0.25 per wrong.',
        subjects: [
          { name: 'Reasoning', topics: ['Analogy, series, coding', 'Syllogism, Venn diagrams', 'Non-verbal / embedded figures'] },
          { name: 'GK', topics: ['History, culture, geography', 'Economy, polity, constitution', 'Current events, science'] },
          { name: 'Quant', topics: ['Arithmetic, algebra', 'Geometry, mensuration, trigonometry', 'DI'] },
          { name: 'English', topics: ['Comprehension and correct English'] },
        ],
      },
      {
        id: 'p2',
        title: 'Paper-II',
        note: 'Only after PST/PET is cleared. English Language & Comprehension: 200 questions, 200 marks, 2 hours. −0.25.',
        subjects: [
          {
            name: 'English',
            topics: ['Error recognition, fill in the blanks', 'Vocabulary, spelling, grammar', 'Synonyms, antonyms, idioms', 'Comprehension'],
          },
        ],
      },
    ],
  },
  {
    id: 'mts',
    name: 'SSC MTS',
    source: EXAMS_LIST[4].source!,
    stages: [
      {
        id: 's1',
        title: 'Session-I',
        note: '20+20 questions, 60+60 marks, 45 minutes. No negative marking in this session.',
        subjects: [
          {
            name: 'Numerical Ability',
            topics: ['Integers, LCM/HCF, fractions', 'Percentage, ratio, average', 'Profit & loss, simple interest', 'Time & work, distance', 'Basic area-perimeter, simple graphs'],
          },
          {
            name: 'Reasoning',
            topics: ['Series, coding, analogy', 'Direction, similarities', 'Non-verbal diagrams', 'Calendar & clock'],
          },
        ],
      },
      {
        id: 's2',
        title: 'Session-II',
        note: 'GA 25/75 + English 25/75. 45 minutes. −1 per wrong answer. Merit is based on this session.',
        subjects: [
          { name: 'General Awareness', topics: ['History, geography, civics, economics', 'Art & culture', 'General science and environment, up to Class 10'] },
          { name: 'English', topics: ['Vocabulary, grammar, sentence structure', 'Synonyms, antonyms', 'Simple paragraph comprehension'] },
        ],
      },
    ],
  },
];

export interface TierCard {
  exam: string;
  stage: string;
  points: string[];
}

export const TIER_CARDS: TierCard[] = [
  {
    exam: 'SSC CGL',
    stage: 'What is Tier-I?',
    points: [
      'First computer-based stage. Marks are used to shortlist for Tier-II.',
      '4 subjects × 25 questions. Total 200 marks, 1 hour.',
      'CGL 2026 notice: 15-minute sectional timer on each subject.',
      'Objective MCQ. Except English Comprehension, questions are in English and Hindi.',
      '−0.50 for a wrong answer.',
    ],
  },
  {
    exam: 'SSC CGL',
    stage: 'What is Tier-II?',
    points: [
      'Paper-I is compulsory for every post. Each of its sections must be qualified separately.',
      'Section-I: Maths 30 + Reasoning 30, 180 marks, 1 hour (30 min per subject).',
      'Section-II: English 45 + GA 25, 210 marks, 1 hour (English 40 min, GA 20 min).',
      'Section-III: Computer Knowledge, 20 questions, 15 minutes, qualifying — some posts set a higher cut-off.',
      'Section-IV: DEST, 15 minutes, qualifying.',
      'Paper-II (Statistics) and Paper-III (Finance & Economics) only for posts you are shortlisted for.',
      'Paper-I Sections I–III: −1 per wrong answer. Paper-II and III: −0.50.',
    ],
  },
  {
    exam: 'SSC CHSL',
    stage: 'Tier-I and Tier-II',
    points: [
      'Tier-I: 100 questions, 200 marks, 60 minutes, 15-minute sectional timer, −0.50.',
      'Tier-II Session-I covers Maths, Reasoning, English, GA and Computer.',
      'Session-II is a Skill Test or Typing Test by post — qualifying.',
      'Computer and Skill/Typing must be qualified; merit rules are in the selection para of the notice.',
    ],
  },
];

export interface RailwayCard {
  id: string;
  name: string;
  process: string;
  subjects: string[];
  direction: string;
  source: SourceRef;
}

export const RAILWAY_EXAMS: RailwayCard[] = [
  {
    id: 'ntpc',
    name: 'RRB NTPC (Under Graduate)',
    process:
      'CEN 06/2024: two-stage CBT. Typing Skill Test only for posts such as Accounts Clerk / Junior Clerk cum Typist, then Document Verification and Medical. Commercial cum Ticket Clerk / Trains Clerk have no typing stage — CBT is followed by DV and medical.',
    subjects: [
      'CBT-1: 100 questions, 90 minutes (120 with scribe). Maths, Reasoning, General Awareness. −1/3 per wrong answer. Screening — these marks are not in the final panel; they are used to shortlist.',
      'CBT-2: 120 questions, 90 minutes. Same three subjects. Section split is indicative and may vary in the paper. −1/3.',
      'Minimum eligibility percentage is in the CEN by category (UR/EWS 40%, OBC-NCL/SC 30%, ST 25%, PwBD relaxation if there is a shortage).',
    ],
    direction:
      'Practise Quant, Reasoning and GA (history, polity, geography, economy, current affairs, computers). For typist posts, prepare typing separately.',
    source: {
      label: 'RRB CEN 06/2024 NTPC (Under Graduate)',
      url: 'https://www.rrbcdg.gov.in/uploads/2024/06-NTPCUG/Detailed%20CEN%2006-2024%20NTPC.pdf',
    },
  },
  {
    id: 'groupd',
    name: 'RRB Level-1 (Group D type posts)',
    process:
      'CEN 09/2025: a single-stage CBT first. Railway reserves the right to run multi-stage CBT. After CBT, PET is qualifying, then Document Verification and Medical. PET shortlisting is on merit.',
    subjects: [
      'CBT: 100 questions. Duration table: 90 minutes (120 for scribe-eligible candidates). −1/3 per wrong answer.',
      'Subjects: Mathematics, General Intelligence & Reasoning, General Science (Class 10 PCB), General Awareness & Current Affairs.',
      'Section-wise count is indicative — confirm the exact split in the latest CEN.',
      'Qualification depends on the post: 10th / ITI-NAC. Age is calculated as on 01.01.2026, as per the CEN.',
    ],
    direction:
      'Give time to Class 10 maths, reasoning and science. PET is qualifying, so physical practice should match the notice standard alongside the written paper.',
    source: {
      label: 'RRB CEN 09/2025 Level-1',
      url: 'https://www.rrbcdg.gov.in/uploads/2025/09-LVL1/092025-CEN.pdf',
    },
  },
  {
    id: 'alp',
    name: 'RRB ALP',
    process:
      'CEN 01/2026: CBT-1 (screening, not counted in the final panel) → CBT-2 (Part-A + qualifying Part-B trade) → CBAT → Document Verification → Medical. Each CBAT test battery must be qualified separately. Merit: CBT-2 Part-A and CBAT 50:50.',
    subjects: [
      'CBT-1: 75 questions, 75 marks, 60 minutes. Maths, Mental Ability, General Science (Class 10). −1/3. CBAT has no negative marking.',
      'CBT-2 has Part-A relevant subjects and Part-B trade syllabus. Part-B must be qualified.',
      'CBAT: minimum T-score 42 in each battery. English and Hindi only.',
    ],
    direction:
      'CBT-1 needs maths, reasoning and science. Trade test and CBAT are separate stages — SSC-style MCQs alone do not complete ALP.',
    source: {
      label: 'RRB CEN 01/2026 (ALP)',
      url: 'https://rrbahmedabad.gov.in/wp-content/uploads/2026/05/detail-cen-01-2026-eng-.pdf',
    },
  },
  {
    id: 'je',
    name: 'RRB JE',
    process:
      'CEN 04/2026: CBT-I → CBT-II → Document Verification → Medical. CBT-I is screening. CBT-II includes technical subjects.',
    subjects: [
      'CBT-I: 100 questions, 90 minutes. Indicative split: Maths 30, Reasoning 25, GA 15, General Science 30. −1/3. Split may vary.',
      'CBT-II: 150 questions, 120 minutes. General sections plus the technical syllabus of the discipline (Civil, Electrical, Electronics, Mechanical, etc.).',
    ],
    direction:
      'Common maths, reasoning and science help here. Final selection depends on the technical paper — read the latest CEN annexure (trade syllabus) on the official RRB site.',
    source: {
      label: 'RRB CEN 04/2026 — confirm the CEN on the official RRB website',
      url: 'https://www.rrbcdg.gov.in/',
    },
  },
  {
    id: 'rpf',
    name: 'RPF Constable',
    process:
      'CEN RPF 02/2024: Computer Based Test → PET & PMT (qualifying, no marks) → Document Verification. Ex-servicemen are exempt from PET but must take PMT. Shortlist is on CBT merit, up to 10 times the vacancy.',
    subjects: [
      'CBT: 120 questions, 90 minutes, 1 mark each. −1/3 per wrong answer.',
      'Arithmetic 35, General Intelligence & Reasoning 35, General Awareness 50.',
      'GA covers history, culture, geography, economics, polity, constitution, sports, general science.',
    ],
    direction:
      'Arithmetic and reasoning overlap with SSC GD / MTS. PET/PMT is a separate physical stage — standards in the CEN differ by gender.',
    source: {
      label: 'CEN RPF 02/2024 (Constable), RRB Bhubaneswar document',
      url: 'https://rrbbbs.gov.in/',
    },
  },
];

export const PREP_STEPS = [
  { step: '01', title: 'Choose the exam', text: 'CGL, CHSL, GD, CPO or MTS — lock one target first. Railway is a separate application.' },
  { step: '02', title: 'Read the process', text: 'Which stage comes first, which is qualifying, and which stage builds merit.' },
  { step: '03', title: 'Break the syllabus', text: 'Split each subject into topics. Do not start every book at once.' },
  { step: '04', title: 'Topic questions', text: 'Solve MCQs on that topic as soon as the concept is done.' },
  { step: '05', title: 'PYQ', text: 'Previous papers show the pattern and the ideas that repeat.' },
  { step: '06', title: 'Timed practice', text: 'Accuracy without a timer is different. Use section time as in the notice.' },
  { step: '07', title: 'Full mock', text: 'After one pass of the syllabus, sit a full paper in one sitting.' },
  { step: '08', title: 'Analysis', text: 'List wrong, skipped and slow topics separately.' },
  { step: '09', title: 'Revision', text: 'Re-solve those mistakes first. New material comes after old errors.' },
  { step: '10', title: 'Repeat', text: 'Topic → PYQ → mock → analysis. Each exam keeps its own pattern.' },
];

export const COMMON_SUBJECTS = [
  {
    name: 'Quantitative Aptitude',
    detail:
      'Percentage, ratio, average, profit-loss, time-work, time-distance, mensuration — asked in SSC and several RRB CBTs. Level is Class 10 or higher, depending on the exam.',
  },
  {
    name: 'Reasoning',
    detail:
      'Analogy, series, coding, classification, direction, Venn diagram. The paper may call it “Mental Ability” (ALP).',
  },
  {
    name: 'General Awareness',
    detail:
      'History, geography, polity, economy, current affairs. Weight depends on the exam. RPF CBT has 50 marks of GA; CGL Tier-I has 50 marks.',
  },
  {
    name: 'General Science',
    detail:
      'Railway Level-1, ALP CBT-1 and JE CBT-I ask Class 10 Physics, Chemistry and Life Science directly. Science also appears in SSC GA.',
  },
  {
    name: 'English',
    detail:
      'SSC CGL, CHSL, CPO and MTS have a language section. Many RRB CBTs do not have a separate English paper — typing/skill tests there depend on the post.',
  },
];
