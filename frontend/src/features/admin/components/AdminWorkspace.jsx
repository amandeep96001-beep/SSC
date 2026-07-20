import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Shield, X, Upload, RefreshCw, Trash2, ListPlus, RotateCcw, Download, Users, BarChart3 } from 'lucide-react';
import { useExam } from '@/shared/context/useExam';
import { EXAM_LIST, getExamProfile } from '@/shared/examProfiles';
import { apiService } from '@/shared/services/apiService';
import { parseBulkQuestions, BULK_SAMPLE } from '@/shared/utils/parseBulkQuestions';
import {
  getEffectiveLimits,
  saveStoredLimitsForExam,
  sectionKeysFromLimits,
  totalFromLimits,
  formatSectionLimitsLabel,
  mergeLimitsWithSections,
} from '@/shared/utils/mockSectionLimits';
import { showAppToast } from '@/shared/utils/appToast';

const DEFAULT_BANK_SUBJECTS = ['GK', 'English', 'Maths', 'Reasoning'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const emptyDraft = () => ({
  q: '',
  o: ['', '', '', ''],
  a: 0,
  e: '',
});

function titleCaseSubject(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function defaultMockLimitsForExam(examId) {
  const profile = getExamProfile(examId);
  return mergeLimitsWithSections(
    profile.mockSectionLimits || {},
    profile.sections || []
  );
}

export function AdminWorkspace() {
  const { subjectsByExam, saveExamSubjects, refreshExamConfigs } = useExam();
  const [examId, setExamId] = useState('ssc');
  const [subjects, setSubjects] = useState([]);
  const [draft, setDraft] = useState('');
  const [allSubjects, setAllSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [uploadMode, setUploadMode] = useState('one'); // one | bulk
  const [tcsSubject, setTcsSubject] = useState('GK');
  const [customBankSubject, setCustomBankSubject] = useState('');
  const [extraBankSubjects, setExtraBankSubjects] = useState([]);
  const [tcsTopic, setTcsTopic] = useState('');
  const [qDraft, setQDraft] = useState(emptyDraft);
  const [bulkText, setBulkText] = useState('');
  const [queue, setQueue] = useState([]);
  const [tcsUploading, setTcsUploading] = useState(false);
  const [tcsMsg, setTcsMsg] = useState('');
  const [tcsErr, setTcsErr] = useState('');
  const [tcsStats, setTcsStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [instituteSummary, setInstituteSummary] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [mockLimits, setMockLimits] = useState({});
  const [mockSectionDraft, setMockSectionDraft] = useState('');
  const [mockSectionCount, setMockSectionCount] = useState(25);
  const [mockPatternMsg, setMockPatternMsg] = useState('');

  const bankSubjects = useMemo(() => {
    const fromStats = tcsStats?.subjects || Object.keys(tcsStats?.bySubject || {});
    const merged = [...DEFAULT_BANK_SUBJECTS, ...fromStats, ...extraBankSubjects];
    const seen = new Set();
    return merged.filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tcsStats, extraBankSubjects]);

  const statsEntries = useMemo(() => {
    if (tcsStats?.bySubject && typeof tcsStats.bySubject === 'object') {
      return Object.entries(tcsStats.bySubject).sort((a, b) => b[1] - a[1]);
    }
    return bankSubjects.map((s) => [s, 0]);
  }, [tcsStats, bankSubjects]);

  const loadAllSubjects = async () => {
    try {
      const res = await apiService.get('/study/subjects?source=global');
      const list = res?.data || [];
      const names = (Array.isArray(list) ? list : [])
        .map((s) => (typeof s === 'string' ? s : s.name))
        .filter(Boolean);
      setAllSubjects(names);
    } catch {
      setAllSubjects([]);
    }
  };

  const loadTcsStats = async () => {
    setStatsLoading(true);
    try {
      const res = await apiService.get('/questions/tcs/stats');
      setTcsStats(res?.data || null);
    } catch {
      setTcsStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadInstituteSummary = async () => {
    try {
      const res = await apiService.get('/auth/admin/summary');
      if (res?.status === 'success') setInstituteSummary(res.data);
    } catch {
      /* ignore */
    }
  };

  const exportInstituteCsv = async (kind) => {
    setExporting(true);
    try {
      const path = kind === 'mock'
        ? '/auth/mock-progress/export?scope=all'
        : '/auth/progress/export?scope=all';
      const file = kind === 'mock' ? 'institute-mock-progress.csv' : 'institute-syllabus-progress.csv';
      await apiService.download(path, file);
      showAppToast('Export downloaded.', { variant: 'success', durationMs: 2200 });
    } catch (e) {
      showAppToast(e.message || 'Export failed.', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    refreshExamConfigs();
    loadAllSubjects();
    loadTcsStats();
    loadInstituteSummary();
  }, [refreshExamConfigs]);

  useEffect(() => {
    setSubjects([...(subjectsByExam[examId] || [])]);
    setMsg('');
    setErr('');
    setMockPatternMsg('');
    const defaults = defaultMockLimitsForExam(examId);
    const stored = getEffectiveLimits(examId, null);
    setMockLimits(
      stored && Object.keys(stored).length > 0
        ? { ...stored }
        : defaults
    );
  }, [examId, subjectsByExam]);

  useEffect(() => {
    if (!bankSubjects.includes(tcsSubject) && bankSubjects.length) {
      setTcsSubject(bankSubjects[0]);
    }
  }, [bankSubjects, tcsSubject]);

  const selected = EXAM_LIST.find((e) => e.id === examId);

  const mockSectionNames = sectionKeysFromLimits(mockLimits);
  const mockPatternTotal = totalFromLimits(mockLimits);
  const mockPatternLabel = formatSectionLimitsLabel(mockLimits);

  const persistMockLimits = (next) => {
    setMockLimits(next);
    saveStoredLimitsForExam(examId, next);
  };

  const setMockLimitValue = (section, raw) => {
    const n = Math.max(0, Math.min(500, Number(raw) || 0));
    persistMockLimits({ ...mockLimits, [section]: n });
  };

  const addMockSection = () => {
    const name = titleCaseSubject(mockSectionDraft);
    if (!name) {
      setMockPatternMsg('Enter a section name (e.g. Computer).');
      return;
    }
    const existing = mockSectionNames.find((s) => s.toLowerCase() === name.toLowerCase());
    if (existing) {
      setMockPatternMsg(`“${existing}” is already in this exam’s mock pattern.`);
      return;
    }
    const count = Math.max(0, Math.min(500, Number(mockSectionCount) || 0));
    persistMockLimits({ ...mockLimits, [name]: count });
    setMockSectionDraft('');
    setMockSectionCount(25);
    setMockPatternMsg(`Added “${name}” (${count} Q) to ${selected?.name || examId} mock pattern.`);
    showAppToast(`Mock section “${name}” added for ${selected?.name || examId}.`, {
      variant: 'success',
      durationMs: 2500,
    });
  };

  const removeMockSection = (section) => {
    const next = { ...mockLimits };
    delete next[section];
    persistMockLimits(next);
    setMockPatternMsg(`Removed “${section}” from mock pattern.`);
  };

  const resetMockPattern = () => {
    const defaults = defaultMockLimitsForExam(examId);
    persistMockLimits(defaults);
    setMockPatternMsg(`Reset ${selected?.name || examId} mock pattern to defaults.`);
    showAppToast('Mock pattern reset to exam defaults.', { variant: 'info', durationMs: 2200 });
  };

  const addBankSubject = () => {
    const n = titleCaseSubject(customBankSubject);
    if (!n) {
      setTcsErr('Enter a subject name (e.g. Computer).');
      return;
    }
    const exists = bankSubjects.some((s) => s.toLowerCase() === n.toLowerCase());
    if (exists) {
      const match = bankSubjects.find((s) => s.toLowerCase() === n.toLowerCase());
      setTcsSubject(match);
      setCustomBankSubject('');
      setTcsMsg(`Subject “${match}” selected.`);
      return;
    }
    setExtraBankSubjects((prev) => [...prev, n]);
    setTcsSubject(n);
    setCustomBankSubject('');
    setTcsErr('');
    setTcsMsg(`Subject “${n}” added. Upload questions under it.`);
  };

  const ensureOfficialSubject = async (name) => {
    const exists = allSubjects.some((s) => s.toLowerCase() === name.toLowerCase());
    if (exists) return { ok: true };
    try {
      const res = await apiService.post('/study/subjects', { name, scope: 'global' });
      if (res?.status === 'success') {
        setAllSubjects((prev) => (prev.some((s) => s.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]));
        return { ok: true, created: !res?.data?.alreadyExisted };
      }
      return { ok: false, message: res?.message || 'Could not create subject.' };
    } catch (e) {
      return { ok: false, message: e.message || 'Could not create subject.' };
    }
  };

  const addSubject = async (name) => {
    const n = String(name || draft).trim();
    if (!n || adding) return;
    if (subjects.some((s) => s.toLowerCase() === n.toLowerCase())) {
      setDraft('');
      return;
    }

    setAdding(true);
    setErr('');
    const ensured = await ensureOfficialSubject(n);
    setAdding(false);
    if (!ensured.ok) {
      setErr(ensured.message || 'Failed to add subject.');
      return;
    }

    setSubjects((prev) => [...prev, n]);
    setDraft('');
    setMsg(
      ensured.created
        ? `Created “${n}” and added to ${selected?.name || examId}. Save to publish for students.`
        : `Added “${n}” to ${selected?.name || examId}. Save to publish for students.`
    );
  };

  const removeSubject = (name) => {
    setSubjects((prev) => prev.filter((s) => s !== name));
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    setErr('');
    const res = await saveExamSubjects(examId, subjects);
    setSaving(false);
    if (res.success) {
      setMsg(`Saved for ${selected?.name || examId}. Students targeting this exam will see this subject list.`);
    } else {
      setErr(res.message || 'Save failed');
    }
  };

  const setOption = (idx, value) => {
    setQDraft((prev) => {
      const o = [...prev.o];
      o[idx] = value;
      return { ...prev, o };
    });
  };

  const validateDraft = () => {
    const q = qDraft.q.trim();
    const o = qDraft.o.map((x) => x.trim());
    if (!q) return 'Please enter the question.';
    if (o.some((x) => !x)) return 'Please fill all four options (A–D).';
    if (qDraft.a < 0 || qDraft.a > 3) return 'Please select the correct answer.';
    return null;
  };

  const addToQueue = () => {
    setTcsErr('');
    setTcsMsg('');
    const problem = validateDraft();
    if (problem) {
      setTcsErr(problem);
      return;
    }
    const category = tcsTopic.trim() || 'General';
    setQueue((prev) => [
      ...prev,
      {
        subject: tcsSubject,
        category,
        q: qDraft.q.trim(),
        o: qDraft.o.map((x) => x.trim()),
        a: qDraft.a,
        e: qDraft.e.trim(),
      },
    ]);
    setQDraft(emptyDraft());
    setTcsMsg('Added to the queue. Add more questions, or upload when ready.');
  };

  const removeFromQueue = (idx) => {
    setQueue((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearQueue = () => {
    setQueue([]);
    setTcsMsg('');
    setTcsErr('');
  };

  const addBulkToQueue = () => {
    setTcsErr('');
    setTcsMsg('');
    if (!bulkText.trim()) {
      setTcsErr('Please paste questions in the bulk editor before continuing.');
      return;
    }
    const { items, errors } = parseBulkQuestions(bulkText, {
      subject: tcsSubject,
      category: tcsTopic.trim() || 'General',
    });
    if (items.length === 0) {
      setTcsErr(
        errors[0]
          || 'No valid questions found. Use: Q: … / A) B) C) D) / Ans: C'
      );
      return;
    }
    setQueue((prev) => [...prev, ...items]);
    setBulkText('');
    const skipNote = errors.length ? ` (${errors.length} skipped)` : '';
    setTcsMsg(`${items.length} question${items.length === 1 ? '' : 's'} added to the queue${skipNote}. Upload when ready.`);
  };

  const loadBulkSample = () => {
    setBulkText(BULK_SAMPLE);
    setTcsErr('');
    setTcsMsg('Sample loaded. Review, then add to the queue.');
  };

  const uploadQueue = async () => {
    setTcsMsg('');
    setTcsErr('');
    if (queue.length === 0) {
      setTcsErr('Add at least one question to the queue before uploading.');
      return;
    }

    setTcsUploading(true);
    try {
      const res = await apiService.post('/questions/tcs/bulk', queue);
      setTcsMsg(res?.message || 'Upload complete.');
      if (res?.data?.stats) setTcsStats(res.data.stats);
      else await loadTcsStats();
      if ((res?.data?.inserted ?? 0) > 0) setQueue([]);
    } catch (e) {
      setTcsErr(e.message || 'Upload failed.');
    } finally {
      setTcsUploading(false);
    }
  };

  return (
    <div className="admin-workspace">
      <header className="admin-workspace__head">
        <p className="today-focus__eyebrow"><Shield size={14} /> Admin</p>
        <h1>Admin console</h1>
        <p>
          Configure exam subjects and add TCS / Daily Drill questions using the form or bulk import.
        </p>
      </header>

      <section className="admin-panel admin-panel--institute">
        <div className="admin-panel__title-row">
          <div>
            <h2><BarChart3 size={18} /> Institute health</h2>
            <p className="admin-panel__hint">
              Content bank depth and learner activity — export CSVs for coaching reports.
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { loadTcsStats(); loadInstituteSummary(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <div className="admin-institute-grid">
          <div className="admin-institute-stat">
            <Users size={16} />
            <strong>{instituteSummary?.userCount ?? '—'}</strong>
            <span>Learners</span>
          </div>
          <div className="admin-institute-stat">
            <ListPlus size={16} />
            <strong>{tcsStats?.total ?? 0}</strong>
            <span>Bank questions</span>
          </div>
          <div className="admin-institute-stat">
            <BarChart3 size={16} />
            <strong>{instituteSummary?.mockAttemptCount ?? '—'}</strong>
            <span>Mock attempts</span>
          </div>
          <div className="admin-institute-stat">
            <BarChart3 size={16} />
            <strong>{instituteSummary?.syllabusAttemptCount ?? '—'}</strong>
            <span>Topic attempts</span>
          </div>
        </div>
        <div className="admin-export-row">
          <button type="button" className="admin-btn" disabled={exporting} onClick={() => exportInstituteCsv('mock')}>
            <Download size={15} /> Export all mock results
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" disabled={exporting} onClick={() => exportInstituteCsv('syllabus')}>
            <Download size={15} /> Export all syllabus results
          </button>
        </div>
      </section>

      <section className="admin-panel admin-panel--tcs">
        <div className="admin-panel__title-row">
          <div>
            <h2><ListPlus size={18} /> Question bank</h2>
            <p className="admin-panel__hint">
              Select or add any subject (GK, Computer, etc.), then add questions one at a time or import in bulk.
              Questions are saved to Daily Drills and MCQ Battle.
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={loadTcsStats} disabled={statsLoading}>
            <RefreshCw size={14} /> {statsLoading ? '…' : 'Refresh'}
          </button>
        </div>

        <div className={`admin-tcs-stats${statsLoading && !tcsStats ? ' is-loading' : ''}`} aria-busy={statsLoading}>
          <span><strong>{tcsStats?.total ?? 0}</strong> total</span>
          {statsEntries.map(([name, count]) => (
            <span key={name}>{name} <strong>{count}</strong></span>
          ))}
        </div>

        <div className="admin-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`admin-mode-tab${uploadMode === 'one' ? ' is-active' : ''}`}
            aria-selected={uploadMode === 'one'}
            onClick={() => setUploadMode('one')}
          >
            One by one
          </button>
          <button
            type="button"
            role="tab"
            className={`admin-mode-tab${uploadMode === 'bulk' ? ' is-active' : ''}`}
            aria-selected={uploadMode === 'bulk'}
            onClick={() => setUploadMode('bulk')}
          >
            Bulk import
          </button>
        </div>

        <div className="admin-q-meta">
          <label className="admin-field">
            <span>Subject</span>
            <div className="admin-subject-pills" role="group" aria-label="Question bank subject">
              {bankSubjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`admin-subject-pill${tcsSubject === s ? ' is-active' : ''}`}
                  onClick={() => setTcsSubject(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="admin-add-bank-subject">
              <input
                value={customBankSubject}
                onChange={(e) => setCustomBankSubject(e.target.value)}
                placeholder="Add subject (e.g. Computer)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBankSubject();
                  }
                }}
              />
              <button type="button" className="admin-btn admin-btn--ghost" onClick={addBankSubject}>
                <Plus size={14} /> Add subject
              </button>
            </div>
          </label>
          <label className="admin-field">
            <span>Topic / chapter <em>(optional)</em></span>
            <input
              value={tcsTopic}
              onChange={(e) => setTcsTopic(e.target.value)}
              placeholder="e.g. Culture Geography, Vocabulary, Profit & Loss"
            />
          </label>
        </div>

        {uploadMode === 'one' ? (
          <div className="admin-q-form">
            <label className="admin-field">
              <span>Question</span>
              <textarea
                value={qDraft.q}
                onChange={(e) => setQDraft((p) => ({ ...p, q: e.target.value }))}
                placeholder="Enter the question stem…"
                rows={3}
              />
            </label>

            <div className="admin-q-options">
              {OPTION_LABELS.map((label, idx) => (
                <label key={label} className="admin-option-row">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={qDraft.a === idx}
                    onChange={() => setQDraft((p) => ({ ...p, a: idx }))}
                    title={`Mark ${label} as correct`}
                  />
                  <span className="admin-option-letter">{label}</span>
                  <input
                    type="text"
                    value={qDraft.o[idx]}
                    onChange={(e) => setOption(idx, e.target.value)}
                    placeholder={`Option ${label}`}
                  />
                </label>
              ))}
              <p className="admin-field-hint">Select the radio button next to the correct option.</p>
            </div>

            <label className="admin-field">
              <span>Explanation <em>(optional)</em></span>
              <textarea
                value={qDraft.e}
                onChange={(e) => setQDraft((p) => ({ ...p, e: e.target.value }))}
                placeholder="Brief explanation for the correct answer…"
                rows={2}
              />
            </label>

            <div className="admin-tcs-actions">
              <button type="button" className="admin-btn" onClick={addToQueue}>
                <Plus size={16} /> Add to queue
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-q-form">
            <p className="admin-bulk-guide">
              Enter multiple questions using the format below. The selected subject and topic
              will be applied to every question in this import.
            </p>
            <pre className="admin-bulk-example">{`Q: Question text here?
A) Option one
B) Option two
C) Option three
D) Option four
Ans: C
E: Short explanation (optional)

Q: Next question?
A) …
B) …
C) …
D) …
Ans: A`}</pre>
            <label className="admin-field">
              <span>Question list</span>
              <textarea
                className="admin-bulk-input"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Enter or paste questions using the format shown above…"
                rows={14}
                spellCheck={false}
              />
            </label>
            <div className="admin-tcs-actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={loadBulkSample}>
                Load sample
              </button>
              <button type="button" className="admin-btn" onClick={addBulkToQueue} disabled={!bulkText.trim()}>
                <Plus size={16} /> Add to queue
              </button>
            </div>
          </div>
        )}

        {queue.length > 0 && (
          <div className="admin-q-queue">
            <div className="admin-q-queue__head">
              <h3>{queue.length} question{queue.length === 1 ? '' : 's'} in queue</h3>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={clearQueue}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
            <ul className="admin-q-queue__list">
              {queue.map((item, idx) => (
                <li key={`${idx}-${item.q.slice(0, 24)}`}>
                  <div>
                    <span className="admin-q-queue__meta">{item.subject} · {item.category}</span>
                    <p>{item.q}</p>
                    <span className="admin-q-queue__ans">
                      Ans: {OPTION_LABELS[item.a]}) {item.o[item.a]}
                    </span>
                  </div>
                  <button type="button" onClick={() => removeFromQueue(idx)} aria-label="Remove">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="admin-save"
              onClick={uploadQueue}
              disabled={tcsUploading}
            >
              <Upload size={16} /> {tcsUploading ? 'Uploading…' : `Upload ${queue.length} question${queue.length === 1 ? '' : 's'}`}
            </button>
          </div>
        )}

        {tcsMsg && <p className="admin-ok">{tcsMsg}</p>}
        {tcsErr && <p className="admin-err">{tcsErr}</p>}
      </section>

      <div className="admin-exam-tabs">
        {EXAM_LIST.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`admin-exam-tab${examId === e.id ? ' is-active' : ''}`}
            style={{ '--exam-accent': e.accent }}
            onClick={() => setExamId(e.id)}
          >
            {e.name}
          </button>
        ))}
      </div>

      <section className="admin-panel">
        <h2>{selected?.fullName || examId}</h2>
        <p className="admin-panel__hint">
          Students who pick <strong>{selected?.name || examId}</strong> see only these subjects on
          What to study and Official Syllabus.
        </p>

        <div className="admin-subject-chips">
          {subjects.map((s) => (
            <span key={s} className="admin-chip">
              {s}
              <button type="button" onClick={() => removeSubject(s)} aria-label={`Remove ${s}`}>
                <X size={14} />
              </button>
            </span>
          ))}
          {subjects.length === 0 && (
            <p className="study-empty">
              No subjects for this exam yet. Add from the official list below, or type a new name.
            </p>
          )}
        </div>

        <div className="admin-add-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`New subject for ${selected?.name || 'this exam'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubject();
              }
            }}
          />
          <button type="button" className="admin-btn" onClick={() => addSubject()} disabled={adding}>
            <Plus size={16} /> {adding ? 'Adding…' : 'Add'}
          </button>
        </div>

        {allSubjects.length > 0 && (
          <div className="admin-suggest">
            <p>Quick add from official syllabus (shared notes &amp; topics):</p>
            <div className="admin-suggest__list">
              {allSubjects.map((name) => {
                const on = subjects.some((s) => s.toLowerCase() === name.toLowerCase());
                return (
                  <button
                    key={name}
                    type="button"
                    className={`admin-suggest-btn${on ? ' is-on' : ''}`}
                    disabled={on || adding}
                    onClick={() => addSubject(name)}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button type="button" className="admin-save" onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving…' : `Save syllabus subjects for ${selected?.name || 'exam'}`}
        </button>
        {msg && <p className="admin-ok">{msg}</p>}
        {err && <p className="admin-err">{err}</p>}

        <div className="admin-mock-pattern">
          <div className="admin-mock-pattern__head">
            <div>
              <h3>Mock paper pattern</h3>
              <p>
                Sections for <strong>{selected?.name || examId}</strong> full mocks.
                Add any subject (e.g. Computer). Total: <strong>{mockPatternTotal}</strong>
                {mockPatternLabel ? ` · ${mockPatternLabel}` : ''}.
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={resetMockPattern}>
              <RotateCcw size={14} /> Reset defaults
            </button>
          </div>

          <div className="admin-mock-pattern__rows">
            {mockSectionNames.length === 0 && (
              <p className="study-empty">No sections yet. Add one below.</p>
            )}
            {mockSectionNames.map((s) => (
              <div key={s} className="admin-mock-pattern__row">
                <span className="admin-mock-pattern__name">{s}</span>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={mockLimits[s] ?? 0}
                  onChange={(e) => setMockLimitValue(s, e.target.value)}
                  aria-label={`${s} question count`}
                />
                <button
                  type="button"
                  className="admin-mock-pattern__remove"
                  onClick={() => removeMockSection(s)}
                  aria-label={`Remove ${s}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="admin-mock-pattern__add">
            <input
              value={mockSectionDraft}
              onChange={(e) => setMockSectionDraft(e.target.value)}
              placeholder="Section name (e.g. Computer)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addMockSection();
                }
              }}
            />
            <input
              type="number"
              min={0}
              max={500}
              value={mockSectionCount}
              onChange={(e) => setMockSectionCount(e.target.value)}
              aria-label="Question count"
              title="Questions in this section"
            />
            <button type="button" className="admin-btn" onClick={addMockSection}>
              <Plus size={16} /> Add section
            </button>
          </div>
          {mockPatternMsg && <p className="admin-ok">{mockPatternMsg}</p>}
        </div>
      </section>
    </div>
  );
}
