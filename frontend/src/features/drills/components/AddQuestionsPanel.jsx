import { useState, useCallback } from 'react';
import {
  Plus, FileJson, Send, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, X, Loader2, HelpCircle, Database
} from 'lucide-react';
import { apiService } from '@/shared/services/apiService';

const SUBJECTS = ['GK', 'English', 'Maths', 'Reasoning'];

/** SSC-CGL / SSC-CHSL standard categories per subject */
const CATEGORIES_BY_SUBJECT = {
  GK: [
    'History',
    'Ancient History',
    'Medieval History',
    'Modern History',
    'Indian Freedom Struggle',
    'Geography',
    'Indian Geography',
    'World Geography',
    'Polity',
    'Indian Constitution',
    'Economics',
    'Indian Economy',
    'Budget & Fiscal Policy',
    'Science',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer & Technology',
    'Environment & Ecology',
    'Sports',
    'Awards & Honour',
    'Books & Authors',
    'Art & Culture',
    'Current Affairs',
    'Static GK',
    'Miscellaneous GK',
    'Other (custom)...',
  ],
  English: [
    'Reading Comprehension',
    'Synonyms',
    'Antonyms',
    'Idioms & Phrases',
    'One Word Substitution',
    'Error Detection',
    'Sentence Correction',
    'Fill in the Blanks',
    'Cloze Test',
    'Para Jumbles',
    'Spelling Correction',
    'Active & Passive Voice',
    'Direct & Indirect Speech',
    'Grammar',
    'Vocabulary',
    'Other (custom)...',
  ],
  Maths: [
    'Number System',
    'HCF & LCM',
    'Simplification',
    'Percentage',
    'Profit & Loss',
    'Discount',
    'Ratio & Proportion',
    'Average',
    'Mixture & Alligation',
    'Time & Work',
    'Pipes & Cisterns',
    'Time, Speed & Distance',
    'Boats & Streams',
    'Simple Interest',
    'Compound Interest',
    'Algebra',
    'Geometry',
    'Mensuration',
    'Trigonometry',
    'Data Interpretation',
    'Statistics',
    'Other (custom)...',
  ],
  Reasoning: [
    'Analogy',
    'Classification',
    'Series',
    'Number Series',
    'Alphabet Series',
    'Coding & Decoding',
    'Blood Relations',
    'Direction & Distance',
    'Ranking & Arrangement',
    'Seating Arrangement',
    'Puzzle',
    'Venn Diagram',
    'Syllogism',
    'Statement & Conclusion',
    'Matrix',
    'Mirror Image',
    'Paper Folding',
    'Embedded Figures',
    'Dice',
    'Mathematical Operations',
    'Missing Number',
    'Other (custom)...',
  ],
};

const CUSTOM_SENTINEL = 'Other (custom)...';


const EMPTY_FORM = {
  question: '',
  optA: '',
  optB: '',
  optC: '',
  optD: '',
  correctAnswer: '0',   // index 0-3
  subject: 'GK',
  categoryChoice: '',   // value from dropdown
  categoryCustom: '',   // free text when "Other (custom)..." is chosen
  explanation: '',
};

