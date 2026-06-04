import { useState, useEffect } from 'react';
import { Plus, Check, Play, BookOpen, Inbox } from 'lucide-react';

export function MockWorkspace({ useMockTests, startMockExam }) {
  const { mockTests, loading, error, loadMockTests, addMockTest } = useMockTests();
  const [showAddForm, setShowAddForm] = useState(false);

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

    let parsedQuestions = [];
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
      setTimeout(() => setShowAddForm(false), 2000);
    } else {
      setFormError(res.error || 'Failed to add mock test.');
    }
  };

  return (
    <div className="study-workspace">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Full Mock Exams</h1>
          <p>Create and take full-length 100 question mock tests in a 60-minute simulated environment.</p>
        </div>
        <button className="btn-create-topic" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          {showAddForm ? 'View Mocks' : 'Add New Mock'}
        </button>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}

      {showAddForm ? (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
          {/* Add Form */}
          <div className="mock-glass-card" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '20px', color: '#f8fafc' }}>Add Mock JSON</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                className="mock-premium-input" 
                placeholder="Test Title (e.g. SSC CGL Tier-I)" 
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
            <h3 style={{ color: '#e2e8f0', display: 'flex', alignItems: 'center' }}>
              <BookOpen size={18} style={{ marginRight: '8px', color: '#a855f7' }}/> 
              Format Hint
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '12px 0' }}>
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
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '60px 20px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px',
              border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', marginTop: '20px'
            }}>
              <Inbox size={48} style={{ color: '#6366f1', marginBottom: '20px', opacity: 0.8 }} />
              <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', marginBottom: '10px' }}>No Mock Tests Found</h2>
              <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: '1.6', marginBottom: '25px' }}>
                You haven't added any full mock tests yet. Get started by creating your first TCS-style 100 question mock exam.
              </p>
              <button className="btn-premium-mock" onClick={() => setShowAddForm(true)}>
                <Plus size={18} style={{ marginRight: '8px' }} />
                Create Your First Mock
              </button>
            </div>
          ) : (
            <div className="syllabus-grid">
              {loading && mockTests.length === 0 && <p style={{ color: '#94a3b8' }}>Loading secure mock tests...</p>}
          
          {mockTests.map((test) => (
            <div key={test._id} className="mock-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.2rem' }}>{test.title}</h3>
                  <span className="mock-badge">100 Qs</span>
                </div>
                {test.year && <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0' }}>Year: {test.year}</p>}
                {test.date && <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0' }}>Date: {test.date}</p>}
                {test.shift && <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0' }}>Shift: {test.shift}</p>}
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
  );
}
