import { useState, useEffect, useMemo } from 'react';
import { Plus, Check, Play, Inbox, Trash2, XCircle, List, RotateCcw } from 'lucide-react';
import { useExam } from '@/shared/context/useExam';
import {
  parseBulkQuestions,
  toCompactMcqs,
  buildBulkMockExample,
} from '@/shared/utils/parseBulkQuestions';
import {
  validateMockSectionLimits,
  formatSectionLimitsLabel,
  countBySection,
  sectionKeysFromLimits,
  totalFromLimits,
  getEffectiveLimits,
  saveStoredLimitsForExam,
  mergeLimitsWithSections,
} from '@/shared/utils/mockSectionLimits';
import { showAppToast } from '@/shared/utils/appToast';

export function MockWorkspace({ mockTestsApi, startMockExam, canEditPattern = false }) {
  const { exam, examId } = useExam();
  const { mockTests, loading, error, loadMockTests, addMockTest, removeMockTest } = mockTestsApi;
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState(null);

  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [defaultSection, setDefaultSection] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [sectionLimits, setSectionLimits] = useState({});
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionCount, setNewSectionCount] = useState(25);

  const sections = useMemo(
    () => sectionKeysFromLimits(sectionLimits),
    [sectionLimits]
  );

  const limitsLabel = formatSectionLimitsLabel(sectionLimits);
  const expectedTotal = totalFromLimits(sectionLimits);
  const mockExample = useMemo(() => buildBulkMockExample(sections.filter((s) => Number(sectionLimits[s]) > 0).length
    ? sections.filter((s) => Number(sectionLimits[s]) > 0)
    : sections), [sections, sectionLimits]);

  const liveCounts = useMemo(() => {
    if (!bulkText.trim()) return countBySection([], sections);
    const { items } = parseBulkQuestions(bulkText, {
      defaultSection,
      allowedSections: sections,
    });
    const { items: compact } = toCompactMcqs(items, { requireSection: false });
    const withSection = compact.map((q, i) => ({
      ...q,
      section: q.section || items[i]?.section || defaultSection,
    }));
    return countBySection(withSection, sections);
  }, [bulkText, defaultSection, sections]);

  useEffect(() => {
    const defaults = mergeLimitsWithSections(
      exam.mockSectionLimits || {},
      exam.sections || []
    );
    const stored = getEffectiveLimits(examId, null);
    // Prefer admin-saved pattern (may include Computer etc.); else exam defaults
    const effective =
      stored && Object.keys(stored).length > 0
        ? { ...stored }
        : defaults;
    setSectionLimits(effective);
    const keys = Object.keys(effective);
    const firstActive = keys.find((s) => Number(effective[s]) > 0) || keys[0] || '';
    setDefaultSection(firstActive);
    setNewSectionName('');
    setNewSectionCount(25);
  }, [examId, exam]);

  useEffect(() => {
    loadMockTests(examId);
  }, [loadMockTests, examId]);

  const persistLimits = (next) => {
    setSectionLimits(next);
    saveStoredLimitsForExam(examId, next);
  };

  const setLimitValue = (section, raw) => {
    const n = Math.max(0, Math.min(500, Number(raw) || 0));
    persistLimits({ ...sectionLimits, [section]: n });
  };

  const addSection = () => {
    const name = String(newSectionName || '')
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    if (!name) {
      setFormError('Enter a section name (e.g. Computer).');
      return;
    }
    const exists = sections.find((s) => s.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDefaultSection(exists);
      setNewSectionName('');
      setFormError('');
      return;
    }
    const count = Math.max(0, Math.min(500, Number(newSectionCount) || 0));
    const next = { ...sectionLimits, [name]: count };
    persistLimits(next);
    setDefaultSection(name);
    setNewSectionName('');
    setNewSectionCount(25);
    setFormError('');
    showAppToast(`Section “${name}” added to ${exam.name} mock pattern.`, {
      variant: 'success',
      durationMs: 2400,
    });
  };

  const removeSection = (section) => {
    const next = { ...sectionLimits };
    delete next[section];
    persistLimits(next);
    if (defaultSection === section) {
      const keys = Object.keys(next);
      setDefaultSection(keys.find((s) => Number(next[s]) > 0) || keys[0] || '');
    }
  };

  const resetLimits = () => {
    const defaults = mergeLimitsWithSections(
      exam.mockSectionLimits || {},
      exam.sections || []
    );
    persistLimits(defaults);
    showAppToast(`Reset to ${exam.name} default pattern.`, { variant: 'info', durationMs: 2200 });
  };

  const resetForm = () => {
    setTitle('');
    setYear('');
    setDate('');
    setShift('');
    setBulkText('');
    const firstActive = sections.find((s) => Number(sectionLimits[s]) > 0) || sections[0] || '';
    setDefaultSection(firstActive);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim()) {
      setFormError('Please enter a test title.');
      return;
    }
    if (!bulkText.trim()) {
      setFormError('Please enter at least one question.');
      return;
    }

    const { items, errors } = parseBulkQuestions(bulkText, {
      defaultSection,
      allowedSections: sections,
    });
    if (items.length === 0) {
      setFormError(errors[0] || 'No valid questions found. Check the format guide.');
      return;
    }

    const { items: questions, errors: sectionErrors } = toCompactMcqs(items, {
      requireSection: true,
    });
    if (questions.length === 0) {
      setFormError(sectionErrors[0] || 'Each question needs a section label.');
      return;
    }

    const check = validateMockSectionLimits(questions, sectionLimits);
    if (!check.ok) {
      const toastMsg =
        `Not a proper ${exam.name} mock. `
        + check.issues.map((i) => {
          if (i.type === 'few') return `${i.section} has ${i.count} (need ${i.limit})`;
          if (i.type === 'many') return `${i.section} has ${i.count} (max ${i.limit})`;
          return `${i.section}: unexpected / should be 0 (has ${i.count})`;
        }).join(' · ');
      showAppToast(toastMsg, { variant: 'warn', durationMs: 5500 });
      setFormError(check.summary || toastMsg);
      return;
    }

    const payload = {
      title: title.trim(),
      examId,
      year,
      date,
      shift,
      questions,
    };

    const res = await addMockTest(payload);
    if (res.success) {
      const skipped = errors.length + sectionErrors.length;
      const okMsg = skipped
        ? `Saved ${exam.name} mock with ${questions.length} questions (${skipped} skipped).`
        : `Saved proper ${exam.name} mock · ${questions.length} questions.`;
      setFormSuccess(okMsg);
      showAppToast(okMsg, { variant: 'success', durationMs: 2800 });
      resetForm();
      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess('');
      }, 2000);
    } else {
      setFormError(res.error || 'Failed to save mock test.');
      showAppToast(res.error || 'Failed to save mock test.', { variant: 'error' });
    }
  };

  return (
    <div className={`study-workspace${showAddForm ? ' study-workspace--mock-add' : ''}`}>
      <div className="workspace-header-sticky">
        <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
          <div style={{ flex: '1 1 auto', minWidth: '250px' }}>
            <h1 style={{ margin: '0 0 6px 0' }}>Full Mock Exams</h1>
            <p style={{ margin: 0 }}>
              {exam.fullName} mocks only · pattern {expectedTotal || exam.mockQuestions} Q · {exam.mockMinutes} min · {exam.markingLabel}.
              Set section weights below, then add questions — no JSON required.
            </p>
          </div>
          <button className="btn-create-topic" style={{ marginLeft: 'auto' }} onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError('');
            setFormSuccess('');
          }}>
            {showAddForm ? <List size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
            {showAddForm ? 'View Mocks' : 'Add New Mock'}
          </button>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}
      </div>

      <div className={`workspace-scrollable-content${showAddForm ? ' workspace-scrollable-content--mock-add' : ''}`}>
        {showAddForm ? (
          <div className="mock-add-layout">
            <div className="mock-glass-card mock-add-form-card">
              <h2 className="mock-add-title">Create {exam.name} mock</h2>
              <div className="mock-panel-scroll">
                <form onSubmit={handleAddSubmit} className="mock-add-form">
                  <label className="mock-field">
                    <span>Test title</span>
                    <input
                      type="text"
                      className="mock-premium-input"
                      placeholder={`e.g. ${exam.name} Full Mock 1`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </label>

                  <div className="mock-meta-row">
                    <label className="mock-field">
                      <span>Year</span>
                      <input type="text" className="mock-premium-input" placeholder="Optional" value={year} onChange={(e) => setYear(e.target.value)} />
                    </label>
                    <label className="mock-field">
                      <span>Date</span>
                      <input type="text" className="mock-premium-input" placeholder="Optional" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>
                    <label className="mock-field">
                      <span>Shift</span>
                      <input type="text" className="mock-premium-input" placeholder="Optional" value={shift} onChange={(e) => setShift(e.target.value)} />
                    </label>
                  </div>

                  <div className="mock-limits-box">
                    <div className="mock-limits-head">
                      <div>
                        <p className="mock-limits-title">{exam.name} mock sections</p>
                        <p className="mock-limits-expected">
                          {canEditPattern
                            ? 'Admin can add any subject (e.g. Computer) and set counts for this exam.'
                            : 'Question counts required for a proper mock on this exam.'}
                          {' '}Total: <strong>{expectedTotal}</strong>
                          {limitsLabel ? ` · ${limitsLabel}` : ''}
                        </p>
                      </div>
                      {canEditPattern && (
                        <button type="button" className="admin-btn admin-btn--ghost mock-reset-limits" onClick={resetLimits}>
                          <RotateCcw size={14} /> Reset defaults
                        </button>
                      )}
                    </div>
                    <div className="mock-limit-inputs">
                      {sections.map((s) => (
                        <div key={s} className={`mock-limit-input${canEditPattern ? ' mock-limit-input--with-remove' : ''}`}>
                          <label>
                            <span>{s}</span>
                            <input
                              type="number"
                              min={0}
                              max={500}
                              value={sectionLimits[s] ?? 0}
                              onChange={(e) => canEditPattern && setLimitValue(s, e.target.value)}
                              readOnly={!canEditPattern}
                            />
                          </label>
                          {canEditPattern && (
                            <button
                              type="button"
                              className="mock-limit-remove"
                              onClick={() => removeSection(s)}
                              aria-label={`Remove ${s}`}
                              title="Remove section"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {canEditPattern && (
                      <div className="mock-add-section">
                        <input
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="Add section (e.g. Computer)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSection();
                            }
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={newSectionCount}
                          onChange={(e) => setNewSectionCount(e.target.value)}
                          aria-label="Section question count"
                        />
                        <button type="button" className="admin-btn" onClick={addSection}>
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    )}
                    <div className="mock-count-chips" style={{ marginTop: 10 }}>
                      {sections.map((s) => {
                        const need = Number(sectionLimits[s] || 0);
                        const have = liveCounts[s] || 0;
                        let status = 'idle';
                        if (need === 0) status = have > 0 ? 'bad' : 'skip';
                        else if (have === need) status = 'ok';
                        else if (have > need) status = 'bad';
                        else if (have > 0) status = 'low';
                        return (
                          <span key={s} className={`mock-count-chip mock-count-chip--${status}`}>
                            {s} {have}/{need}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mock-field">
                    <span>Default section</span>
                    <div className="mock-section-pills" role="group" aria-label="Default section">
                      {sections.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`mock-section-pill${defaultSection === s ? ' is-active' : ''}`}
                          onClick={() => setDefaultSection(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="mock-field-hint">
                      Used when a question has no Section line. Override with Section: {sections[0] || '…'}
                    </p>
                  </div>

                  <label className="mock-field mock-field--questions">
                    <span>Questions</span>
                    <textarea
                      className="mock-premium-input mock-bulk-input"
                      placeholder="Enter questions using the format shown on the right…"
                      rows={12}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      required
                    />
                  </label>

                  {formError && <div className="mock-form-error">{formError}</div>}
                  {formSuccess && (
                    <div className="mock-form-success">
                      <Check size={16} /> {formSuccess}
                    </div>
                  )}

                  <div className="mock-form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setBulkText(mockExample)}
                    >
                      Load sample
                    </button>
                    <button type="submit" className="btn-create-topic" disabled={loading}>
                      {loading ? 'Saving…' : `Save ${exam.name} mock`}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <aside className="mock-glass-card mock-format-card">
              <h3>Question format</h3>
              <p className="mock-format-intro">
                Use plain text as below. Sections for <strong>{exam.name}</strong>: {sections.join(', ')}.
                {limitsLabel ? (
                  <>
                    <br />
                    Current weights: {limitsLabel}.
                  </>
                ) : null}
              </p>
              <div className="mock-panel-scroll">
                <pre className="mock-hint-pre">{mockExample}</pre>
              </div>
            </aside>
          </div>
        ) : (
          <>
            {mockTests.length === 0 && !loading ? (
              <div className="empty-state-card">
                <Inbox size={44} className="empty-state-icon" />
                <h2>No {exam.name} mocks yet</h2>
                <p>
                  Mocks are stored per exam. Switch exam from the picker to see that exam’s papers, or add a new {exam.name} mock.
                </p>
                <button className="btn-create-topic" onClick={() => setShowAddForm(true)}>
                  <Plus size={16} />
                  Add {exam.name} Mock
                </button>
              </div>
            ) : (
              <div className="subjects-grid">
                {loading && mockTests.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Loading {exam.name} mocks…</p>}

                {mockTests.map((test) => (
                  <div key={test._id} className="mock-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>{test.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="mock-badge">{test.questionsCount || 0} Qs</span>
                          <button
                            onClick={() => { setDeletingTestId(test._id); setDeleteConfirmOpen(true); }}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Delete Mock Test"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      {test.year && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0' }}>Year: {test.year}</p>}
                      {test.date && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0' }}>Date: {test.date}</p>}
                      {test.shift && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0' }}>Shift: {test.shift}</p>}
                    </div>

                    <button
                      className="btn-premium-mock"
                      style={{ marginTop: '15px', width: '100%' }}
                      onClick={() => startMockExam(test._id)}
                    >
                      <Play size={16} style={{ marginRight: '8px', fill: 'currentColor' }} />
                      Start {exam.mockMinutes} Min Exam
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {deleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: '400px', borderTop: '4px solid #ef4444', background: 'var(--bg-card)' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', margin: 0 }}>
                <XCircle size={20} />
                Confirm Deletion
              </h3>
            </div>

            <div style={{ padding: '20px 0', color: 'var(--text-secondary)' }}>
              Delete this {exam.name} mock permanently?
              <br /><br />
              <strong style={{ color: 'var(--text-heading)' }}>This cannot be undone!</strong>
            </div>

            <div className="modal-footer-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn-cancel"
                style={{ flex: 1 }}
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save-topic"
                style={{ backgroundColor: '#ef4444', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={async () => {
                  setDeleteConfirmOpen(false);
                  await removeMockTest(deletingTestId, examId);
                }}
              >
                <Trash2 size={15} strokeWidth={2} /> Yes, Delete It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
