import { useState, useEffect, useRef, useMemo, useCallback, type TouchEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { pageTitle } from '@/shared/brand';
import { Activity, X, XCircle, Flag, Eraser, Save, Send, Timer, ArrowLeft, Ban, ChevronLeft } from 'lucide-react';
import { McqText } from '@/shared/components/ui/McqText';
import { ExamLoader } from '@/features/exam/components/ExamLoader';
import '@/features/dashboard/Dashboard.css';
import '@/features/exam/exam.css';
import { apiService } from '@/shared/services/apiService';
import { useExam } from '@/shared/context/useExam';
import { normalizeQuestions } from '@/shared/utils/answerNormalizer';
import { isRecord } from '@/types/app';
import type { AppUser, McqQuestion, MockTestItem } from '@/types/app';

function sectionsFromQuestions(questions: McqQuestion[] | null | undefined): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const q of questions || []) {
    const s = q?.section;
    if (s && !seen.has(s)) {
      seen.add(s);
      order.push(s);
    }
  }
  return order;
}

interface FullMockPortalProps {
  mockTestId: string | null;
  user: AppUser | null;
  onCancel: () => void;
  onSubmit: (
    mockData: MockTestItem,
    answers: Record<number, number | null>,
    remainingTimer?: number,
    sectionTimes?: Record<string, number>
  ) => void;
}

