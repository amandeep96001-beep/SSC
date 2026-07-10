import { useState, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useDrills } from '@/features/drills/hooks/useDrills';
import { useStudy } from '@/features/study/hooks/useStudy';
import { RefreshCw, XCircle, X, Menu } from 'lucide-react';
import { apiService } from '@/shared/services/apiService';
import './Dashboard.css';

import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { ExamPortal } from '@/features/exam/components/ExamPortal';
import { ResultsPortal } from '@/features/exam/components/ResultsPortal';
import { Sidebar } from './Sidebar';
import { DrillWorkspace } from '@/features/drills/components/DrillWorkspace';
import { SyllabusWorkspace } from '@/features/study/components/SyllabusWorkspace';
import { RevisionWorkspace } from '@/features/study/components/RevisionWorkspace';
import { PerformanceWorkspace } from '@/features/analytics/components/PerformanceWorkspace';
import { AnalyticsWorkspace } from '@/features/analytics/components/AnalyticsWorkspace';
import { MockWorkspace } from '@/features/mock-tests/components/MockWorkspace';
import { FullMockPortal } from '@/features/mock-tests/components/FullMockPortal';
import { useMockTests } from '@/features/mock-tests/hooks/useMockTests';
import { CompetitionWorkspace } from '@/features/competition/components/CompetitionWorkspace';

