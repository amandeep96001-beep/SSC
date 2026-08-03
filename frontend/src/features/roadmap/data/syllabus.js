/**
 * SSC Exam Syllabus Roadmap — structured syllabus catalog.
 *
 * Shape is exam-agnostic so MTS, GD, CPO, Delhi Police, Railway, etc.
 * can be added without changing the UI:
 *
 *   EXAM_SYLLABI[examKey] = {
 *     id, name, shortName, description,
 *     subjects: [{ id, name, icon, color, categories: [{ id, name, topics: [{ id, name }] }] }]
 *   }
 *
 * Topic ids are globally unique within an exam (prefixed by subject+category).
 */

/** @typedef {'pending' | 'in_progress' | 'completed'} TopicStatus */

/**
 * @typedef {Object} SyllabusTopic
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} SyllabusCategory
 * @property {string} id
 * @property {string} name
 * @property {SyllabusTopic[]} topics
 */

/**
 * @typedef {Object} SyllabusSubject
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} icon Lucide icon name
 * @property {string} color Accent token: blue | mint | peach | lavender | rose
 * @property {SyllabusCategory[]} categories
 */

/**
 * @typedef {Object} ExamSyllabus
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} description
 * @property {SyllabusSubject[]} subjects
 */

/** @type {ExamSyllabus} */
const SSC_CGL_CHSL_CPO = {
  id: 'ssc_cgl',
  name: 'SSC CGL / CHSL / CPO',
  shortName: 'SSC',
  description: 'Complete Tier-I syllabus roadmap — track every topic across Quant, Reasoning, English & GA.',
  subjects: [
    {
      id: 'quant',
      name: 'Quantitative Aptitude',
      shortName: 'Quant',
      icon: 'Calculator',
      color: 'blue',
      categories: [
        {
          id: 'arithmetic',
          name: 'Arithmetic',
          topics: [
            { id: 'quant-arithmetic-percentage', name: 'Percentage' },
            { id: 'quant-arithmetic-profit-loss', name: 'Profit & Loss' },
            { id: 'quant-arithmetic-discount', name: 'Discount' },
            { id: 'quant-arithmetic-si', name: 'Simple Interest' },
            { id: 'quant-arithmetic-ci', name: 'Compound Interest' },
            { id: 'quant-arithmetic-ratio', name: 'Ratio & Proportion' },
            { id: 'quant-arithmetic-partnership', name: 'Partnership' },
            { id: 'quant-arithmetic-average', name: 'Average' },
            { id: 'quant-arithmetic-age', name: 'Age' },
            { id: 'quant-arithmetic-time-work', name: 'Time & Work' },
            { id: 'quant-arithmetic-pipe-cistern', name: 'Pipe & Cistern' },
            { id: 'quant-arithmetic-tsd', name: 'Time, Speed & Distance' },
            { id: 'quant-arithmetic-boat-stream', name: 'Boat & Stream' },
            { id: 'quant-arithmetic-train', name: 'Train Problems' },
            { id: 'quant-arithmetic-mixture', name: 'Mixture & Alligation' },
            { id: 'quant-arithmetic-number-system', name: 'Number System' },
            { id: 'quant-arithmetic-simplification', name: 'Simplification' },
            { id: 'quant-arithmetic-lcm-hcf', name: 'LCM & HCF' },
            { id: 'quant-arithmetic-surds', name: 'Surds & Indices' },
          ],
        },
        {
          id: 'algebra',
          name: 'Algebra',
          topics: [
            { id: 'quant-algebra-basic', name: 'Basic Algebra' },
            { id: 'quant-algebra-linear', name: 'Linear Equations' },
            { id: 'quant-algebra-quadratic', name: 'Quadratic Equations' },
            { id: 'quant-algebra-identities', name: 'Identities' },
          ],
        },
        {
          id: 'geometry',
          name: 'Geometry',
          topics: [
            { id: 'quant-geometry-lines', name: 'Lines & Angles' },
            { id: 'quant-geometry-triangle', name: 'Triangle' },
            { id: 'quant-geometry-circle', name: 'Circle' },
            { id: 'quant-geometry-quadrilateral', name: 'Quadrilateral' },
            { id: 'quant-geometry-polygon', name: 'Polygon' },
            { id: 'quant-geometry-congruency', name: 'Congruency' },
            { id: 'quant-geometry-similarity', name: 'Similarity' },
          ],
        },
        {
          id: 'mensuration',
          name: 'Mensuration',
          topics: [
            { id: 'quant-mensuration-2d', name: '2D Mensuration' },
            { id: 'quant-mensuration-3d', name: '3D Mensuration' },
          ],
        },
        {
          id: 'trigonometry',
          name: 'Trigonometry',
          topics: [
            { id: 'quant-trigo-ratios', name: 'Trigonometric Ratios' },
            { id: 'quant-trigo-heights', name: 'Heights & Distances' },
            { id: 'quant-trigo-identities', name: 'Identities' },
          ],
        },
        {
          id: 'di',
          name: 'Data Interpretation',
          topics: [
            { id: 'quant-di-table', name: 'Table' },
            { id: 'quant-di-bar', name: 'Bar Graph' },
            { id: 'quant-di-pie', name: 'Pie Chart' },
            { id: 'quant-di-line', name: 'Line Graph' },
          ],
        },
      ],
    },
    {
      id: 'reasoning',
      name: 'General Intelligence & Reasoning',
      shortName: 'Reasoning',
      icon: 'Brain',
      color: 'lavender',
      categories: [
        {
          id: 'verbal',
          name: 'Verbal Reasoning',
          topics: [
            { id: 'reason-verbal-analogy', name: 'Analogy' },
            { id: 'reason-verbal-classification', name: 'Classification' },
            { id: 'reason-verbal-series', name: 'Series' },
            { id: 'reason-verbal-coding', name: 'Coding-Decoding' },
            { id: 'reason-verbal-blood', name: 'Blood Relation' },
            { id: 'reason-verbal-direction', name: 'Direction Sense' },
            { id: 'reason-verbal-ranking', name: 'Ranking' },
            { id: 'reason-verbal-alphabet', name: 'Alphabet Test' },
            { id: 'reason-verbal-dictionary', name: 'Dictionary Order' },
            { id: 'reason-verbal-missing', name: 'Missing Number' },
            { id: 'reason-verbal-number-series', name: 'Number Series' },
            { id: 'reason-verbal-statement', name: 'Statement & Conclusion' },
            { id: 'reason-verbal-syllogism', name: 'Syllogism' },
          ],
        },
        {
          id: 'nonverbal',
          name: 'Non-Verbal Reasoning',
          topics: [
            { id: 'reason-nv-mirror', name: 'Mirror Image' },
            { id: 'reason-nv-water', name: 'Water Image' },
            { id: 'reason-nv-folding', name: 'Paper Folding' },
            { id: 'reason-nv-cutting', name: 'Paper Cutting' },
            { id: 'reason-nv-completion', name: 'Figure Completion' },
            { id: 'reason-nv-embedded', name: 'Embedded Figure' },
            { id: 'reason-nv-pattern', name: 'Pattern' },
            { id: 'reason-nv-cube', name: 'Cube & Dice' },
          ],
        },
        {
          id: 'logical',
          name: 'Logical Reasoning',
          topics: [
            { id: 'reason-logical-seating', name: 'Seating Arrangement' },
            { id: 'reason-logical-puzzle', name: 'Puzzle' },
            { id: 'reason-logical-venn', name: 'Venn Diagram' },
          ],
        },
      ],
    },
    {
      id: 'english',
      name: 'English Language',
      shortName: 'English',
      icon: 'BookOpen',
      color: 'peach',
      categories: [
        {
          id: 'grammar',
          name: 'Grammar',
          topics: [
            { id: 'eng-grammar-noun', name: 'Noun' },
            { id: 'eng-grammar-pronoun', name: 'Pronoun' },
            { id: 'eng-grammar-verb', name: 'Verb' },
            { id: 'eng-grammar-adjective', name: 'Adjective' },
            { id: 'eng-grammar-adverb', name: 'Adverb' },
            { id: 'eng-grammar-preposition', name: 'Preposition' },
            { id: 'eng-grammar-conjunction', name: 'Conjunction' },
            { id: 'eng-grammar-articles', name: 'Articles' },
            { id: 'eng-grammar-tenses', name: 'Tenses' },
            { id: 'eng-grammar-sva', name: 'Subject Verb Agreement' },
            { id: 'eng-grammar-active-passive', name: 'Active Passive' },
            { id: 'eng-grammar-direct-indirect', name: 'Direct Indirect' },
            { id: 'eng-grammar-error', name: 'Error Detection' },
            { id: 'eng-grammar-improvement', name: 'Sentence Improvement' },
            { id: 'eng-grammar-fill', name: 'Fill in the Blanks' },
          ],
        },
        {
          id: 'vocabulary',
          name: 'Vocabulary',
          topics: [
            { id: 'eng-vocab-synonyms', name: 'Synonyms' },
            { id: 'eng-vocab-antonyms', name: 'Antonyms' },
            { id: 'eng-vocab-oneword', name: 'One Word' },
            { id: 'eng-vocab-idioms', name: 'Idioms & Phrases' },
            { id: 'eng-vocab-spelling', name: 'Spelling Correction' },
          ],
        },
        {
          id: 'reading',
          name: 'Reading',
          topics: [
            { id: 'eng-reading-rc', name: 'Reading Comprehension' },
            { id: 'eng-reading-cloze', name: 'Cloze Test' },
            { id: 'eng-reading-parajumble', name: 'Para Jumble' },
          ],
        },
      ],
    },
    {
      id: 'ga',
      name: 'General Awareness',
      shortName: 'GA',
      icon: 'Globe2',
      color: 'mint',
      categories: [
        {
          id: 'history',
          name: 'History',
          topics: [
            { id: 'ga-history-ancient', name: 'Ancient' },
            { id: 'ga-history-medieval', name: 'Medieval' },
            { id: 'ga-history-modern', name: 'Modern' },
            { id: 'ga-history-freedom', name: 'Freedom Struggle' },
          ],
        },
        {
          id: 'geography',
          name: 'Geography',
          topics: [
            { id: 'ga-geo-india', name: 'India' },
            { id: 'ga-geo-world', name: 'World' },
            { id: 'ga-geo-physical', name: 'Physical Geography' },
          ],
        },
        {
          id: 'polity',
          name: 'Polity',
          topics: [
            { id: 'ga-polity-constitution', name: 'Constitution' },
            { id: 'ga-polity-fr', name: 'Fundamental Rights' },
            { id: 'ga-polity-parliament', name: 'Parliament' },
            { id: 'ga-polity-judiciary', name: 'Judiciary' },
            { id: 'ga-polity-president', name: 'President' },
            { id: 'ga-polity-pm', name: 'Prime Minister' },
          ],
        },
        {
          id: 'economy',
          name: 'Economy',
          topics: [
            { id: 'ga-economy-banking', name: 'Banking' },
            { id: 'ga-economy-budget', name: 'Budget' },
            { id: 'ga-economy-inflation', name: 'Inflation' },
            { id: 'ga-economy-gdp', name: 'GDP' },
          ],
        },
        {
          id: 'science',
          name: 'Science',
          topics: [
            { id: 'ga-science-physics', name: 'Physics' },
            { id: 'ga-science-chemistry', name: 'Chemistry' },
            { id: 'ga-science-biology', name: 'Biology' },
          ],
        },
        {
          id: 'static-gk',
          name: 'Static GK',
          topics: [
            { id: 'ga-static-days', name: 'Important Days' },
            { id: 'ga-static-books', name: 'Books & Authors' },
            { id: 'ga-static-awards', name: 'Awards' },
            { id: 'ga-static-sports', name: 'Sports' },
            { id: 'ga-static-dance', name: 'Dance' },
            { id: 'ga-static-culture', name: 'Art & Culture' },
            { id: 'ga-static-parks', name: 'National Parks' },
            { id: 'ga-static-rivers', name: 'Rivers' },
            { id: 'ga-static-dams', name: 'Dams' },
            { id: 'ga-static-capitals', name: 'Countries & Capitals' },
            { id: 'ga-static-currency', name: 'Currency' },
          ],
        },
        {
          id: 'current-affairs',
          name: 'Current Affairs',
          topics: [
            { id: 'ga-ca-national', name: 'National' },
            { id: 'ga-ca-international', name: 'International' },
            { id: 'ga-ca-sports', name: 'Sports' },
            { id: 'ga-ca-economy', name: 'Economy' },
            { id: 'ga-ca-sci-tech', name: 'Science & Technology' },
            { id: 'ga-ca-schemes', name: 'Government Schemes' },
          ],
        },
        {
          id: 'computer',
          name: 'Computer',
          topics: [
            { id: 'ga-comp-basics', name: 'Basics' },
            { id: 'ga-comp-msoffice', name: 'MS Office' },
            { id: 'ga-comp-internet', name: 'Internet' },
            { id: 'ga-comp-networking', name: 'Networking' },
            { id: 'ga-comp-hardware', name: 'Hardware' },
            { id: 'ga-comp-software', name: 'Software' },
            { id: 'ga-comp-memory', name: 'Memory' },
            { id: 'ga-comp-io', name: 'Input Output Devices' },
          ],
        },
      ],
    },
  ],
};

