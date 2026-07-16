import { useState, useEffect } from 'react';
import { Plus, Check, Play, BookOpen, Inbox, Trash2, XCircle, List } from 'lucide-react';

export function MockWorkspace({ mockTestsApi, startMockExam }) {
  const { mockTests, loading, error, loadMockTests, addMockTest, removeMockTest } = mockTestsApi;
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    loadMockTests();
  }, [loadMockTests]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(jsonInput);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Input must be a JSON array.');
      }
    } catch (err) {
      setFormError('Invalid JSON format: ' + err.message);
      return;
    }

    if (parsedQuestions.length === 0) {
      setFormError('Please add at least one question.');
      return;
    }

    // Ensure all options are strings to prevent Mongoose CastError on nested arrays
    parsedQuestions = parsedQuestions.map(q => {
      if (Array.isArray(q.o)) {
        q.o = q.o.map(opt => typeof opt === 'string' ? opt : JSON.stringify(opt));
      }
      return q;
    });

    const payload = {
      title,
      year,
      date,
      shift,
      questions: parsedQuestions
    };

    const res = await addMockTest(payload);
    if (res.success) {
      setFormSuccess(`Successfully added Mock Test with ${parsedQuestions.length} questions!`);
      setTitle('');
      setYear('');
      setDate('');
      setShift('');
      setJsonInput('');
      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess('');
      }, 2000);
    } else {
      setFormError(res.error || 'Failed to add mock test.');
    }
  };

  return (
    <div className="study-workspace">
      <div className="workspace-header-sticky">
        <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
          <div style={{ flex: '1 1 auto', minWidth: '250px' }}>
            <h1 style={{ margin: '0 0 6px 0' }}>Full Mock Exams</h1>
            <p style={{ margin: 0 }}>Timed 100-question papers — 60 minutes, four sections. Upload your own mock papers.</p>
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

      <div className="workspace-scrollable-content">

      {showAddForm ? (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
          {/* Add Form */}
          <div className="mock-glass-card" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>Add Mock JSON</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                className="mock-premium-input" 
                placeholder="Test Title (e.g. Full Mock 1)" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
              <div style={{ display: 'flex', gap: '15px' }}>
                <input type="text" className="mock-premium-input" placeholder="Year (Optional)" value={year} onChange={e => setYear(e.target.value)} />
                <input type="text" className="mock-premium-input" placeholder="Date (Optional)" value={date} onChange={e => setDate(e.target.value)} />
                <input type="text" className="mock-premium-input" placeholder="Shift (Optional)" value={shift} onChange={e => setShift(e.target.value)} />
              </div>
              <textarea 
                className="mock-premium-input" 
                placeholder="Paste your JSON array of questions here..." 
                rows="10" 
                value={jsonInput} 
                onChange={e => setJsonInput(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'monospace' }}
                required
              ></textarea>
              
              {formError && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{formError}</div>}
              {formSuccess && <div style={{ color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}><Check size={16} style={{ marginRight: '5px' }} /> {formSuccess}</div>}
              
              <button type="submit" className="btn-create-topic" style={{ alignSelf: 'flex-start', padding: '10px 20px', marginTop: 'auto' }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Mock Test'}
              </button>
            </form>
          </div>

          {/* Hint Side Panel */}
          <div className="mock-glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
              <BookOpen size={18} style={{ marginRight: '8px', color: 'var(--color-primary)' }}/> 
              Format Hint
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0' }}>
              Your JSON must be an array of objects. Valid sections are: English, GK, Quant, Reasoning.
            </p>
            <pre className="mock-hint-pre" style={{ flex: 1 }}>
{`[
  {
    "section": "English",
    "q": "Identify the synonym of 'Abundant'.",
    "o": [
      "Scarce", 
      "Plentiful", 
      "Rare", 
      "Empty"
    ],
    "a": 1,
    "e": "Plentiful means existing in or yielding great quantities; abundant."
  }
]`}
            </pre>
          </div>
        </div>
      ) : (
        <>
          {mockTests.length === 0 && !loading ? (
            <div className="empty-state-card">
              <Inbox size={44} className="empty-state-icon" />
              <h2>No Mock Tests Yet</h2>
              <p>
                Mock tests from your database will appear here. Add one using the button above, or run <code>npm run seed</code> in the backend if you use a fresh database.
              </p>
              <button className="btn-create-topic" onClick={() => setShowAddForm(true)}>
                <Plus size={16} />
                Add Mock Test
              </button>
            </div>
          ) : (
            <div className="subjects-grid">
              {loading && mockTests.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Loading secure mock tests...</p>}
          
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
                Start 60 Min Exam
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
              Are you completely sure you want to permanently delete this mock test? 
              <br/><br/>
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
                  await removeMockTest(deletingTestId);
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
