import { useState, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { APP_NAME, pageTitle } from '@/shared/brand';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useDrills } from '@/features/drills/hooks/useDrills';
import { useStudy } from '@/features/study/hooks/useStudy';
import { RefreshCw, XCircle, X, Menu } from 'lucide-react';
import { apiService } from '@/shared/services/apiService';
import './Dashboard.css';
import '@/features/study/study.css';
import '@/features/analytics/performance.css';
import '@/features/drills/drills.css';
import '@/features/exam/exam.css';
import '@/features/competition/competition.css';

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
import { NotesFloatingDock } from '@/features/study/components/NotesFloatingDock';
import { setBackHandler, trapHistory } from '@/shared/utils/backTrap';
import { prepareNotesHtml } from '@/shared/utils/notesMarkup';

const VIEW_PARENT = {
  notes: 'topics',
  topics: 'subjects',
};

const VALID_VIEWS = new Set([
  'drill',
  'subjects',
  'topics',
  'notes',
  'revision',
  'mock',
  'performance',
  'analytics',
  'competition',
  'results',
]);

export function Dashboard() {
  const {
    activeView,
    setActiveView,
    contentSource,
    setContentSource,
    isMineMode,
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
    submitMockExam,
    addCustomTopic,
    addCustomSubject,
    deleteCustomSubject,
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

      // Sidebar tab switch: content slides in (premium). Mobile keeps a soft fade only.
      if (isMobile) {
        gsap.fromTo(workspaceRef.current,
          { opacity: 0.82 },
          { opacity: 1, duration: 0.28, ease: 'power2.out', clearProps: 'opacity' }
        );
        return;
      }

      gsap.fromTo(workspaceRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', clearProps: 'all' }
      );

      const cards = workspaceRef.current.querySelectorAll('.stat-card-premium, .stat-box, .mock-glass-card, .subject-selection-card, .topic-outline-card, .drill-interactive-card, .drill-config-card, .vocab-search-flex, .topic-notes-html, .chart-container');
      const header = workspaceRef.current.querySelector('.workspace-header-sticky');
      if (header) {
        gsap.fromTo(header,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out', clearProps: 'all' }
        );
      }
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.045, ease: 'power3.out', clearProps: 'all' }
        );
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
  const [newTopicQuestionsJson, setNewTopicQuestionsJson] = useState('[]');
  const [topicAddSuccess, setTopicAddSuccess] = useState('');
  const [topicAddError, setTopicAddError] = useState('');

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectFormError, setSubjectFormError] = useState('');
  const [subjectFormSuccess, setSubjectFormSuccess] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState('');
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicSyllabus, setEditTopicSyllabus] = useState('');
  const [editTopicNotes, setEditTopicNotes] = useState('');
  const [editTopicQuestionsJson, setEditTopicQuestionsJson] = useState('[]');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState('');
  const [deleteSubjectConfirmOpen, setDeleteSubjectConfirmOpen] = useState(false);
  const [deletingSubjectName, setDeletingSubjectName] = useState('');
  const [notesDockSignal, setNotesDockSignal] = useState(0);

  const openNotesDock = useCallback(() => {
    setNotesDockSignal((n) => n + 1);
  }, []);

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const viewStackRef = useRef([]);
  const skipStackRef = useRef(false);
  const prevViewRef = useRef(activeView);
  const navRef = useRef({
    activeView,
    isMobileSidebarOpen,
    cancelConfirmOpen,
    user,
  });

  navRef.current = {
    activeView,
    isMobileSidebarOpen,
    cancelConfirmOpen,
    user,
  };

  // Track in-app section history
  useEffect(() => {
    if (!user) return;

    const prev = prevViewRef.current;
    if (skipStackRef.current) {
      skipStackRef.current = false;
      prevViewRef.current = activeView;
      return;
    }

    if (prev && prev !== activeView) {
      if (VIEW_PARENT[prev] === activeView) {
        const stack = viewStackRef.current;
        if (stack[stack.length - 1] === activeView) stack.pop();
      } else if (VALID_VIEWS.has(activeView)) {
        viewStackRef.current.push(prev);
        if (viewStackRef.current.length > 40) viewStackRef.current.shift();
      }
    }

    prevViewRef.current = activeView;
    // Keep an extra history entry whenever the section changes
    trapHistory();
  }, [activeView, user]);

  // Register in-app back behavior with the global trap (never leaves the page)
  useEffect(() => {
    const goToView = (view) => {
      if (!VALID_VIEWS.has(view)) return false;
      skipStackRef.current = true;
      setActiveView(view);
      if (workspaceRef.current) {
        workspaceRef.current.style.opacity = '1';
      }
      return true;
    };

    setBackHandler(() => {
      const {
        activeView: currentView,
        isMobileSidebarOpen: sidebarOpen,
        cancelConfirmOpen: cancelOpen,
        user: loggedIn,
      } = navRef.current;

      if (!loggedIn) return false;

      if (sidebarOpen) {
        setIsMobileSidebarOpen(false);
        return true;
      }

      if (currentView === 'test') {
        if (!cancelOpen) setCancelConfirmOpen(true);
        return true;
      }

      if (currentView === 'mock_exam_active') {
        return goToView('mock');
      }

      if (currentView === 'notes') {
        return goToView('topics');
      }

      if (currentView === 'topics') {
        return goToView('subjects');
      }

      if (currentView === 'results') {
        return goToView('drill');
      }

      const stack = viewStackRef.current;
      while (stack.length > 0) {
        const previous = stack.pop();
        if (previous && previous !== currentView && VALID_VIEWS.has(previous)) {
          return goToView(previous);
        }
      }

      if (currentView !== 'drill') {
        return goToView('drill');
      }

      // At root drills — let global trap show double-back toast (return false)
      return false;
    });

    return () => setBackHandler(null);
  }, [setActiveView]);

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
      notes: prepareNotesHtml(editTopicNotes),
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

  const handleDeleteSubjectClick = (e, subjectName) => {
    e.stopPropagation();
    setDeletingSubjectName(subjectName);
    setDeleteSubjectConfirmOpen(true);
  };

  const parseQuestionsJson = (raw, setError) => {
    if (!raw?.trim() || raw.trim() === '[]') return [];
    try {
      const parsed = JSON.parse(raw.trim());
      if (!Array.isArray(parsed)) {
        setError('MCQ must be a JSON array format (i.e. [ ... ])!');
        return null;
      }
      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i];
        if (!q.q || !Array.isArray(q.o) || typeof q.a !== 'number' || !q.e) {
          setError(`Invalid MCQ object at index ${i}! Check structure: { q, o: [...], a, e }`);
          return null;
        }
        q.o = q.o.map(opt => (typeof opt === 'string' ? opt : JSON.stringify(opt)));
      }
      return parsed;
    } catch (err) {
      setError('Invalid MCQ JSON syntax! Please check parsing: ' + err.message);
      return null;
    }
  };

  const handleCreateSubjectSubmit = async (e) => {
    e.preventDefault();
    setSubjectFormError('');
    setSubjectFormSuccess('');
    if (!newSubjectName.trim()) {
      setSubjectFormError('Subject name is required.');
      return;
    }
    const res = await addCustomSubject(newSubjectName.trim());
    if (res.success) {
      setSubjectFormSuccess('Subject created! Add topics next.');
      setNewSubjectName('');
      setTimeout(() => {
        setSubjectModalOpen(false);
        setSubjectFormSuccess('');
      }, 1200);
    } else {
      setSubjectFormError(res.message || 'Failed to create subject.');
    }
  };

  const handleCreateTopicSubmit = async (e) => {
    e.preventDefault();
    setTopicAddSuccess('');
    setTopicAddError('');

    if (!newTopicName.trim() || !newTopicNotes.trim()) {
      setTopicAddError('Heading and notes are mandatory!');
      return;
    }

    const parsedQuestions = parseQuestionsJson(newTopicQuestionsJson, setTopicAddError);
    if (parsedQuestions === null) return;

    const payload = {
      name: newTopicName.trim(),
      syllabus: newTopicSyllabus.trim() || 'Custom added user revision notes.',
      notes: prepareNotesHtml(newTopicNotes),
      questions: parsedQuestions
    };

    const res = await addCustomTopic(payload);
    if (res.success) {
      setTopicAddSuccess('Topic saved to your notes!');
      setNewTopicName('');
      setNewTopicSyllabus('');
      setNewTopicNotes('');
      setNewTopicQuestionsJson('[]');
      setTimeout(() => {
        setModalOpen(false);
        setTopicAddSuccess('');
      }, 1500);
    } else {
      setTopicAddError(res.message || 'Failed to add custom topic.');
    }
  };

  if (!user) {
    return <AuthPanel loginUser={loginUser} registerUser={registerUser} />;
  }

  if (activeView === 'test') {
    return (
      <ExamPortal 
        selectedSubject={selectedSubject}
        selectedTopicId={selectedTopicId}
        activeNotes={activeNotes}
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
      <Helmet><title>{pageTitle('Dashboard')}</title></Helmet>
      
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
          <h2>{APP_NAME}</h2>
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
              contentSource={contentSource}
              setContentSource={setContentSource}
              isMineMode={isMineMode}
              subjects={subjects}
              selectSubject={selectSubject}
              selectedSubject={selectedSubject}
              topicsList={topicsList}
              selectTopic={selectTopic}
              user={user}
              setModalOpen={setModalOpen}
              setSubjectModalOpen={setSubjectModalOpen}
              handleOpenEditModal={handleOpenEditModal}
              handleDeleteClick={handleDeleteClick}
              handleDeleteSubjectClick={handleDeleteSubjectClick}
              activeNotes={activeNotes}
              startTest={startTest}
              updateCustomTopic={updateCustomTopic}
              onOpenNotesDock={openNotesDock}
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

      <NotesFloatingDock openSignal={notesDockSignal} />

      {/* --- ADD CUSTOM SUBJECT MODAL --- */}
      {subjectModalOpen && (
        <div className="modal-overlay" onClick={() => setSubjectModalOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Your Subject</h3>
              <button className="btn-close-modal" onClick={() => setSubjectModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCreateSubjectSubmit}>
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  required
                  placeholder="e.g. Polity Shortcuts, My Quant Formulas"
                />
              </div>
              {subjectFormError && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{subjectFormError}</p>
              )}
              {subjectFormSuccess && (
                <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>{subjectFormSuccess}</p>
              )}
              <div className="modal-footer-actions">
                <button type="button" className="btn-cancel" onClick={() => setSubjectModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save-topic">Create Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOM TOPIC DIALOG MODAL --- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content-card modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Topic — Notes & Questions</h3>
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
                <label>Revision Notes (text / Markdown / HTML) *</label>
                <textarea 
                  rows="10" 
                  value={newTopicNotes} 
                  onChange={e => setNewTopicNotes(e.target.value)} 
                  required 
                  placeholder={`Paste plain text, Markdown, or HTML. Examples:

## Percentage
**Definition:** Per hundred

Tip: 12.5% = 1/8

- Convert % → fraction
- Convert fraction → %

1. Divide by 100
2. Simplify`}
                />
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
                  Tip: Use <code>## Heading</code>, <code>- bullets</code>, <code>1. numbered</code>, or paste HTML — we auto-format for easy reading.
                </span>
              </div>
              <div className="form-group">
                <label>
                  Practice MCQs (optional JSON array)
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '4px' }}>
                    Example: <code>{`[ { "q": "Question?", "o": ["A","B","C","D"], "a": 0, "e": "Why" } ]`}</code>
                  </span>
                </label>
                <textarea
                  rows="4"
                  value={newTopicQuestionsJson}
                  onChange={e => setNewTopicQuestionsJson(e.target.value)}
                  placeholder='[ { "q": "...", "o": ["..."], "a": 0, "e": "..." } ]'
                  style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-input)' }}
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
                <button type="submit" className="btn-save-topic">Save to My Notes</button>
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
                <label>Revision Notes (text / Markdown / HTML) *</label>
                <textarea 
                  rows="10" 
                  value={editTopicNotes} 
                  onChange={e => setEditTopicNotes(e.target.value)} 
                  required 
                  placeholder="Paste plain text, Markdown, or HTML — we format it for easy reading."
                />
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
                  Tip: <code>## Heading</code>, <code>- bullets</code>, <code>1. numbered</code>, or paste HTML.
                </span>
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

      {/* --- DELETE TOPIC CONFIRMATION --- */}
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
              Delete this topic and all its MCQs from your notes?
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

      {/* --- DELETE SUBJECT CONFIRMATION --- */}
      {deleteSubjectConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: '420px', borderTop: '4px solid #ef4444' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', margin: 0 }}>
                <XCircle size={20} />
                Delete Subject
              </h3>
            </div>
            <div style={{ padding: '20px 0', color: '#cbd5e1' }}>
              Delete <strong>{deletingSubjectName}</strong> and all topics/questions under it?
              <br/><br/>
              <strong>This cannot be undone!</strong>
            </div>
            <div className="modal-footer-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn-cancel"
                style={{ flex: 1 }}
                onClick={() => setDeleteSubjectConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save-topic"
                style={{ backgroundColor: '#ef4444', flex: 1 }}
                onClick={async () => {
                  setDeleteSubjectConfirmOpen(false);
                  await deleteCustomSubject(deletingSubjectName);
                }}
              >
                Yes, Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