/**
 * Registry of exam syllabi. Add new exams here — UI reads from this map.
 * @type {Record<string, ExamSyllabus>}
 */
export const EXAM_SYLLABI = {
  ssc_cgl: SSC_CGL_CHSL_CPO,
  // Placeholders ready for expansion (reuse SSC core until specialized trees exist)
  ssc_mts: {
    ...SSC_CGL_CHSL_CPO,
    id: 'ssc_mts',
    name: 'SSC MTS',
    shortName: 'MTS',
    description: 'SSC MTS syllabus roadmap — same Tier-I pillars with MTS-focused tracking.',
  },
  ssc_gd: {
    ...SSC_CGL_CHSL_CPO,
    id: 'ssc_gd',
    name: 'SSC GD',
    shortName: 'GD',
    description: 'SSC GD Constable syllabus roadmap.',
  },
  railways: {
    ...SSC_CGL_CHSL_CPO,
    id: 'railways',
    name: 'Railway (RRB)',
    shortName: 'RRB',
    description: 'Railway CBT syllabus roadmap — maths, reasoning, GK & science.',
  },
};

export const DEFAULT_EXAM_KEY = 'ssc_cgl';

export const TOPIC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

/** Map app exam profile ids → syllabus keys */
export const EXAM_PROFILE_TO_SYLLABUS = {
  ssc: 'ssc_cgl',
  banking: 'ssc_cgl',
  railways: 'railways',
  upsc: 'ssc_cgl',
  cat: 'ssc_cgl',
  state_psc: 'ssc_gd',
  other: 'ssc_cgl',
};