function FormMode({ onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // When subject changes reset category choice
  const handleSubjectChange = (e) => {
    setForm((f) => ({ ...f, subject: e.target.value, categoryChoice: '', categoryCustom: '' }));
  };

  // Resolve the actual category string to save
  const resolvedCategory = form.categoryChoice === CUSTOM_SENTINEL
    ? form.categoryCustom.trim()
    : form.categoryChoice;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    const opts = [form.optA, form.optB, form.optC, form.optD];
    const payload = [{
      question: form.question.trim(),
      options: opts,
      correctAnswer: Number(form.correctAnswer),
      subject: form.subject,
      category: resolvedCategory || form.subject,
      explanation: form.explanation.trim(),
    }];

    setLoading(true);
    try {
      const res = await apiService.post('/questions/add', payload);
      if (res.status === 'success' || res.status === 'partial_success') {
        onSuccess(res.data?.inserted || 0, res.message || '');
        setForm(EMPTY_FORM);
      } else {
        setError(res.message || 'Something went wrong.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to add question. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, resolvedCategory, onSuccess]);

  const correctLetters = ['A', 'B', 'C', 'D'];
  const categoryOptions = CATEGORIES_BY_SUBJECT[form.subject] || [];

  return (
    <form className="add-q-form" onSubmit={handleSubmit}>
      <div className="add-q-field">
        <label className="add-q-label">Question *</label>
        <textarea
          className="add-q-textarea"
          placeholder="Type the full question text here…"
          rows={3}
          value={form.question}
          onChange={set('question')}
          required
        />
      </div>

      <div className="add-q-options-grid">
        {['A', 'B', 'C', 'D'].map((letter) => (
          <div key={letter} className="add-q-field">
            <label className="add-q-label">Option {letter} *</label>
            <input
              className="add-q-input"
              type="text"
              placeholder={`Option ${letter}`}
              value={form[`opt${letter}`]}
              onChange={set(`opt${letter}`)}
              required
            />
          </div>
        ))}
      </div>

      <div className="add-q-row">
        <div className="add-q-field">
          <label className="add-q-label">Correct Answer *</label>
          <select
            className="add-q-select"
            value={form.correctAnswer}
            onChange={set('correctAnswer')}
          >
            {correctLetters.map((l, i) => (
              <option key={i} value={i}>Option {l}</option>
            ))}
          </select>
        </div>

        <div className="add-q-field">
          <label className="add-q-label">Subject *</label>
          <select
            className="add-q-select"
            value={form.subject}
            onChange={handleSubjectChange}
          >
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="add-q-field">
          <label className="add-q-label">
            Category
            {form.categoryChoice && form.categoryChoice !== CUSTOM_SENTINEL && (
              <span className="add-q-category-chip">{form.categoryChoice}</span>
            )}
          </label>
          <select
            className="add-q-select"
            value={form.categoryChoice}
            onChange={set('categoryChoice')}
          >
            <option value="">— Select category —</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom category input (only when "Other" is chosen) */}
      {form.categoryChoice === CUSTOM_SENTINEL && (
        <div className="add-q-field add-q-custom-category">
          <label className="add-q-label">Custom Category *</label>
          <input
            className="add-q-input"
            type="text"
            placeholder="e.g. Environmental Science, Coding Theory…"
            value={form.categoryCustom}
            onChange={set('categoryCustom')}
            autoFocus
            required
          />
        </div>
      )}

      <div className="add-q-field">
        <label className="add-q-label">Explanation <span className="add-q-optional">(optional)</span></label>
        <textarea
          className="add-q-textarea"
          placeholder="Brief explanation of why the answer is correct…"
          rows={2}
          value={form.explanation}
          onChange={set('explanation')}
        />
      </div>

      {error && (
        <div className="add-q-error">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <button
        type="submit"
        className="add-q-submit-btn"
        disabled={
          loading ||
          !form.question.trim() ||
          !form.optA || !form.optB || !form.optC || !form.optD ||
          (form.categoryChoice === CUSTOM_SENTINEL && !form.categoryCustom.trim())
        }
      >
        {loading
          ? <><Loader2 size={15} className="spin-inline" /> Adding…</>
          : <><Plus size={15} /> Add Question</>}
      </button>
    </form>
  );
}


const JSON_HINT = `[
  {
    "question": "Which planet is closest to the Sun?",
    "options": ["Venus", "Mercury", "Mars", "Earth"],
    "correctAnswer": 1,
    "subject": "GK",
    "category": "Geography",
    "explanation": "Mercury is the closest planet to the Sun."
  },
  {
    "question": "Choose the correct synonym of BENEVOLENT.",
    "options": ["Cruel", "Kind", "Greedy", "Lazy"],
    "correctAnswer": 1,
    "subject": "English",
    "category": "Synonyms",
    "explanation": "Benevolent means well-meaning and kindly."
  },
  {
    "question": "If 20% of x = 50, find x.",
    "options": ["150", "200", "250", "300"],
    "correctAnswer": 2,
    "subject": "Maths",
    "category": "Percentage",
    "explanation": "x = 50 × 100 / 20 = 250"
  },
  {
    "question": "ABCD : BCDE :: PQRS : ?",
    "options": ["QRST", "RSTU", "STUV", "TUVW"],
    "correctAnswer": 0,
    "subject": "Reasoning",
    "category": "Analogy",
    "explanation": "Each letter shifts by 1 position forward."
  }
]

/* Valid subjects: GK | English | Maths | Reasoning
   correctAnswer: 0 = Option A, 1 = B, 2 = C, 3 = D */`;


function BatchMode({ onSuccess }) {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);

  const copyExample = useCallback(() => {
    // Strip the comment block before copying so it's valid JSON
    const jsonOnly = JSON_HINT.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    navigator.clipboard.writeText(jsonOnly).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const loadExample = useCallback(() => {
    const jsonOnly = JSON_HINT.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    setRaw(jsonOnly);
    setParsed(null);
    setParseError('');
  }, []);

  const handleParse = useCallback(() => {
    setParseError('');
    setParsed(null);
    try {
      const json = JSON.parse(raw.trim());
      const list = Array.isArray(json) ? json : json?.questions;
      if (!Array.isArray(list)) throw new Error('Must be a JSON array or { "questions": [...] }');
      if (list.length === 0) throw new Error('Array is empty.');
      if (list.length > 50) throw new Error('Max 50 questions per batch.');
      setParsed(list);
    } catch (err) {
      setParseError(err.message);
    }
  }, [raw]);

  const handleSubmit = useCallback(async () => {
    if (!parsed) return;
    setSubmitError('');
    setLoading(true);
    try {
      const res = await apiService.post('/questions/add', parsed);
      if (res.status === 'success' || res.status === 'partial_success') {
        onSuccess(res.data?.inserted || 0, res.message || '');
        setRaw('');
        setParsed(null);
      } else {
        setSubmitError(res.message || 'Something went wrong.');
      }
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [parsed, onSuccess]);

  return (
    <div className="add-q-batch">
      <div className="add-q-batch-hint">
        <HelpCircle size={13} />
        <span>Paste a JSON array (max 50 questions). Each item must have: <code>question</code>, <code>options</code> (4 items), <code>correctAnswer</code> (0-3 index), <code>subject</code> — valid subjects: <code>GK</code> · <code>English</code> · <code>Maths</code> · <code>Reasoning</code></span>
      </div>

      {/* Toolbar above textarea */}
      <div className="add-q-textarea-toolbar">
        <span className="add-q-toolbar-label">Your JSON</span>
        <div className="add-q-toolbar-actions">
          <button type="button" className="add-q-toolbar-btn" onClick={loadExample} title="Load the example template into the editor">
            Load Example
          </button>
          <button type="button" className="add-q-toolbar-btn add-q-toolbar-btn--copy" onClick={copyExample} title="Copy example JSON to clipboard">
            {copied ? <><CheckCircle size={13} /> Copied!</> : <><FileJson size={13} /> Copy Example</>}
          </button>
        </div>
      </div>

      <textarea
        className="add-q-textarea add-q-json-area"
        placeholder={JSON_HINT}
        rows={12}
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setParsed(null); setParseError(''); }}
        spellCheck={false}
      />


      {parseError && (
        <div className="add-q-error">
          <AlertTriangle size={14} /> {parseError}
        </div>
      )}

      {parsed && (
        <div className="add-q-parse-preview">
          <CheckCircle size={14} className="add-q-parse-ok" />
          <span><strong>{parsed.length}</strong> question{parsed.length !== 1 ? 's' : ''} ready to import</span>
        </div>
      )}

      <div className="add-q-batch-actions">
        <button
          type="button"
          className="add-q-parse-btn"
          onClick={handleParse}
          disabled={!raw.trim()}
        >
          <FileJson size={14} /> Validate JSON
        </button>
        <button
          type="button"
          className="add-q-submit-btn"
          onClick={handleSubmit}
          disabled={!parsed || loading}
        >
          {loading
            ? <><Loader2 size={15} className="spin-inline" /> Importing…</>
            : <><Send size={14} /> Import {parsed ? `${parsed.length} Questions` : ''}</>}
        </button>
      </div>

      {submitError && (
        <div className="add-q-error" style={{ marginTop: '8px' }}>
          <AlertTriangle size={14} /> {submitError}
        </div>
      )}
    </div>
  );
}

/**
 * Panel rendered inside DrillWorkspace → "Add Questions" tab.
 * Lets any user add questions to the shared MCQ drill bank.
 */
export function AddQuestionsPanel() {
  const [mode, setMode] = useState('form');      // 'form' | 'batch'
  const [toast, setToast] = useState(null);      // { count, message }

  const handleSuccess = useCallback((count, message) => {
    setToast({ count, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <div className="add-questions-panel">
      {/* Header */}
      <div className="add-q-header">
        <div className="add-q-title-group">
          <Database size={20} className="add-q-icon" />
          <div>
            <h2 className="add-q-title">Add Questions to Drill Bank</h2>
            <p className="add-q-subtitle">
              Questions you add go into the shared GK / English / Maths / Reasoning pool and appear in your drills immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="add-q-toast">
          <CheckCircle size={16} />
          <span>{toast.count > 0 ? `✅ ${toast.message}` : toast.message}</span>
          <button type="button" className="add-q-toast-close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <div className="add-q-mode-toggle">
        <button
          type="button"
          className={`add-q-mode-btn ${mode === 'form' ? 'active' : ''}`}
          onClick={() => setMode('form')}
        >
          <Plus size={14} /> Single Question Form
        </button>
        <button
          type="button"
          className={`add-q-mode-btn ${mode === 'batch' ? 'active' : ''}`}
          onClick={() => setMode('batch')}
        >
          <FileJson size={14} /> Batch JSON Paste
        </button>
      </div>

      {/* Mode content */}
      <div className="add-q-body">
        {mode === 'form'
          ? <FormMode onSuccess={handleSuccess} />
          : <BatchMode onSuccess={handleSuccess} />}
      </div>
    </div>
  );
}