export function FullMockPortal({ mockTestId, user, onCancel, onSubmit }: FullMockPortalProps) {
  const { exam } = useExam();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [mockData, setMockData] = useState<(MockTestItem & { questions: McqQuestion[] }) | null>(null);

  const [timer, setTimer] = useState(() => (exam.mockMinutes || 60) * 60);
  const [currentSection, setCurrentSection] = useState('');
  const [globalIndex, setGlobalIndex] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, string>>({});
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [sectionTimes, setSectionTimes] = useState<Record<string, number>>({});
  const touchStartRef = useRef({ x: 0, y: 0 });

  const sections = useMemo(
    () => sectionsFromQuestions(mockData?.questions) || exam.sections || [],
    [mockData, exam.sections]
  );

  const stateRef = useRef({ mockData, selectedAnswers, sectionTimes });
  useEffect(() => {
    stateRef.current = { mockData, selectedAnswers, sectionTimes };
  }, [mockData, selectedAnswers, sectionTimes]);

  const currentSectionRef = useRef(currentSection);
  useEffect(() => {
    currentSectionRef.current = currentSection;
  }, [currentSection]);

  // Fetch Mock Data
  useEffect(() => {
    let cancelled = false;

    async function loadTest() {
      if (!mockTestId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');
      try {
        const res = await apiService.get(`/mock/${mockTestId}`);
        const raw = res?.data ?? res;
        const testData = isRecord(raw) ? raw : null;

        if (cancelled) return;

        if (testData && Array.isArray(testData.questions)) {
          // Normalize answers (convert letter-based answers to numeric indices)
          const normalizedData = {
            ...testData,
            questions: normalizeQuestions(testData.questions as McqQuestion[]) as McqQuestion[]
          };
          setMockData(normalizedData as MockTestItem & { questions: McqQuestion[] });
          setTimer((exam.mockMinutes || 60) * 60);

          const secs = sectionsFromQuestions(normalizedData.questions);
          const times = Object.fromEntries(secs.map((s) => [s, 0]));
          setSectionTimes(times);

          if (normalizedData.questions.length > 0) {
            setQuestionStatuses({ 0: 'not-answered' });
            if (normalizedData.questions[0].section) {
              setCurrentSection(normalizedData.questions[0].section);
            } else if (secs[0]) {
              setCurrentSection(secs[0]);
            }
          }
        } else {
          setLoadError('This mock paper could not be opened. It may have been removed.');
        }
      } catch {
        if (!cancelled) setLoadError('Unable to load this mock paper. Check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTest();
    return () => { cancelled = true; };
  }, [mockTestId, exam.mockMinutes, reloadKey]);

  // Timer logic
  useEffect(() => {
    if (loading) return;
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const { mockData: md, selectedAnswers: sa, sectionTimes: st } = stateRef.current;
          if (md) onSubmit(md, sa, 0, st);
          return 0;
        }
        return prev - 1;
      });

      setSectionTimes(prev => {
        const sec = currentSectionRef.current;
        return { ...prev, [sec]: (prev[sec] || 0) + 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, onSubmit]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const jumpToQuestion = (idx: number) => {
    setGlobalIndex(idx);
    const section = mockData?.questions[idx]?.section;
    if (section && section !== currentSection) {
      setCurrentSection(section);
    }
    if (!questionStatuses[idx]) {
      setQuestionStatuses(prev => ({ ...prev, [idx]: 'not-answered' }));
    }
    setPaletteOpen(false);
  };

  const selectOptionValue = (optIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [globalIndex]: optIdx }));
    setQuestionStatuses(prev => {
      const current = prev[globalIndex];
      const marked = current === 'marked' || current === 'marked-answered';
      return { ...prev, [globalIndex]: marked ? 'marked-answered' : 'answered' };
    });
  };

  const clearResponse = () => {
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[globalIndex];
      return next;
    });
    setQuestionStatuses(prev => ({ ...prev, [globalIndex]: 'not-answered' }));
  };

  const markForReview = () => {
    const hasAnswer = selectedAnswers[globalIndex] !== undefined && selectedAnswers[globalIndex] !== null;
    setQuestionStatuses(prev => ({ ...prev, [globalIndex]: hasAnswer ? 'marked-answered' : 'marked' }));
    goToNextQuestion();
  };

  const saveAndNext = () => {
    if (selectedAnswers[globalIndex] !== undefined && selectedAnswers[globalIndex] !== null) {
      setQuestionStatuses(prev => {
        const current = prev[globalIndex];
        const marked = current === 'marked' || current === 'marked-answered';
        return { ...prev, [globalIndex]: marked ? 'marked-answered' : 'answered' };
      });
    }
    if (globalIndex < (mockData?.questions.length || 0) - 1) {
      goToNextQuestion();
    } else {
      requestSubmit();
    }
  };

  const goToPreviousQuestion = () => {
    if (globalIndex > 0) {
      jumpToQuestion(globalIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (globalIndex < (mockData?.questions.length || 0) - 1) {
      jumpToQuestion(globalIndex + 1);
    }
  };

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) {
      return;
    }

    if (dx > 0) {
      goToPreviousQuestion();
    } else {
      goToNextQuestion();
    }
  };

  const requestSubmit = useCallback(() => {
    if (!mockData) return;
    setSubmitConfirmOpen(true);
    setPaletteOpen(false);
  }, [mockData]);

  const confirmSubmit = useCallback(() => {
    if (!mockData) return;
    setSubmitConfirmOpen(false);
    onSubmit(mockData, selectedAnswers, timer, sectionTimes);
  }, [mockData, onSubmit, selectedAnswers, timer, sectionTimes]);

  useEffect(() => {
    if (loading || !mockData || cancelConfirmOpen || submitConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowright' || key === 'n') {
        e.preventDefault();
        goToNextQuestion();
      } else if (key === 'arrowleft' || key === 'p') {
        e.preventDefault();
        goToPreviousQuestion();
      } else if (key === 'm') {
        e.preventDefault();
        markForReview();
      } else if (['a', 'b', 'c', 'd', '1', '2', '3', '4'].includes(key)) {
        const idx = key >= '1' && key <= '4' ? Number(key) - 1 : key.charCodeAt(0) - 97;
        if (idx >= 0 && idx < (mockData.questions[globalIndex]?.o?.length || 0)) {
          e.preventDefault();
          selectOptionValue(idx);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (loading) {
    return (
      <div id="exam-portal" className="no-select exam-portal--loading">
        <Helmet><title>{pageTitle('Full Mock')}</title></Helmet>
        <ExamLoader
          title="Preparing your mock test"
          subtitle="Loading the paper. The timer starts when the first question appears."
        />
      </div>
    );
  }

  if (loadError || !mockData?.questions?.length) {
    return (
      <div id="exam-portal" className="no-select exam-portal--loading">
        <Helmet><title>{pageTitle('Full Mock')}</title></Helmet>
        <div className="exam-loader">
          <p className="exam-loader__title">Unable to open this mock</p>
          <p className="exam-loader__sub">{loadError || 'This paper has no questions yet. Return to the mock list and choose another paper.'}</p>
          <div className="exam-loader__actions">
            {mockTestId && (
              <button
                type="button"
                className="btn-create-topic"
                onClick={() => {
                  setLoadError('');
                  setMockData(null);
                  setReloadKey((k) => k + 1);
                }}
              >
                Try again
              </button>
            )}
            <button type="button" className="btn-cancel" onClick={onCancel}>
              <ArrowLeft size={16} /> Back to mocks
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeQ = mockData.questions[globalIndex];
  const qCount = mockData.questions.length;
  
  // Filter questions for the palette based on current section
  const sectionQuestions = mockData.questions.map((q, i) => ({ ...q, originalIndex: i })).filter(q => q.section === currentSection);

  return (
    <div id="exam-portal" className="no-select exam-portal--mock">
      <Helmet><title>{pageTitle('Full Mock')}</title></Helmet>
      
      {/* Top Navbar */}
      <div className="navbar">
        <div className="exam-nav-title">
          <span className="exam-nav-title__full">{mockData.title}</span>
          <span className="exam-nav-title__meta">{qCount} Q · {exam.name}</span>
        </div>
        <div id="timer-box" className={timer < 300 ? 'timer-urgent' : ''} style={{ color: timer < 300 ? '#ef4444' : 'inherit' }}>
          <Timer size={16} strokeWidth={2} />
            <span className="timer-label-full">Time remaining </span>
          <strong>{formatTimer(timer)}</strong>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="exam-section-tabs revision-sub-tabs" role="tablist">
        {sections.map(st => (
          <button
            key={st}
            type="button"
            role="tab"
            className={`revision-sub-tab ${currentSection === st ? 'active' : ''}`}
            onClick={() => {
               setCurrentSection(st);
               const firstQIdx = mockData.questions.findIndex(q => q.section === st);
               if (firstQIdx !== -1) jumpToQuestion(firstQIdx);
            }}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="main-layout">
        <div className="left-panel">
          <div className="section-bar">
            <span>Q{globalIndex + 1}/{qCount} · {currentSection || 'Section'}</span>
            <button
              type="button"
              className="exam-palette-toggle"
              onClick={() => setPaletteOpen(true)}
            >
              Palette
            </button>
          </div>
          
          <div
            className="question-area"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {activeQ ? (
              <>
                <div className="q-text" id="q-display-text">
                  <b>Q{globalIndex + 1}.</b>{' '}
                  <McqText text={activeQ.q} />
                </div>

                <div className="options-box" id="options-display-box">
                  {activeQ.o.map((opt, idx) => {
                    const isActive = selectedAnswers[globalIndex] === idx;
                    return (
                      <label 
                        key={`${globalIndex}-${idx}`} 
                        className={`opt-label ${isActive ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`opt-radio-${globalIndex}`}
                          value={idx}
                          checked={Boolean(isActive)}
                          autoComplete="off"
                          onChange={() => selectOptionValue(idx)}
                        />
                        <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                        <McqText text={opt} className="opt-text" />
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="exam-q-missing">This question could not be displayed.</div>
            )}
          </div>

          <div className="footer-buttons">
            <div className="exam-control-group">
              <button type="button" className="btn btn-clear" onClick={clearResponse}>
                <Eraser size={15} strokeWidth={2} />
                <span>Clear</span>
              </button>
              <button type="button" className="btn btn-review" onClick={markForReview}>
                <Flag size={15} strokeWidth={2} />
                <span>Mark</span>
              </button>
            </div>
            <div className="exam-control-group exam-control-group--side">
              <button type="button" className="btn btn-clear" onClick={goToPreviousQuestion} disabled={globalIndex === 0}>
                <ChevronLeft size={15} strokeWidth={2} />
                <span>Previous</span>
              </button>
              <button type="button" className="btn btn-save" onClick={saveAndNext}>
                <Save size={15} strokeWidth={2} />
                <span>{globalIndex >= qCount - 1 ? 'Review' : 'Save & next'}</span>
              </button>
              <button type="button" className="btn btn-submit-section" onClick={requestSubmit}>
                <Send size={15} strokeWidth={2} />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </div>

        <div className={`right-panel${paletteOpen ? ' is-open' : ''}`}>
          <div className="exam-palette-sheet-head">
            <strong>Question palette</strong>
            <button type="button" className="exam-palette-close" onClick={() => setPaletteOpen(false)} aria-label="Close palette">
              <X size={18} />
            </button>
          </div>
          <div className="exam-palette-body">
            <div className="user-profile">
              <div className="avatar">{user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'}</div>
              <div>
                <div className="exam-user-name">{user?.username || 'Candidate'}</div>
                <div className="exam-user-meta">
                  {qCount} questions · {exam.mockMinutes} minutes · {exam.name}
                </div>
              </div>
            </div>
            
            <div className="palette-header">
              {currentSection} · question palette
            </div>
            
            <div className="palette-grid" id="palette-box">
              {sectionQuestions.map((sq, sectionIdx) => {
                const status = questionStatuses[sq.originalIndex] || 'not-visited';
                const isActive = globalIndex === sq.originalIndex;
                return (
                  <button
                    key={sq.originalIndex}
                    type="button"
                    id={`p-btn-${sq.originalIndex}`}
                    className={`palette-btn ${status} ${isActive ? 'active-q' : ''}`}
                    onClick={() => jumpToQuestion(sq.originalIndex)}
                  >
                    {sectionIdx + 1}
                  </button>
                );
              })}
            </div>

            <div className="legend-box">
              <div className="legend-item">
                <span className="dot dot-white"></span> Not visited
              </div>
              <div className="legend-item">
                <span className="dot dot-red"></span> Not answered
              </div>
              <div className="legend-item">
                <span className="dot dot-green"></span> Answered
              </div>
              <div className="legend-item">
                <span className="dot dot-yellow"></span> Marked
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: '#7c3aed', borderColor: '#6d28d9' }}></span> Marked & answered
              </div>
            </div>
          </div>

          <div className="exam-palette-actions">
            <button 
              type="button"
              className="btn btn-submit-section" 
              onClick={requestSubmit}
            >
              <Send size={15} strokeWidth={2} /> Submit paper
            </button>
            <button 
              type="button"
              className="btn btn-cancel-test" 
              onClick={() => {
                setPaletteOpen(false);
                setCancelConfirmOpen(true);
              }}
            >
              <Ban size={15} strokeWidth={2} /> Exit
            </button>
          </div>
        </div>

        {paletteOpen && (
          <button
            type="button"
            className="exam-palette-backdrop"
            aria-label="Close palette"
            onClick={() => setPaletteOpen(false)}
          />
        )}
      </div>

      {/* --- CANCEL TEST CONFIRMATION MODAL --- */}
      {cancelConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-content-cancel">
            <div className="modal-header">
              <h3 className="modal-title-warning">
                <Activity size={20} color="#f59e0b" />
                Leave this mock?
              </h3>
              <button className="btn-close-modal" onClick={() => setCancelConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-cancel">
              <p className="modal-body-bold">Exit without submitting?</p>
              <p className="modal-body-sub">Your answers will not be saved. This cannot be undone.</p>
            </div>

            <div className="modal-actions-row">
              <button 
                type="button" 
                className="btn-cancel btn-cancel-flex"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Continue exam
              </button>
              <button 
                type="button" 
                className="btn-save-topic btn-confirm-flex" 
                onClick={() => {
                  setCancelConfirmOpen(false);
                  onCancel();
                }}
              >
                <XCircle size={16} /> Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {submitConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-content-cancel">
            <div className="modal-header">
              <h3 className="modal-title-warning">
                <Send size={20} />
                Submit paper?
              </h3>
              <button className="btn-close-modal" onClick={() => setSubmitConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body-cancel">
              <p className="modal-body-bold">
                {Object.values(selectedAnswers).filter((v) => v !== null && v !== undefined).length} of {qCount} answered
                {' · '}
                {Object.values(questionStatuses).filter((s) => s === 'marked' || s === 'marked-answered').length} marked for review
              </p>
              <p className="modal-body-sub">
                Time remaining: <strong>{formatTimer(timer)}</strong>. Unanswered questions will be marked blank.
              </p>
            </div>
            <div className="modal-actions-row">
              <button type="button" className="btn-cancel btn-cancel-flex" onClick={() => setSubmitConfirmOpen(false)}>
                Review answers
              </button>
              <button type="button" className="btn-save-topic btn-confirm-flex" onClick={confirmSubmit}>
                <Send size={16} /> Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
