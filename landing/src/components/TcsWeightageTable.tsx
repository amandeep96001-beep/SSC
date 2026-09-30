import { useState } from 'react';
import { BookOpen, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';

interface TcsWeightageProps {
  onGoToDashboard: () => void;
}

type SubjectTab = 'quant' | 'reasoning' | 'english' | 'ga';

interface TopicWeight {
  topic: string;
  questions: string;
  marks: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  repeatingScore: number; // 1-5 stars
  tip: string;
}

const TCS_SUBJECT_DATA: Record<
  SubjectTab,
  { name: string; totalQ: number; totalMarks: number; topics: TopicWeight[] }
> = {
  quant: {
    name: 'Quantitative Aptitude (Maths)',
    totalQ: 25,
    totalMarks: 50,
    topics: [
      { topic: 'Arithmetic (Percentage, Profit & Loss, SI/CI)', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Moderate', repeatingScore: 5, tip: 'Direct fraction-to-% conversion saves 90 seconds here.' },
      { topic: 'Algebra & Linear/Quadratic Equations', questions: '3 - 4 Qs', marks: '6 - 8 Marks', difficulty: 'Moderate', repeatingScore: 5, tip: 'Value-putting method (x=1, 0, -1) solves 70% of TCS questions.' },
      { topic: 'Geometry & Mensuration (2D/3D)', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Hard', repeatingScore: 5, tip: 'Circles (tangents, secants) and Triangles (incenter, circumcenter) are tested every shift.' },
      { topic: 'Trigonometry & Heights/Distances', questions: '3 Qs', marks: '6 Marks', difficulty: 'Moderate', repeatingScore: 4, tip: 'Memorize sin/cos values and Pythagorean triplets (7, 24, 25), (9, 40, 41).' },
      { topic: 'Ratio, Proportion & Mixture-Alligation', questions: '2 - 3 Qs', marks: '4 - 6 Marks', difficulty: 'Easy', repeatingScore: 4, tip: 'Cross-multiplication concept is the fastest technique.' },
      { topic: 'Data Interpretation (DI Bar/Pie/Table)', questions: '3 - 4 Qs', marks: '6 - 8 Marks', difficulty: 'Easy', repeatingScore: 5, tip: 'Calculation speed matters more than concept. Table drills directly improve DI.' },
    ],
  },
  reasoning: {
    name: 'General Intelligence & Reasoning',
    totalQ: 25,
    totalMarks: 50,
    topics: [
      { topic: 'Coding - Decoding & Letter Shifting', questions: '3 - 4 Qs', marks: '6 - 8 Marks', difficulty: 'Easy', repeatingScore: 5, tip: 'Remember alphabetical forward and reverse letter rank (EJOTY and AZBYCX).' },
      { topic: 'Number & Letter Analogy / Odd One Out', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Moderate', repeatingScore: 5, tip: 'TCS loves squares + cubes logic (e.g. n³ - n, n² + 1).' },
      { topic: 'Syllogism (Venn Diagram Method)', questions: '2 - 3 Qs', marks: '4 - 6 Marks', difficulty: 'Easy', repeatingScore: 5, tip: '"Only a few" cases are common in new TCS patterns.' },
      { topic: 'Blood Relations (Coded & Statement)', questions: '2 Qs', marks: '4 Marks', difficulty: 'Moderate', repeatingScore: 4, tip: 'Family tree diagram prevents confusing gender deductions.' },
      { topic: 'Non-Verbal (Paper Folding, Mirror, Embedded)', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Easy', repeatingScore: 5, tip: 'Free scoring area — 100% accuracy expected.' },
    ],
  },
  english: {
    name: 'English Comprehension & Grammar',
    totalQ: 25,
    totalMarks: 50,
    topics: [
      { topic: 'Cloze Test / Reading Comprehension', questions: '5 Qs', marks: '10 Marks', difficulty: 'Moderate', repeatingScore: 5, tip: 'Contextual reading and preposition collocations are tested.' },
      { topic: 'One Word Substitution & Idioms/Phrases', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Easy', repeatingScore: 5, tip: '85% are direct previous 10-year PYQ repetitions.' },
      { topic: 'Synonyms & Antonyms (High-Freq Vocab)', questions: '4 Qs', marks: '8 Marks', difficulty: 'Moderate', repeatingScore: 5, tip: 'Practice Blackbook vocabulary sets using our Revision Decks.' },
      { topic: 'Spotting the Error & Sentence Improvement', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Moderate', repeatingScore: 5, tip: 'Subject-Verb Agreement, Conditionals, and Prepositions.' },
      { topic: 'Active/Passive Voice & Direct/Indirect Speech', questions: '2 - 3 Qs', marks: '4 - 6 Marks', difficulty: 'Easy', repeatingScore: 4, tip: 'Follow tense transformation rules with zero exceptions.' },
    ],
  },
  ga: {
    name: 'General Awareness & Science',
    totalQ: 25,
    totalMarks: 50,
    topics: [
      { topic: 'Static GK (Dance, Festivals, Musical Instruments)', questions: '5 - 6 Qs', marks: '10 - 12 Marks', difficulty: 'Moderate', repeatingScore: 5, tip: 'Gharanas, folk dances and awards repeat heavily in TCS exams.' },
      { topic: 'Indian Polity & Constitution (Articles, Amendments)', questions: '3 - 4 Qs', marks: '6 - 8 Marks', difficulty: 'Easy', repeatingScore: 5, tip: 'Fundamental Rights (12-35), DPSP (36-51), and President/PM articles.' },
      { topic: 'General Science (Class 9-10 Biology & Chemistry)', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Moderate', repeatingScore: 4, tip: 'Human body vitamins, diseases, periodic table elements.' },
      { topic: 'Modern Indian History & Freedom Struggle', questions: '3 Qs', marks: '6 Marks', difficulty: 'Easy', repeatingScore: 4, tip: 'Gandhian era (1915-1947), Congress sessions, and Governor Generals.' },
      { topic: 'Current Affairs & Government Schemes', questions: '4 - 5 Qs', marks: '8 - 10 Marks', difficulty: 'Moderate', repeatingScore: 4, tip: 'Last 8 months sports awards, budget highlights, and naval exercises.' },
    ],
  },
};

export function TcsWeightageTable({ onGoToDashboard }: TcsWeightageProps) {
  const [tab, setTab] = useState<SubjectTab>('quant');
  const current = TCS_SUBJECT_DATA[tab];

  return (
    <div className="lp-weightage-widget" id="tcs-weightage">
      <div className="lp-weightage-header">
        <div className="lp-weightage-tag">
          <BarChart3 size={14} />
          <span>TCS Official Exam Blueprint & Weightage (2020-2025 Analyzed)</span>
        </div>
        <h3 className="lp-weightage-title">
          SSC Tier-1 Subject-Wise Weightage & Repeating PYQ Hotspots
        </h3>
        <p className="lp-weightage-desc">
          80% of questions in SSC CGL, CHSL, and CPO come from 20% of repeating core concepts. Don't waste time on low-yield chapters.
        </p>

        {/* Subject Nav Pills */}
        <div className="lp-weightage-tabs" role="tablist">
          <button
            type="button"
            className={`lp-weightage-tab ${tab === 'quant' ? 'is-active' : ''}`}
            onClick={() => setTab('quant')}
          >
            Quant (Maths)
          </button>
          <button
            type="button"
            className={`lp-weightage-tab ${tab === 'reasoning' ? 'is-active' : ''}`}
            onClick={() => setTab('reasoning')}
          >
            Reasoning
          </button>
          <button
            type="button"
            className={`lp-weightage-tab ${tab === 'english' ? 'is-active' : ''}`}
            onClick={() => setTab('english')}
          >
            English
          </button>
          <button
            type="button"
            className={`lp-weightage-tab ${tab === 'ga' ? 'is-active' : ''}`}
            onClick={() => setTab('ga')}
          >
            General Awareness
          </button>
        </div>
      </div>

      <div className="lp-weightage-card">
        <div className="lp-weightage-card-meta">
          <div>
            <h4 className="lp-meta-name">{current.name}</h4>
            <span className="lp-meta-sub">
              {current.totalQ} Questions • {current.totalMarks} Marks • Negative Marking: −0.50 per wrong
            </span>
          </div>
          <button
            type="button"
            className="lp-weightage-cta-link"
            onClick={onGoToDashboard}
          >
            <span>Practice this Subject</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="lp-table-responsive">
          <table className="lp-weightage-table">
            <thead>
              <tr>
                <th>High-Yield Topic</th>
                <th>Expected Questions</th>
                <th>Marks Weight</th>
                <th>TCS Repeat Frequency</th>
                <th>Topper Master Strategy</th>
              </tr>
            </thead>
            <tbody>
              {current.topics.map((t) => (
                <tr key={t.topic}>
                  <td className="lp-td-topic">
                    <strong>{t.topic}</strong>
                  </td>
                  <td>
                    <span className="lp-badge-q">{t.questions}</span>
                  </td>
                  <td>
                    <span className="lp-badge-marks">{t.marks}</span>
                  </td>
                  <td>
                    <div className="lp-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < t.repeatingScore ? 'star gold' : 'star muted'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="lp-td-tip">
                    <span className="lp-tip-text">{t.tip}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lp-weightage-foot">
          <CheckCircle2 size={16} className="lp-foot-check" />
          <span>
            Every topic above is mapped to curated chapter notes and a 15-question diagnostic drill in our platform.
          </span>
        </div>
      </div>
    </div>
  );
}