export function Dashboard() {
  const {
    activeView,
    setActiveView,
    subjects,
    selectedSubject,
    topicsList,
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
    submitMockExam,
    addCustomTopic,
    loginUser,
    registerUser,
    logoutUser,
    updateCustomTopic,
    deleteCustomTopic,
    cancelTest
  } = useStudy();

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
    wrongQuestions,
    clearWrongLog,
    changeDrillType,
    submitAnswer: submitDrillAnswer,
    skipQuestion: skipDrillQuestion,
    loadNextDrill
  } = useDrills(!!user);

  const mockTestsHooks = useMockTests();
  const [activeMockTestId, setActiveMockTestId] = useState(null);

  const workspaceRef = useRef(null);

  useGSAP(() => {
    if (workspaceRef.current && activeView !== 'test' && activeView !== 'results' && activeView !== 'mock_exam_active') {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      if (isMobile) {
        gsap.fromTo(workspaceRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power1.out', clearProps: 'opacity' }
        );
      } else {
        gsap.fromTo(workspaceRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' }
        );

        const cards = workspaceRef.current.querySelectorAll('.stat-card-premium, .stat-box, .mock-glass-card, .subject-selection-card, .topic-outline-card, .drill-interactive-card, .drill-config-card, .vocab-search-flex, .topic-notes-html, .chart-container');
        const header = workspaceRef.current.querySelector('.workspace-header-sticky');
        if (header) {
          gsap.fromTo(header,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'all' }
          );
        }
        if (cards.length > 0) {
          gsap.fromTo(cards,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'power2.out', clearProps: 'all' }
          );
        }
      }
    }
  }, { dependencies: [activeView], scope: workspaceRef });

  // Start mock test
  const startMockExam = (testId) => {
    setActiveMockTestId(testId);
    setActiveView('mock_exam_active');
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicSyllabus, setNewTopicSyllabus] = useState('');
  const [newTopicNotes, setNewTopicNotes] = useState('');
  const [topicAddSuccess, setTopicAddSuccess] = useState('');
  const [topicAddError, setTopicAddError] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState('');
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicSyllabus, setEditTopicSyllabus] = useState('');
  const [editTopicNotes, setEditTopicNotes] = useState('');
  const [editTopicQuestionsJson, setEditTopicQuestionsJson] = useState('[]');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState('');

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);

  const checkApiHealth = useCallback(async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      setApiOnline(res.ok && data.db === 'connected');
    } catch {
      setApiOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 60000);
    return () => clearInterval(interval);
  }, [user, checkApiHealth]);

  const [deckTab, setDeckTab] = useState('tables');
  const [tableSubTab, setTableSubTab] = useState('tables');
  const [expandedTable, setExpandedTable] = useState(null);
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabCategory, setVocabCategory] = useState('All');
  const [vocabList, setVocabList] = useState([]);
  const [vocabListLoading, setVocabListLoading] = useState(false);
  
  // Pagination State
  const [vocabPage, setVocabPage] = useState(1);
  const [vocabTotalPages, setVocabTotalPages] = useState(1);
  
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [editingVocabId, setEditingVocabId] = useState(null);
  const [vocabForm, setVocabForm] = useState({ word: '', pos: '', definition: '', synonyms: '', antonyms: '', category: 'Word Power' });
  const [vocabFormError, setVocabFormError] = useState('');
  const [vocabFormSuccess, setVocabFormSuccess] = useState('');

  const [vocabBulkModalOpen, setVocabBulkModalOpen] = useState(false);
  const [vocabBulkJson, setVocabBulkJson] = useState('');
  const [vocabBulkError, setVocabBulkError] = useState('');
  const [vocabBulkSuccess, setVocabBulkSuccess] = useState('');

  const loadVocabList = useCallback(async (page = 1, searchStr = '', categoryStr = 'All') => {
    setVocabListLoading(true);
    try {
      const query = new URLSearchParams({ page, limit: 30 });
      if (searchStr) query.append('search', searchStr);
      if (categoryStr && categoryStr !== 'All') query.append('category', categoryStr);

      const res = await apiService.get(`/study/vocab?${query.toString()}`);
      if (res.status === 'success') {
        setVocabList(res.data || []);
        if (res.meta) {
          setVocabPage(res.meta.page);
          setVocabTotalPages(res.meta.totalPages || 1);
        }
      }
    } catch (e) {
      console.error('Failed to load vocab', e);
    } finally {
      setVocabListLoading(false);
    }
  }, []);

  // Effect to load vocab only when revision deck is open
  useEffect(() => {
    if (activeView !== 'revision') return;
    setVocabPage(1);
    loadVocabList(1, vocabSearch, vocabCategory);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, vocabCategory]);

  // Debounced search — only while on revision deck
  useEffect(() => {
    if (activeView !== 'revision') return;
    const delayDebounceFn = setTimeout(() => {
      setVocabPage(1);
      loadVocabList(1, vocabSearch, vocabCategory);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabSearch, activeView]);

  const handleVocabPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= vocabTotalPages) {
      loadVocabList(newPage, vocabSearch, vocabCategory);
    }
  };

  // Backend handles filtering now, so filteredVocabDB is just vocabList
  const filteredVocabDB = vocabList;

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

  const handleVocabBulkSubmit = async (e) => {
    e.preventDefault();
    setVocabBulkError('');
    setVocabBulkSuccess('');
    let parsedArray;
    try {
      parsedArray = JSON.parse(vocabBulkJson);
      if (!Array.isArray(parsedArray)) throw new Error('Root must be an array.');
    } catch (err) {
      setVocabBulkError('Invalid JSON format: ' + err.message);
      return;
    }

    try {
      const res = await apiService.addVocabBulkApi(parsedArray);
      if (res.status === 'success' || res.status === 'partial_success') {
        setVocabBulkSuccess(res.message);
        await loadVocabList();
        setTimeout(() => {
          setVocabBulkModalOpen(false);
          setVocabBulkJson('');
          setVocabBulkSuccess('');
        }, 1500);
      }
    } catch (err) {
      setVocabBulkError(err.message || 'Failed to bulk import vocabulary.');
    }
  };

  const globalLoading = drillLoading || studyLoading;
  const globalError = studyError;
  const isOnline = apiOnline;

  const handleOpenEditModal = async (e, topic) => {
    e.stopPropagation();
    setEditingTopicId(topic.id);
    setEditTopicName(topic.name);
    setEditTopicSyllabus(topic.syllabus);
    
    const result = await apiService.get(`/study/topics/${topic.id}/notes`);
    if (result.status === 'success' && result.data) {
      setEditTopicNotes(result.data.notes || '');
    } else {
      setEditTopicNotes('');
    }
    setEditTopicQuestionsJson('');
    setEditModalOpen(true);
  };

  const handleEditTopicSubmit = async (e) => {
    e.preventDefault();
    setTopicAddSuccess('');
    setTopicAddError('');

    if (!editTopicName.trim() || !editTopicNotes.trim()) {
      setTopicAddError("Heading and notes are mandatory!");
      return;
    }

    let parsedQuestions = null;
    if (editTopicQuestionsJson.trim()) {
      try {
        parsedQuestions = JSON.parse(editTopicQuestionsJson.trim());
        if (!Array.isArray(parsedQuestions)) {
          setTopicAddError("MCQ must be a JSON array format (i.e. [ ... ])!");
          return;
        }
        for (let i = 0; i < parsedQuestions.length; i++) {
          const q = parsedQuestions[i];
          if (!q.q || !Array.isArray(q.o) || typeof q.a !== 'number' || !q.e) {
            setTopicAddError(`Invalid MCQ object at index ${i}! Check structure: { q, o: [...], a, e }`);
            return;
          }
          // Ensure all options are strings
          q.o = q.o.map(opt => typeof opt === 'string' ? opt : JSON.stringify(opt));
        }
      } catch (err) {
        setTopicAddError("Invalid MCQ JSON syntax! Please check parsing: " + err.message);
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
      setTopicAddSuccess("Topic successfully updated in database!");
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
      setTopicAddError("Heading and notes are mandatory!");
      return;
    }

    const payload = {
      name: newTopicName.trim(),
      syllabus: newTopicSyllabus.trim() || "Custom added user revision notes.",
      notes: newTopicNotes
    };

    const res = await addCustomTopic(payload);
    if (res.success) {
      setTopicAddSuccess("Topic successfully saved to database!");
      setNewTopicName('');
      setNewTopicSyllabus('');
      setNewTopicNotes('');
      setTimeout(() => {
        setModalOpen(false);
        setTopicAddSuccess('');
      }, 1500);
    } else {
      setTopicAddError(res.message || "Failed to add custom topic to database.");
    }
  };

  if (!user) {
    return <AuthPanel loginUser={loginUser} registerUser={registerUser} />;
  }

  if (activeView === 'test') {
    return (
      <ExamPortal 
        selectedSubject={selectedSubject}
        timer={timer}
        testQuestions={testQuestions}
        currentQuestionIdx={currentQuestionIdx}
        selectedAnswers={selectedAnswers}
        questionStatuses={questionStatuses}
        user={user}
        cancelConfirmOpen={cancelConfirmOpen}
        setCancelConfirmOpen={setCancelConfirmOpen}
        selectOptionValue={selectOptionValue}
        jumpToQuestion={jumpToQuestion}
        saveAndNext={saveAndNext}
        markForReview={markForReview}
        clearResponse={clearResponse}
        submitExam={submitExam}
        cancelTest={cancelTest}
      />
    );
  }

  if (activeView === 'mock_exam_active' && activeMockTestId) {
    return (
      <FullMockPortal 
        mockTestId={activeMockTestId}
        user={user}
        onCancel={() => {
          setActiveMockTestId(null);
          setActiveView('mock');
        }}
        onSubmit={submitMockExam}
      />
    );
  }

  if (activeView === 'results') {
    return (
      <ResultsPortal 
        testSummary={testSummary}
        testQuestions={testQuestions}
        selectedAnswers={selectedAnswers}
        startTest={startTest}
        setActiveView={setActiveView}
      />
    );
  }

  return (
    <div className="lms-container">
      <Helmet><title>Dashboard | ExamPrep Pro</title></Helmet>
      
      {globalLoading && (
        <div className="absolute-loader-strip">
          <RefreshCw className="spin-icon" size={14} />
          <span>Synchronizing with MongoDB Atlas...</span>
        </div>
      )}

      <Sidebar 
        user={user}
        logoutUser={logoutUser}
        isOnline={isOnline}
        activeView={activeView}
        setActiveView={setActiveView}
        skipToSubjects={skipToSubjects}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      <main className="lms-workspace">
        {/* Mobile Header Toggle */}
        <div className="mobile-header">
          <button className="btn-mobile-toggle" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h2>{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
        </div>

        {globalError && (
          <div className="alert-banner error">
            <XCircle size={16} />
            <span>{globalError}</span>
          </div>
        )}
        {drillError && activeView === 'drill' && (
          <div className="alert-banner error">
            <XCircle size={16} />
            <span>{drillError}</span>
          </div>
        )}

        <div className="workspace-card-enclosure" ref={workspaceRef}>
          {activeView === 'drill' && (
            <DrillWorkspace 
              drillType={drillType}
              currentDrill={currentDrill}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              maxTableBase={maxTableBase}
              setMaxTableBase={setMaxTableBase}
              drillStats={drillStats}
              drillFeedback={drillFeedback}
              wrongQuestions={wrongQuestions}
              clearWrongLog={clearWrongLog}
              changeDrillType={changeDrillType}
              submitDrillAnswer={submitDrillAnswer}
              skipDrillQuestion={skipDrillQuestion}
              loadNextDrill={loadNextDrill}
            />
          )}

          {['subjects', 'topics', 'notes'].includes(activeView) && (
            <SyllabusWorkspace 
              activeView={activeView}
              setActiveView={setActiveView}
              subjects={subjects}
              selectSubject={selectSubject}
              selectedSubject={selectedSubject}
              topicsList={topicsList}
              selectTopic={selectTopic}
              user={user}
              setModalOpen={setModalOpen}
              handleOpenEditModal={handleOpenEditModal}
              handleDeleteClick={handleDeleteClick}
              activeNotes={activeNotes}
              startTest={startTest}
              updateCustomTopic={updateCustomTopic}
            />
          )}

          {activeView === 'performance' && (
            <PerformanceWorkspace user={user} />
          )}

          {activeView === 'analytics' && (
            <AnalyticsWorkspace user={user} />
          )}

          {activeView === 'mock' && (
            <MockWorkspace 
              mockTestsApi={mockTestsHooks}
              startMockExam={startMockExam}
            />
          )}

          {activeView === 'revision' && (
            <RevisionWorkspace 
              deckTab={deckTab}
              setDeckTab={setDeckTab}
              tableSubTab={tableSubTab}
              setTableSubTab={setTableSubTab}
              expandedTable={expandedTable}
              setExpandedTable={setExpandedTable}
              vocabSearch={vocabSearch}
              setVocabSearch={setVocabSearch}
              vocabCategory={vocabCategory}
              setVocabCategory={setVocabCategory}
              vocabListLoading={vocabListLoading}
              filteredVocabDB={filteredVocabDB}
              setVocabModalOpen={setVocabModalOpen}
              openEditVocab={openEditVocab}
              loadVocabList={loadVocabList}
              vocabModalOpen={vocabModalOpen}
              editingVocabId={editingVocabId}
              vocabForm={vocabForm}
              setVocabForm={setVocabForm}
              handleVocabSubmit={handleVocabSubmit}
              vocabFormError={vocabFormError}
              vocabFormSuccess={vocabFormSuccess}
              resetVocabForm={resetVocabForm}
              vocabBulkModalOpen={vocabBulkModalOpen}
              setVocabBulkModalOpen={setVocabBulkModalOpen}
              vocabBulkJson={vocabBulkJson}
              setVocabBulkJson={setVocabBulkJson}
              vocabBulkError={vocabBulkError}
              vocabBulkSuccess={vocabBulkSuccess}
              handleVocabBulkSubmit={handleVocabBulkSubmit}
              vocabPage={vocabPage}
              vocabTotalPages={vocabTotalPages}
              handleVocabPageChange={handleVocabPageChange}
            />
          )}

          {activeView === 'competition' && (
            <CompetitionWorkspace user={user} />
          )}
        </div>
      </main>

      {/* --- ADD CUSTOM TOPIC DIALOG MODAL --- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Custom Revision Topic</h3>
              <button className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCreateTopicSubmit}>
              <div className="form-group">
                <label>Topic Heading *</label>
                <input 
                  type="text" 
                  value={newTopicName} 
                  onChange={e => setNewTopicName(e.target.value)} 
                  required 
                  placeholder="e.g. Fundamental Rights"
                />
              </div>
              <div className="form-group">
                <label>Syllabus Meta Description</label>
                <input 
                  type="text" 
                  value={newTopicSyllabus} 
                  onChange={e => setNewTopicSyllabus(e.target.value)} 
                  placeholder="e.g. Part III of Constitution"
                />
              </div>
              <div className="form-group">
                <label>Comprehensive Revision Notes (Markdown / Text) *</label>
                <textarea 
                  rows="6" 
                  value={newTopicNotes} 
                  onChange={e => setNewTopicNotes(e.target.value)} 
                  required 
                  placeholder="Draft your detailed formulas, logic steps, and tricks here..."
                />
              </div>
              
              {topicAddError && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                  {topicAddError}
                </p>
              )}
              {topicAddSuccess && (
                <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>
                  {topicAddSuccess}
                </p>
              )}

              <div className="modal-footer-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save-topic">Commit to Atlas Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CUSTOM TOPIC DIALOG MODAL --- */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Topic Notes & Inject MCQs</h3>
              <button className="btn-close-modal" onClick={() => setEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleEditTopicSubmit}>
              <div className="form-group">
                <label>Topic Heading *</label>
                <input 
                  type="text" 
                  value={editTopicName} 
                  onChange={e => setEditTopicName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Syllabus Meta Description</label>
                <input 
                  type="text" 
                  value={editTopicSyllabus} 
                  onChange={e => setEditTopicSyllabus(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Topic Notes *</label>
                <textarea 
                  rows="4" 
                  value={editTopicNotes} 
                  onChange={e => setEditTopicNotes(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>
                  Inject Bulk MCQs (JSON Array format)
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '4px' }}>
                    Paste a valid JSON array here to append MCQs to this topic. Example: <br/>
                    <code>{`[ { "q": "Question", "o": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"], "a": 1, "e": "Explanation" } ]`}</code>
                  </span>
                </label>
                <textarea 
                  rows="5" 
                  value={editTopicQuestionsJson} 
                  onChange={e => setEditTopicQuestionsJson(e.target.value)} 
                  placeholder="Paste JSON Array of questions here..."
                  style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-input)' }}
                />
              </div>

              {topicAddError && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{topicAddError}</p>
              )}
              {topicAddSuccess && (
                <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>{topicAddSuccess}</p>
              )}

              <div className="modal-footer-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditModalOpen(false)}>Discard Edit</button>
                <button type="submit" className="btn-save-topic">Update Topic & Append MCQs</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: '400px', borderTop: '4px solid #ef4444' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', margin: 0 }}>
                <XCircle size={20} />
                Confirm Deletion
              </h3>
            </div>
            
            <div style={{ padding: '20px 0', color: '#cbd5e1' }}>
              Are you completely sure you want to permanently delete this topic and all its associated MCQs? 
              <br/><br/>
              <strong>This cannot be undone!</strong>
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
                style={{ backgroundColor: '#ef4444', flex: 1 }}
                onClick={async () => {
                  setDeleteConfirmOpen(false);
                  await deleteCustomTopic(deletingTopicId);
                }}
              >
                Yes, Delete It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
