import React, { useState, useCallback, useEffect } from 'react';
import { useDrills } from '../hooks/useDrills';
import { useStudy } from '../hooks/useStudy';
import { 
  Zap, 
  Percent, 
  TrendingUp, 
  BookOpen, 
  Award, 
  Flame, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  BookMarked, 
  Activity, 
  RefreshCw,
  ClipboardList,
  GraduationCap,
  Plus,
  Search,
  Book,
  X,
  UserCheck,
  LogOut,
  Lock,
  User,
  Edit2,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/apiService';

// Fraction ↔ Percentage Reference Sheet
const FRACTION_CONVERSIONS = [
  { fraction: '1/1', percentage: '100%' },
  { fraction: '1/2', percentage: '50%' },
  { fraction: '1/3', percentage: '33.33%' },
  { fraction: '1/4', percentage: '25%' },
  { fraction: '1/5', percentage: '20%' },
  { fraction: '1/6', percentage: '16.67%' },
  { fraction: '1/7', percentage: '14.28%' },
  { fraction: '1/8', percentage: '12.5%' },
  { fraction: '1/9', percentage: '11.11%' },
  { fraction: '1/10', percentage: '10%' },
  { fraction: '1/11', percentage: '9.09%' },
  { fraction: '1/12', percentage: '8.33%' },
  { fraction: '1/13', percentage: '7.69%' },
  { fraction: '1/14', percentage: '7.14%' },
  { fraction: '1/15', percentage: '6.67%' },
  { fraction: '1/16', percentage: '6.25%' },
  { fraction: '1/17', percentage: '5.88%' },
  { fraction: '1/18', percentage: '5.56%' },
  { fraction: '1/19', percentage: '5.26%' },
  { fraction: '1/20', percentage: '5%' },
  { fraction: '1/25', percentage: '4%' },
  { fraction: '2/3', percentage: '66.67%' },
  { fraction: '3/4', percentage: '75%' },
  { fraction: '2/5', percentage: '40%' },
  { fraction: '3/5', percentage: '60%' },
  { fraction: '4/5', percentage: '80%' },
  { fraction: '3/8', percentage: '37.5%' },
  { fraction: '5/8', percentage: '62.5%' },
  { fraction: '7/8', percentage: '87.5%' },
  { fraction: '5/6', percentage: '83.33%' },
  { fraction: '4/7', percentage: '57.14%' },
  { fraction: '5/7', percentage: '71.43%' },
];

export function Dashboard() {
  // Drills Hook
  const {
    drillType,
    currentDrill,
    userAnswer,
    setUserAnswer,
    maxTableBase,
    setMaxTableBase,
    stats: drillStats,
    feedback: drillFeedback,
    loading: drillLoading,
    error: drillError,
    changeDrillType,
    submitAnswer: submitDrillAnswer,
    skipQuestion: skipDrillQuestion,
    loadNextDrill
  } = useDrills();

  // Study Workflow Hook
  const {
    activeView,
    setActiveView,
    subjects,
    selectedSubject,
    topicsList,
    selectedTopicId,
    activeNotes,
    testQuestions,
    currentQuestionIdx,
    selectedAnswers,
    questionStatuses,
    timer,
    testSummary,
    user,
    loading: studyLoading,
    error: studyError,
    skipToSubjects,
    selectSubject,
    selectTopic,
    startTest,
    jumpToQuestion,
    selectOptionValue,
    saveAndNext,
    markForReview,
    clearResponse,
    submitExam,
    addCustomTopic,
    loginUser,
    registerUser,
    logoutUser,
    updateCustomTopic,
    deleteCustomTopic,
    cancelTest
  } = useStudy();

  // Authentication Switcher Panel States
  const [authMode, setAuthMode] = useState('login'); // login, register
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Local component states
  const [modalOpen, setModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicSyllabus, setNewTopicSyllabus] = useState('');
  const [newTopicNotes, setNewTopicNotes] = useState('');
  const [topicAddSuccess, setTopicAddSuccess] = useState('');
  const [topicAddError, setTopicAddError] = useState('');

  // Edit component states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState('');
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicSyllabus, setEditTopicSyllabus] = useState('');
  const [editTopicNotes, setEditTopicNotes] = useState('');
  const [editTopicQuestionsJson, setEditTopicQuestionsJson] = useState('[]');

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState('');

  // Revision Deck states
  const [deckTab, setDeckTab] = useState('tables');
  const [tableSubTab, setTableSubTab] = useState('tables'); // tables | fractions | percentages
  const [expandedTable, setExpandedTable] = useState(null);
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabCategory, setVocabCategory] = useState('All');
  const [vocabList, setVocabList] = useState([]);
  const [vocabListLoading, setVocabListLoading] = useState(false);
  // Vocab Add / Edit Modal
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [editingVocabId, setEditingVocabId] = useState(null);
  const [vocabForm, setVocabForm] = useState({ word: '', pos: '', definition: '', synonyms: '', antonyms: '', category: 'Word Power' });
  const [vocabFormError, setVocabFormError] = useState('');
  const [vocabFormSuccess, setVocabFormSuccess] = useState('');

  // Load vocab from MongoDB
  const loadVocabList = useCallback(async () => {
    setVocabListLoading(true);
    try {
      const res = await apiService.get('/study/vocab');
      if (res.status === 'success') setVocabList(res.data || []);
    } catch (e) {
      console.error('Failed to load vocab', e);
    } finally {
      setVocabListLoading(false);
    }
  }, []);

  // Load on first mount (so drill vocab works too)
  useEffect(() => { loadVocabList(); }, []);

  // Derived: filter by category + search
  const filteredVocabDB = vocabList.filter(item => {
    const matchCat = vocabCategory === 'All' || item.category === vocabCategory;
    const q = vocabSearch.toLowerCase();
    const matchSearch = !q ||
      item.word?.toLowerCase().includes(q) ||
      item.definition?.toLowerCase().includes(q) ||
      (Array.isArray(item.synonyms) ? item.synonyms.join(' ') : (item.synonyms || '')).toLowerCase().includes(q) ||
      (Array.isArray(item.antonyms) ? item.antonyms.join(' ') : (item.antonyms || '')).toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Vocab form helpers
  const resetVocabForm = () => {
    setVocabForm({ word: '', pos: '', definition: '', synonyms: '', antonyms: '', category: 'Word Power' });
    setEditingVocabId(null);
    setVocabFormError('');
    setVocabFormSuccess('');
  };

  const openEditVocab = (item) => {
    setVocabForm({
      word: item.word || '',
      pos: item.pos || '',
      definition: item.definition || '',
      synonyms: Array.isArray(item.synonyms) ? item.synonyms.join(', ') : (item.synonyms || ''),
      antonyms: Array.isArray(item.antonyms) ? item.antonyms.join(', ') : (item.antonyms || ''),
      category: item.category || 'Word Power',
    });
    setEditingVocabId(item._id || null);
    setVocabModalOpen(true);
  };

  const handleVocabSubmit = async (e) => {
    e.preventDefault();
    setVocabFormError('');
    setVocabFormSuccess('');
    const body = {
      word: vocabForm.word.trim(),
      pos: vocabForm.pos.trim(),
      definition: vocabForm.definition.trim(),
      synonyms: vocabForm.synonyms.split(',').map(s => s.trim()).filter(Boolean),
      antonyms: vocabForm.antonyms.split(',').map(a => a.trim()).filter(Boolean),
      category: vocabForm.category,
      createdBy: user?.username || 'user',
    };
    try {
      let res;
      if (editingVocabId) {
        res = await apiService.put(`/study/vocab/${editingVocabId}`, body);
      } else {
        res = await apiService.post('/study/vocab', body);
      }
      if (res.status === 'success') {
        setVocabFormSuccess(editingVocabId ? 'Updated successfully!' : 'Added to vocabulary deck!');
        await loadVocabList();
        setTimeout(() => { setVocabModalOpen(false); resetVocabForm(); }, 800);
      }
    } catch (err) {
      setVocabFormError(err.message || 'Failed to save. Please try again.');
    }
  };

  const globalLoading = drillLoading || studyLoading;
  const globalError = drillError || studyError;
  const isOnline = !globalError;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `Time Remaining: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const copyErrorLog = () => {
    if (testSummary && testSummary.errorLog) {
      navigator.clipboard.writeText(testSummary.errorLog);
      alert("📋 Full 25-Q Error Log safely copy ho gaya hai bhai!");
    }
  };

  const handleOpenEditModal = async (e, topic) => {
    e.stopPropagation();
    setEditingTopicId(topic.id);
    setEditTopicName(topic.name);
    setEditTopicSyllabus(topic.syllabus);
    
    // Fetch notes to edit
    const result = await apiService.get(`/study/topics/${topic.id}/notes`);
    if (result.status === 'success' && result.data) {
      setEditTopicNotes(result.data.notes || '');
    } else {
      setEditTopicNotes('');
    }
    setEditTopicQuestionsJson(''); // Always start empty so user can copy template and paste new MCQs directly
    setEditModalOpen(true);
  };

  const handleEditTopicSubmit = async (e) => {
    e.preventDefault();
    setTopicAddSuccess('');
    setTopicAddError('');

    if (!editTopicName.trim() || !editTopicNotes.trim()) {
      setTopicAddError("Bhai heading aur notes likhna compulsory hai!");
      return;
    }

    let parsedQuestions = null;
    if (editTopicQuestionsJson.trim()) {
      try {
        parsedQuestions = JSON.parse(editTopicQuestionsJson.trim());
        if (!Array.isArray(parsedQuestions)) {
          setTopicAddError("Bhai, MCQ JSON object array ke format me hona chahiye (i.e. [ ... ])!");
          return;
        }
        // Basic validation of questions format
        for (let i = 0; i < parsedQuestions.length; i++) {
          const q = parsedQuestions[i];
          if (!q.q || !Array.isArray(q.o) || typeof q.a !== 'number' || !q.e) {
            setTopicAddError(`Bhai, index ${i} par MCQ object invalid hai! Structure check karein: { q, o: [...], a, e }`);
            return;
          }
        }
      } catch (err) {
        setTopicAddError("Bhai, MCQ JSON syntax invalid hai! Pehle parse check karein: " + err.message);
        return;
      }
    }

    const res = await updateCustomTopic(editingTopicId, {
      name: editTopicName.trim(),
      syllabus: editTopicSyllabus.trim(),
      notes: editTopicNotes,
      questions: parsedQuestions
    });

    if (res.success) {
      setTopicAddSuccess("🎉 Topic successfully update ho gaya MongoDB Atlas me!");
      setTimeout(() => {
        setEditModalOpen(false);
        setTopicAddSuccess('');
      }, 1500);
    } else {
      setTopicAddError(res.message || "Failed to update custom topic.");
    }
  };

  const handleDeleteClick = (e, topicId) => {
    e.stopPropagation();
    setDeletingTopicId(topicId);
    setDeleteConfirmOpen(true);
  };

  const handleCreateTopicSubmit = async (e) => {
    e.preventDefault();
    setTopicAddSuccess('');
    setTopicAddError('');

    if (!newTopicName.trim() || !newTopicNotes.trim()) {
      setTopicAddError("Bhai heading aur notes likhna compulsory hai!");
      return;
    }

    const payload = {
      name: newTopicName.trim(),
      syllabus: newTopicSyllabus.trim() || "Custom added user revision notes.",
      notes: newTopicNotes
    };

    const res = await addCustomTopic(payload);
    if (res.success) {
      setTopicAddSuccess("🎉 Topic successfully save ho gaya MongoDB Atlas me!");
      setNewTopicName('');
      setNewTopicSyllabus('');
      setNewTopicNotes('');
      setTimeout(() => {
        setModalOpen(false);
        setTopicAddSuccess('');
      }, 1500);
    } else {
      setTopicAddError(res.message || "Custom topic add karne me fail ho gaya database call.");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authUsername.trim() || !authPassword) {
      setAuthError("Bhai input fill karna mandatory hai.");
      return;
    }

    if (authMode === 'login') {
      const res = await loginUser(authUsername, authPassword);
      if (res.success) {
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(res.message || "Login fail ho gaya. Detail inspect karein.");
      }
    } else {
      const res = await registerUser(authUsername, authPassword);
      if (res.success) {
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(res.message || "Sign up fail ho gaya. Detail check karein.");
      }
    }
  };

  // --- RENDERING AUTHENTICATION PANELS IF NOT SIGNED IN ---
  if (!user) {
    return (
      <div className="auth-fullscreen-layout">
        <div className="auth-card">
          <div className="auth-brand">
            <GraduationCap className="brand-logo" size={36} />
            <h2>SSC CHSL & CGL Speed Engine</h2>
            <p>Master tables, vocab, reasoning, and mock tests</p>
          </div>

          <div className="auth-mode-selector">
            <button 
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              Log In
            </button>
            <button 
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authError && (
              <div className="alert-message error">
                <XCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div className="form-group">
              <label>Candidate Username</label>
              <div className="input-with-icon">
                <User size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-auth-submit">
              {authMode === 'login' ? 'Access Portal' : 'Register New Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDERING FULLSCREEN EXAM MODE ---
  if (activeView === 'test') {
    const activeQ = testQuestions[currentQuestionIdx];
    return (
      <div id="exam-portal" style={{ userSelect: 'none' }}>
        <div className="navbar">
          <div>CHSL DYNAMIC EXAM INTERFACE - {selectedSubject?.toUpperCase()}</div>
          <div id="timer-box">{formatTimer(timer)}</div>
        </div>

        <div className="main-layout">
          <div className="left-panel">
            <div className="section-bar">
              Section: {selectedSubject} (25 Question Set Master Run)
            </div>
            
            <div className="question-area">
              <div className="direction" id="q-direction">
                Direction: Choose the correct option that perfectly matches central standard answer keys.
              </div>

              {activeQ ? (
                <>
                  <div className="q-text" id="q-display-text">
                    <b>Q{currentQuestionIdx + 1}.</b> {activeQ.q}
                  </div>

                  <div className="options-box" id="options-display-box">
                    {activeQ.o.map((opt, idx) => {
                      const isActive = selectedAnswers[currentQuestionIdx] === idx;
                      return (
                        <label 
                          key={idx} 
                          className={`opt-label ${isActive ? 'active' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`opt-radio-${currentQuestionIdx}`}
                            checked={isActive}
                            onChange={() => selectOptionValue(idx)}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '20px', color: '#666' }}>
                  Loading test session questions...
                </div>
              )}
            </div>

            <div className="footer-buttons">
              <div>
                <button className="btn btn-review" onClick={markForReview}>
                  Mark for Review & Next
                </button>
                <button className="btn btn-clear" onClick={clearResponse}>
                  Clear Response
                </button>
              </div>
              <button className="btn btn-save" onClick={saveAndNext}>
                Save & Next
              </button>
            </div>
          </div>

          <div className="right-panel">
            <div>
              <div className="user-profile">
                <div className="avatar">{user.username.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{user.username}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>25 Questions | 15 Mins</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
                Question Palette :
              </div>
              
              <div className="palette-grid" id="palette-box">
                {Array(25).fill(null).map((_, i) => {
                  const status = questionStatuses[i] || 'not-visited';
                  return (
                    <button
                      key={i}
                      id={`p-btn-${i}`}
                      className={`palette-btn ${status}`}
                      onClick={() => jumpToQuestion(i)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="legend-box">
                <div className="legend-item">
                  <span className="dot" style={{ background: '#fff' }}></span> Not Visited
                </div>
                <div className="legend-item">
                  <span className="dot" style={{ background: '#d9534f' }}></span> Not Answered
                </div>
                <div className="legend-item">
                  <span className="dot" style={{ background: '#5cb85c' }}></span> Answered
                </div>
                <div className="legend-item">
                  <span className="dot" style={{ background: '#8a6d3b' }}></span> Marked for Review
                </div>
              </div>
              <button 
                className="btn" 
                style={{ 
                  width: '100%', 
                  marginTop: '15px', 
                  background: '#1a5276', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px', 
                  fontSize: '14px',
                  cursor: 'pointer'
                }} 
                onClick={submitExam}
              >
                Submit Section 🏁
              </button>
              <button 
                className="btn" 
                style={{ 
                  width: '100%', 
                  marginTop: '8px', 
                  background: 'transparent', 
                  color: '#e74c3c', 
                  border: '1px solid #e74c3c', 
                  padding: '10px', 
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }} 
                onClick={() => {
                  if (window.confirm('Test cancel karna chahte ho? Koi progress save nahi hoga.')) {
                    cancelTest();
                  }
                }}
              >
                ✕ Cancel Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING FULLSCREEN RESULTS ---
  if (activeView === 'results') {
    return (
      <div className="results-container" id="results-portal" style={{ display: 'block' }}>
        <div className="score-box">
          <h2>Performance Assessment Summary</h2>
          <p>Bhai, tera final official calculations sheet:</p>
          <div className="score-num" id="final-marks">{testSummary?.score} / 50</div>
          <p style={{ fontWeight: 'bold', color: '#555' }} id="time-taken-summary">
            {testSummary?.summaryText}
          </p>
        </div>

        <div style={{ background: '#fff8e7', padding: '15px', borderLeft: '4px solid #f59e0b', borderRadius: '4px', marginBottom: '20px' }}>
          <span style={{ fontWeight: 'bold', color: '#b36b00' }}>
            Complete 25-Question Error Log (Paste directly in chat):
          </span>
          <textarea 
            id="error-log-box" 
            value={testSummary?.errorLog || ''} 
            readOnly 
            style={{ width: '100%', height: '140px', margin: '15px 0', fontFamily: 'monospace', padding: '10px', boxSizing: 'border-box' }}
          />
          <button 
            className="btn btn-clear" 
            style={{ background: '#2c3e50', color: 'white', fontWeight: 'bold', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
            onClick={copyErrorLog}
          >
            Copy Full Error Log
          </button>
        </div>

        <h3>Exhaustive Post-Mortem & Explanation Breakdown</h3>
        <div id="full-review-box">
          {testQuestions.map((item, idx) => {
            const userAns = selectedAnswers[idx];
            const correctAns = item.a;
            const isCorrect = userAns === correctAns;
            const userText = userAns !== null ? item.o[userAns] : "Left Unattempted";
            const correctText = item.o[correctAns];

            return (
              <div 
                key={idx} 
                className={`review-card ${userAns === null ? '' : (isCorrect ? 'correct' : 'wrong')}`}
              >
                <h4>Q{idx + 1}. {item.q}</h4>
                {item.state && (
                  <p style={{ color: '#7f8c8d', fontSize: '12px', margin: '4px 0' }}>
                    Hidden State Link: {item.state}
                  </p>
                )}
                <p style={{ margin: '8px 0', color: userAns === null ? '#7f8c8d' : (isCorrect ? '#2ecc71' : '#e74c3c') }}>
                  <b>Your Choice:</b> {userText}
                </p>
                <p style={{ margin: '4px 0', color: '#2ecc71' }}>
                  <b>Official TCS Key:</b> {correctText}
                </p>
                <div style={{ fontSize: '13px', color: '#1f618d', background: '#ebf5fb', padding: '10px', borderRadius: '4px', marginTop: '10px', borderLeft: '3px solid #1a5276' }}>
                  <b>Official Core Logic:</b> {item.e}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
          <button className="btn btn-save" onClick={startTest}>
            Retake Mock Test
          </button>
          <button className="btn btn-clear" style={{ border: '1px solid #ccc' }} onClick={() => setActiveView('topics')}>
            Back to Topics
          </button>
          <button className="btn btn-clear" style={{ border: '1px solid #ccc' }} onClick={() => setActiveView('drill')}>
            Back to Drills
          </button>
        </div>
      </div>
    );
  }




  // Performance analytics calculation variables
  const progressCount = user.progress?.length || 0;
  const averageScore = progressCount > 0 
    ? Math.round(user.progress.reduce((sum, curr) => sum + curr.score, 0) / progressCount) 
    : 0;
  const masteredCount = user.progress?.filter(p => p.status === 'green').length || 0;
  const reviewingCount = user.progress?.filter(p => p.status === 'yellow').length || 0;
  const revisionNeededCount = user.progress?.filter(p => p.status === 'red').length || 0;

  // --- DEFAULT LMS WEB APP WORKSPACE (SIDEBAR LAYOUT) ---
  return (
    <div className="lms-container">
      {globalLoading && (
        <div className="absolute-loader-strip">
          <RefreshCw className="spin-icon" size={14} />
          <span>Synchronizing with MongoDB Atlas...</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR */}
      <aside className="lms-sidebar">
        <div className="sidebar-brand">
          <GraduationCap className="brand-icon" size={28} />
          <div className="brand-text">
            <h2>SSC Prep Portal</h2>
            <span>CGL & CHSL Speed Engine</span>
          </div>
        </div>

        {/* User Card inside Sidebar */}
        <div className="user-profile-card">
          <div className="avatar-icon">
            <UserCheck size={20} />
          </div>
          <div className="user-details">
            <span className="username-label">{user.username}</span>
            <button className="btn-logout" onClick={logoutUser}>
              <LogOut size={12} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Database connection status indicators */}
        <div className="connection-card">
          <div className={`status-dot ${isOnline ? 'connected' : 'disconnected'}`}></div>
          <div className="connection-info">
            <span className="status-label">Database</span>
            <span className="status-text">{isOnline ? 'Atlas Connected' : 'Offline Mode'}</span>
          </div>
        </div>

        {/* Navigation Items list */}
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeView === 'drill' ? 'active' : ''}`}
            onClick={() => setActiveView('drill')}
          >
            <Zap className="nav-icon" size={18} />
            <span>Speed Drills</span>
          </button>
          
          <button 
            className={`nav-item ${['subjects', 'topics', 'notes'].includes(activeView) ? 'active' : ''}`}
            onClick={() => skipToSubjects()}
          >
            <BookMarked className="nav-icon" size={18} />
            <span>Syllabus & Notes</span>
          </button>

          <button 
            className={`nav-item ${activeView === 'revision' ? 'active' : ''}`}
            onClick={() => setActiveView('revision')}
          >
            <Book className="nav-icon" size={18} />
            <span>Revision Deck</span>
          </button>

          <button 
            className={`nav-item ${activeView === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveView('performance')}
          >
            <Trophy className="nav-icon" size={18} />
            <span>Performance Tracker</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <span className="version-label">v1.4.0 Tracking Enabled</span>
        </div>
      </aside>

      {/* 2. RIGHT WORKSPACE */}
      <main className="lms-workspace">
        {globalError && (
          <div className="alert-banner error">
            <Activity size={16} />
            <span>Database connection lost. Error logs: {globalError}</span>
          </div>
        )}

        <div className="workspace-card-enclosure">

          {/* --- VIEW: SPEED DRILLS CONTROLS AND CARDS --- */}
          {activeView === 'drill' && (
            <div className="drill-workspace">
              <div className="section-header">
                <h1>Practice Speed Drills</h1>
                <p>Solve high-speed calculations and English vocab vocabulary drills.</p>
              </div>

              {/* Quick HUD Score counter tracker */}
              <div className="stats-row">
                <div className="stat-box">
                  <span className="stat-label">Total Attempts</span>
                  <span className="stat-val">{drillStats.totalAsked}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Correct Answers</span>
                  <span className="stat-val">{drillStats.score}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Incorrect / Skips</span>
                  <span className="stat-val">{drillStats.totalAsked - drillStats.score}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Active Streak</span>
                  <span className="stat-val streak-val">
                    <Flame className="streak-icon" size={20} />
                    {drillStats.streak}
                  </span>
                </div>
              </div>

              {/* Filter Drill Type tabs */}
              <div className="tabs-header">
                <div className="drill-tabs">
                  <button
                    className={`drill-tab ${drillType === 'table' ? 'active' : ''}`}
                    onClick={() => changeDrillType('table')}
                  >
                    <Zap size={14} />
                    <span>Jumping Tables</span>
                  </button>
                  <button
                    className={`drill-tab ${drillType === 'fraction' ? 'active' : ''}`}
                    onClick={() => changeDrillType('fraction')}
                  >
                    <Percent size={14} />
                    <span>Fraction to %</span>
                  </button>
                  <button
                    className={`drill-tab ${drillType === 'percentage' ? 'active' : ''}`}
                    onClick={() => changeDrillType('percentage')}
                  >
                    <TrendingUp size={14} />
                    <span>% to Fraction</span>
                  </button>
                  <button
                    className={`drill-tab ${drillType === 'vocab' ? 'active' : ''}`}
                    onClick={() => changeDrillType('vocab')}
                  >
                    <BookOpen size={14} />
                    <span>Vocabulary Builder</span>
                  </button>
                </div>
              </div>

              {/* Config limit panel (Expanded range limits to 50) */}
              {drillType === 'table' && (
                <div className="drill-config-card">
                  <div className="config-label">
                    <TrendingUp size={16} className="config-icon" />
                    <span>Max Multiplication Base (Bases: 12 to 50, Multipliers: 2-9):</span>
                  </div>
                  <input
                    type="number"
                    min="12"
                    max="50"
                    className="config-input"
                    value={maxTableBase}
                    onChange={(e) => {
                      const val = Math.min(50, Math.max(12, parseInt(e.target.value, 10) || 12));
                      setMaxTableBase(val);
                      loadNextDrill('table', val);
                    }}
                  />
                </div>
              )}

              {/* Drill Card Display */}
              {currentDrill ? (
                <div className="drill-card-viewport">
                  <div className={`drill-interactive-card ${
                    drillFeedback.isChecked 
                      ? drillFeedback.isCorrect 
                        ? 'correct' 
                        : 'incorrect' 
                      : ''
                  }`}>
                    <div className="card-heading">
                      <h3>
                        {drillType === 'table' && '⚡ Jumping Tables Drill'}
                        {drillType === 'vocab' && '✍️ Synonym Match'}
                        {['fraction', 'percentage'].includes(drillType) && '📊 Value Conversion'}
                      </h3>
                      <p>Enter correct answer or select options.</p>
                    </div>

                    <div className="question-text-box">
                      <h2>{currentDrill.question}</h2>
                      {drillType === 'vocab' && currentDrill.definition && (
                        <div className="pos-definition">
                          <span className="pos-badge">{currentDrill.pos}</span>
                          <p>"{currentDrill.definition}"</p>
                        </div>
                      )}
                    </div>

                    {drillFeedback.isChecked ? (
                      <div className="feedback-result">
                        {drillFeedback.isCorrect ? (
                          <div className="alert-message success">
                            <CheckCircle size={18} />
                            <span>Correct answer registered! Streak increased.</span>
                          </div>
                        ) : (
                          <div className="alert-message error">
                            <XCircle size={18} />
                            <span>Incorrect choice. Correct Key: <strong>{currentDrill.correctAnswer}</strong></span>
                          </div>
                        )}
                        <span className="loader-next-text">Sourcing next question...</span>
                      </div>
                    ) : (
                      <form onSubmit={submitDrillAnswer} className="submit-form">
                        {drillType === 'vocab' && currentDrill.options ? (
                          <div className="options-selector-grid">
                            {currentDrill.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className="option-choice-btn"
                                onClick={() => submitDrillAnswer(null, opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="input-row">
                            <input
                              type="text"
                              placeholder={currentDrill.placeholder}
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              className="text-answer-input"
                              autoFocus
                            />
                          </div>
                        )}

                        <div className="action-row">
                          <button
                            type="button"
                            className="btn-skip"
                            onClick={skipDrillQuestion}
                          >
                            Skip Drill
                          </button>
                          {drillType !== 'vocab' && (
                            <button
                              type="submit"
                              disabled={!userAnswer.trim()}
                              className="btn-submit"
                            >
                              Verify Answer
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="loading-state">
                  <RefreshCw className="spin-icon" size={32} />
                  <p>Generating drill question...</p>
                </div>
              )}
            </div>
          )}

          {/* --- VIEW: PERFORMANCE TRACKER MODULE --- */}
          {activeView === 'performance' && (
            <div className="study-workspace">
              <div className="section-header">
                <h1>Performance Analytics Dashboard</h1>
                <p>Track your target concepts, average mock scores, and revision statistics.</p>
              </div>

              {/* Statistics Overview Cards */}
              <div className="stats-row">
                <div className="stat-box">
                  <span className="stat-label">Tests Completed</span>
                  <span className="stat-val">{progressCount}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Average Score</span>
                  <span className="stat-val" style={{ color: '#3b82f6' }}>{averageScore} / 50</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Mastered (Green)</span>
                  <span className="stat-val" style={{ color: '#10b981' }}>{masteredCount}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Reviewing (Yellow)</span>
                  <span className="stat-val" style={{ color: '#f59e0b' }}>{reviewingCount}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Needs Help (Red)</span>
                  <span className="stat-val" style={{ color: '#ef4444' }}>{revisionNeededCount}</span>
                </div>
              </div>

              {/* Progress Table log */}
              <div className="performance-history-card">
                <h3>Syllabus Test Log History</h3>
                <div className="table-responsive">
                  {user.progress && user.progress.length > 0 ? (
                    <table className="performance-table">
                      <thead>
                        <tr>
                          <th>Topic Code</th>
                          <th>Recorded Score</th>
                          <th>Accuracy Grade Status</th>
                          <th>Completion Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.progress.map((record, i) => (
                          <tr key={i}>
                            <td><code>{record.topicId}</code></td>
                            <td><strong>{record.score} / 50</strong></td>
                            <td>
                              <span className={`status-badge-pill ${record.status}`}>
                                {record.status === 'green' && 'Mastered'}
                                {record.status === 'yellow' && 'Reviewing'}
                                {record.status === 'red' && 'Action Needed'}
                              </span>
                            </td>
                            <td>{new Date(record.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-syllabus">
                      <p>You have not taken any mock tests yet. Access "Syllabus & Notes" to test yourself.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: REVISION DECK --- */}
          {activeView === 'revision' && (
            <div className="study-workspace">
              <div className="section-header">
                <h1>Revision & Learning Deck</h1>
                <p>Quick-reference sheets for tables, fractions, and vocabulary mastery.</p>
              </div>

              {/* TOP TABS: Tables | Vocab */}
              <div className="tabs-header">
                <div className="drill-tabs">
                  <button
                    className={`drill-tab ${deckTab === 'tables' ? 'active' : ''}`}
                    onClick={() => setDeckTab('tables')}
                  >
                    <Zap size={14} />
                    <span>Tables & Fractions</span>
                  </button>
                  <button
                    className={`drill-tab ${deckTab === 'vocab' ? 'active' : ''}`}
                    onClick={() => { setDeckTab('vocab'); loadVocabList(); }}
                  >
                    <Book size={14} />
                    <span>Vocabulary</span>
                  </button>
                </div>
              </div>

              {/* ── TABLES & FRACTIONS TAB ── */}
              {deckTab === 'tables' && (
                <div>
                  {/* Sub-tabs */}
                  <div className="revision-sub-tabs">
                    {['tables','fractions','percentages'].map(st => (
                      <button
                        key={st}
                        className={`revision-sub-tab ${tableSubTab === st ? 'active' : ''}`}
                        onClick={() => setTableSubTab(st)}
                      >
                        { st === 'tables' ? '× Multiplication Tables (1–50)'
                          : st === 'fractions' ? '½ Fraction → %'
                          : '% Percentage → Fraction' }
                      </button>
                    ))}
                  </div>

                  {/* Multiplication Tables — inline one-line-per-row */}
                  {tableSubTab === 'tables' && (
                    <div className="tables-deck-grid">
                      {Array(50).fill(null).map((_, idx) => {
                        const num = idx + 1;
                        const isExpanded = expandedTable === num;
                        return (
                          <div key={num} className={`table-card ${isExpanded ? 'active-green-table expanded' : ''}`}>
                            <div className="table-card-header" onClick={() => setExpandedTable(isExpanded ? null : num)}>
                              <h3>Table of {num}</h3>
                              <ChevronRight className={`arrow-icon ${isExpanded ? 'rotate-90' : ''}`} size={16} />
                            </div>
                            {isExpanded && (
                              <div className="table-card-body">
                                <div className="multipliers-grid">
                                  {Array(20).fill(null).map((_, mIdx) => {
                                    const m = mIdx + 1;
                                    return (
                                      <div key={m} className="multiplier-row">
                                        <span>{num} × {m}</span>
                                        <span>=</span>
                                        <strong>{num * m}</strong>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fraction → Percentage */}
                  {tableSubTab === 'fractions' && (
                    <div className="fraction-list">
                      {FRACTION_CONVERSIONS.map(fc => (
                        <div key={fc.fraction} className="fraction-row">
                          <span className="frac-lhs">{fc.fraction}</span>
                          <span className="frac-arrow">→</span>
                          <span className="frac-rhs">{fc.percentage}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Percentage → Fraction */}
                  {tableSubTab === 'percentages' && (
                    <div className="fraction-list">
                      {FRACTION_CONVERSIONS.map(fc => (
                        <div key={fc.percentage} className="fraction-row">
                          <span className="frac-lhs">{fc.percentage}</span>
                          <span className="frac-arrow">→</span>
                          <span className="frac-rhs">{fc.fraction}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── VOCABULARY TAB ── */}
              {deckTab === 'vocab' && (
                <div className="vocab-deck-container">

                  {/* Search + Add bar */}
                  <div className="vocab-add-bar">
                    <div className="vocab-search-bar" style={{ flex: 1 }}>
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search word, synonym, antonym, idiom..."
                        value={vocabSearch}
                        onChange={(e) => setVocabSearch(e.target.value)}
                      />
                    </div>
                    <button className="btn-add-vocab" onClick={() => setVocabModalOpen(true)}>
                      <Plus size={15} /> Add New
                    </button>
                  </div>

                  {/* Category tabs */}
                  <div className="revision-sub-tabs">
                    {['All','Word Power','Idioms & Phrases','One Word Substitution','Spelling Rules'].map(cat => (
                      <button
                        key={cat}
                        className={`revision-sub-tab ${vocabCategory === cat ? 'active' : ''}`}
                        onClick={() => setVocabCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Vocab Cards Grid */}
                  <div className="vocab-results-grid">
                    {vocabListLoading ? (
                      <div className="empty-syllabus" style={{ gridColumn: '1 / -1' }}>Loading vocabulary...</div>
                    ) : filteredVocabDB.length > 0 ? (
                      filteredVocabDB.map((item) => (
                        <div key={item._id || item.word} className="vocab-term-card">
                          <div className="vocab-term-header">
                            <h3>{item.word}</h3>
                            <span className="pos-badge">{item.category || item.pos}</span>
                          </div>
                          <p className="vocab-def">"{item.definition}"</p>

                          {/* Synonyms */}
                          {item.synonyms?.length > 0 && (
                            <div className="vocab-chip-row">
                              <span className="vocab-chip-label">Syn:</span>
                              {(Array.isArray(item.synonyms) ? item.synonyms : item.synonyms.split(',')).map((s, i) => (
                                <span key={i} className="vocab-chip syn">{s.trim()}</span>
                              ))}
                            </div>
                          )}

                          {/* Antonyms */}
                          {item.antonyms?.length > 0 && (
                            <div className="vocab-chip-row">
                              <span className="vocab-chip-label">Ant:</span>
                              {(Array.isArray(item.antonyms) ? item.antonyms : item.antonyms.split(',')).map((a, i) => (
                                <span key={i} className="vocab-chip ant">{a.trim()}</span>
                              ))}
                            </div>
                          )}

                          <div className="vocab-card-actions">
                            <button className="vocab-action-btn" onClick={() => openEditVocab(item)}>Edit</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-syllabus" style={{ gridColumn: '1 / -1' }}>
                        No vocabulary items found. Add some using the "Add New" button!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ADD / EDIT VOCAB MODAL ── */}
          {vocabModalOpen && (
            <div className="modal-overlay" onClick={() => setVocabModalOpen(false)}>
              <div className="modal-content-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingVocabId ? 'Edit Vocabulary' : 'Add Vocabulary Entry'}</h3>
                  <button className="btn-close-modal" onClick={() => { setVocabModalOpen(false); resetVocabForm(); }}>
                    <X size={20} />
                  </button>
                </div>
                <form className="modal-form" onSubmit={handleVocabSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Word / Phrase *</label>
                      <input value={vocabForm.word} onChange={e => setVocabForm(p => ({...p, word: e.target.value}))} required placeholder="e.g. Ephemeral" />
                    </div>
                    <div className="form-group">
                      <label>Part of Speech</label>
                      <input value={vocabForm.pos} onChange={e => setVocabForm(p => ({...p, pos: e.target.value}))} placeholder="Adjective / Noun / Idiom..." />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={vocabForm.category} onChange={e => setVocabForm(p => ({...p, category: e.target.value}))}
                      style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.92rem' }}
                    >
                      <option value="Word Power">Word Power</option>
                      <option value="Idioms & Phrases">Idioms & Phrases</option>
                      <option value="One Word Substitution">One Word Substitution</option>
                      <option value="Spelling Rules">Spelling Rules</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Definition *</label>
                    <textarea rows="2" value={vocabForm.definition} onChange={e => setVocabForm(p => ({...p, definition: e.target.value}))} required placeholder="Meaning of the word..." />
                  </div>
                  <div className="form-group">
                    <label>Synonyms <span style={{color:'#94a3b8', fontWeight:400}}>(comma separated)</span></label>
                    <input value={vocabForm.synonyms} onChange={e => setVocabForm(p => ({...p, synonyms: e.target.value}))} placeholder="e.g. Transient, Fleeting, Brief" />
                  </div>
                  <div className="form-group">
                    <label>Antonyms <span style={{color:'#94a3b8', fontWeight:400}}>(comma separated)</span></label>
                    <input value={vocabForm.antonyms} onChange={e => setVocabForm(p => ({...p, antonyms: e.target.value}))} placeholder="e.g. Eternal, Enduring, Permanent" />
                  </div>
                  {vocabFormError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{vocabFormError}</p>}
                  {vocabFormSuccess && <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>{vocabFormSuccess}</p>}
                  <div className="modal-footer-actions">
                    <button type="button" className="btn-cancel" onClick={() => { setVocabModalOpen(false); resetVocabForm(); }}>Cancel</button>
                    <button type="submit" className="btn-save-topic">{editingVocabId ? 'Update Entry' : 'Add to Deck'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- VIEW: SUBJECT LISTS --- */}
          {activeView === 'subjects' && (
            <div className="study-workspace">
              <div className="section-header">
                <h1>Select Subject Area</h1>
                <p>Access notes, revision structures, and complete Previous Year Questions mock tests.</p>
              </div>

              <div className="subjects-grid">
                {subjects.map((sub) => (
                  <div 
                    key={sub}
                    className="subject-selection-card"
                    onClick={() => selectSubject(sub)}
                  >
                    <div className="subject-icon-box">
                      <BookMarked size={24} />
                    </div>
                    <div className="subject-content">
                      <h3>{sub}</h3>
                      <p>Read detailed syllabus points and practice mock tests.</p>
                    </div>
                    <ChevronRight className="arrow-icon" size={18} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- VIEW: TOPICS/SYLLABUS OUTLINES WITH ACCURACY INDICATORS --- */}
          {activeView === 'topics' && (
            <div className="study-workspace">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h1>{selectedSubject} Syllabus</h1>
                  <p>Browse core revision concepts mapped for CGL/CHSL candidates.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-create-topic" onClick={() => setModalOpen(true)}>
                    <Plus size={16} />
                    <span>Add Custom Topic</span>
                  </button>
                  <button className="btn-back" onClick={() => setActiveView('subjects')}>
                    Back to Subjects
                  </button>
                </div>
              </div>

              <div className="topics-list-container">
                {topicsList.length > 0 ? (
                  topicsList.map((topic) => {
                    // Look up topic accuracy indicators in user's profile
                    const progressRecord = user.progress?.find(p => p.topicId === topic.id);
                    const status = progressRecord?.status || 'gray';
                    const score = progressRecord?.score;

                    return (
                      <div 
                        key={topic.id}
                        className="topic-outline-card"
                        onClick={() => selectTopic(topic.id)}
                      >
                        <div className="topic-header-title" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Color indicator dot */}
                            <span className={`progress-status-dot ${status}`} title={
                              status === 'green' ? `Mastered (Score: ${score}/50)` :
                              status === 'yellow' ? `Reviewing (Score: ${score}/50)` :
                              status === 'red' ? `Action Needed (Score: ${score}/50)` :
                              'Unattempted'
                            }></span>
                            <h3>{topic.name}</h3>
                          </div>
                          <div className="topic-actions-bar" style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '12px' }}>
                            <button 
                              type="button" 
                              className="btn-topic-action edit"
                              onClick={(e) => handleOpenEditModal(e, topic)}
                              title="Edit Notes"
                              style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              type="button" 
                              className="btn-topic-action delete"
                              onClick={(e) => handleDeleteClick(e, topic.id)}
                              title="Delete Topic"
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <ChevronRight className="arrow-icon" size={16} />
                        </div>
                        <p className="topic-desc">{topic.syllabus}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="read-more-tag">Read Study notes & formulas</span>
                          {score !== undefined && (
                            <span className="topic-score-badge">Latest: {score}/50</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-syllabus">
                    <p>No active topics are seeded under this subject yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- VIEW: TOPIC REVISION NOTES & TEST STARTER --- */}
          {activeView === 'notes' && activeNotes && (
            <div className="study-workspace">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1>{activeNotes.name} Revision Sheet</h1>
                  <p>Read formulas, shortcut tricks, and concepts below.</p>
                </div>
                <button className="btn-back" onClick={() => setActiveView('topics')}>
                  Back to Topics
                </button>
              </div>

              <div className="revision-notes-container">
                <div className="notes-sheet">
                  <pre className="notes-display-pre">
                    {activeNotes.notes}
                  </pre>
                </div>

                <div className="take-test-strip">
                  <div className="strip-info">
                    <ClipboardList size={22} className="strip-icon" />
                    <div>
                      <h4>Ready to test your speed?</h4>
                      <p>Launches a real TCS iON simulated test consisting of 25 PYQs.</p>
                    </div>
                  </div>
                  <button className="btn-take-test" onClick={startTest}>
                    Take 25-Question Test
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- ADD CUSTOM TOPIC DIALOG MODAL --- */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header">
              <h3>Create Custom Revision Topic</h3>
              <button className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTopicSubmit} className="modal-form">
              {topicAddSuccess && (
                <div className="alert-message success">
                  <CheckCircle size={16} />
                  <span>{topicAddSuccess}</span>
                </div>
              )}
              {topicAddError && (
                <div className="alert-message error">
                  <XCircle size={16} />
                  <span>{topicAddError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Topic Heading / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Percentage Calculation Shortcuts"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Syllabus Summary (Short description)</label>
                <input
                  type="text"
                  placeholder="e.g. Tricks to calculate tables of 14, 18, and decimals mentally"
                  value={newTopicSyllabus}
                  onChange={(e) => setNewTopicSyllabus(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Study Notes & Formulas * (Exact Spacing and Copy-Paste Layout is preserved)</label>
                <textarea
                  rows="10"
                  placeholder="Paste your markdown, list, or text document notes here..."
                  value={newTopicNotes}
                  onChange={(e) => setNewTopicNotes(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save-topic">
                  Save to Atlas DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CUSTOM TOPIC DIALOG MODAL --- */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header">
              <h3>Edit Custom Revision Topic</h3>
              <button className="btn-close-modal" onClick={() => setEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditTopicSubmit} className="modal-form">
              {topicAddSuccess && (
                <div className="alert-message success">
                  <CheckCircle size={16} />
                  <span>{topicAddSuccess}</span>
                </div>
              )}
              {topicAddError && (
                <div className="alert-message error">
                  <XCircle size={16} />
                  <span>{topicAddError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Topic Heading / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Percentage Calculation Shortcuts"
                  value={editTopicName}
                  onChange={(e) => setEditTopicName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Syllabus Summary (Short description)</label>
                <input
                  type="text"
                  placeholder="e.g. Tricks to calculate tables of 14, 18, and decimals mentally"
                  value={editTopicSyllabus}
                  onChange={(e) => setEditTopicSyllabus(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Study Notes & Formulas * (Exact Spacing and Copy-Paste Layout is preserved)</label>
                <textarea
                  rows="10"
                  placeholder="Paste your markdown, list, or text document notes here..."
                  value={editTopicNotes}
                  onChange={(e) => setEditTopicNotes(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Add New MCQs (JSON Array Format) [Optional - Appends to existing questions]</label>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Format: Paste new questions to ADD them to this topic. Leave empty if you don't want to add new MCQs.
                </span>
                <textarea
                  rows="8"
                  placeholder='e.g. [{"q": "Question Text", "o": ["Opt0", "Opt1", "Opt2", "Opt3"], "a": 0, "e": "Explanation Text"}]'
                  value={editTopicQuestionsJson}
                  onChange={(e) => setEditTopicQuestionsJson(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
                
                <div style={{ marginTop: '8px', background: '#0f172a', border: '1px dashed #334155', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>JSON Format Template Hint:</span>
                    <button
                      type="button"
                      style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => {
                        const templateText = JSON.stringify([
                          {
                            "q": "Percentage calculation: What is 20% of 150?",
                            "o": ["15", "25", "30", "35"],
                            "a": 2,
                            "e": "20% of 150 = 0.20 * 150 = 30."
                          }
                        ], null, 2);
                        navigator.clipboard.writeText(templateText);
                        alert("📋 Template JSON copied to clipboard!");
                      }}
                    >
                      Copy Template JSON
                    </button>
                  </div>
                  <pre style={{ margin: 0, fontSize: '11px', color: '#94a3b8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`[
  {
    "q": "Percentage calculation: What is 20% of 150?",
    "o": ["15", "25", "30", "35"],
    "a": 2,
    "e": "20% of 150 = 0.20 * 150 = 30."
  }
]`}
                  </pre>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save-topic">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Confirm Delete Topic</h3>
              <button className="btn-close-modal" onClick={() => setDeleteConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '20px 0', color: '#fff', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete this topic and all its associated revision notes from the Atlas Database?
              This action cannot be undone.
            </div>

            <div className="modal-footer-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-save-topic" 
                style={{ backgroundColor: '#ef4444' }}
                onClick={async () => {
                  const res = await deleteCustomTopic(deletingTopicId);
                  setDeleteConfirmOpen(false);
                  if (!res.success) {
                    alert(res.message || "Failed to delete topic.");
                  }
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