/**
 * @param {string} [key]
 * @returns {ExamSyllabus}
 */
export function getExamSyllabus(key = DEFAULT_EXAM_KEY) {
  return EXAM_SYLLABI[key] || EXAM_SYLLABI[DEFAULT_EXAM_KEY];
}

/**
 * Flatten all topics for an exam syllabus.
 * @param {ExamSyllabus} syllabus
 * @returns {Array<{ topic: SyllabusTopic, subjectId: string, categoryId: string, subjectName: string, categoryName: string }>}
 */
export function flattenTopics(syllabus) {
  const list = [];
  for (const subject of syllabus.subjects) {
    for (const category of subject.categories) {
      for (const topic of category.topics) {
        list.push({
          topic,
          subjectId: subject.id,
          categoryId: category.id,
          subjectName: subject.name,
          categoryName: category.name,
        });
      }
    }
  }
  return list;
}

/**
 * @param {ExamSyllabus} syllabus
 * @returns {number}
 */
export function countTopics(syllabus) {
  return flattenTopics(syllabus).length;
}

/**
 * List available exams for a switcher UI.
 * @returns {{ id: string, name: string, shortName: string }[]}
 */
export function listExamSyllabi() {
  return Object.values(EXAM_SYLLABI).map(({ id, name, shortName }) => ({ id, name, shortName }));
}
