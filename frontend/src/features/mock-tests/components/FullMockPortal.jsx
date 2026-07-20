import { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { pageTitle } from '@/shared/brand';
import { RefreshCw, Activity, X, XCircle, Flag, Eraser, Save, Send, Timer, ArrowLeft, Ban } from 'lucide-react';
import { McqText } from '@/shared/components/ui/McqText';
import '@/features/dashboard/Dashboard.css';
import '@/features/exam/exam.css';
import { apiService } from '@/shared/services/apiService';
import { useExam } from '@/shared/context/useExam';

function sectionsFromQuestions(questions) {
  const order = [];
  const seen = new Set();
  for (const q of questions || []) {
    const s = q?.section;
    if (s && !seen.has(s)) {
      seen.add(s);
      order.push(s);
    }
  }
  return order;
}

export function FullMockPortal({ mockTestId, user, onCancel, onSubmit }) {
  const { exam } = useExam();
  const [loading, setLoading] = useState(true);
  const [mockData, setMockData] = useState(null);

  const [timer, setTimer] = useState(() => (exam.mockMinutes || 60) * 60);
  const [currentSection, setCurrentSection] = useState('');
  const [globalIndex, setGlobalIndex] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questionStatuses, setQuestionStatuses] = useState({});
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [sectionTimes, setSectionTimes] = useState({});

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
      try {
        const res = await apiService.get(`/mock/${mockTestId}`);
        const testData = res?.data ?? res;

        if (cancelled) return;

        if (testData?.questions) {
          setMockData(testData);
          setTimer((exam.mockMinutes || 60) * 60);

          const secs = sectionsFromQuestions(testData.questions);
          const times = Object.fromEntries(secs.map((s) => [s, 0]));
          setSectionTimes(times);

          if (testData.questions.length > 0) {
            setQuestionStatuses({ 0: 'not-answered' });
            if (testData.questions[0].section) {
              setCurrentSection(testData.questions[0].section);
            } else if (secs[0]) {
              setCurrentSection(secs[0]);
            }
          }
        } else {
          console.error('Mock test payload missing questions', res);
        }
      } catch (err) {
        console.error('Error loading mock test', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTest();
    return () => { cancelled = true; };
  }, [mockTestId, exam.mockMinutes]);

  // Timer logic
  useEffect(() => {
    if (loading) return;
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const { mockData: md, selectedAnswers: sa, sectionTimes: st } = stateRef.current;
          onSubmit(md, sa, 0, st);
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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const jumpToQuestion = (idx) => {
    setGlobalIndex(idx);
    const section = mockData.questions[idx].section;
    if (section !== currentSection) {
      setCurrentSection(section);
    }
    if (!questionStatuses[idx]) {
      setQuestionStatuses(prev => ({ ...prev, [idx]: 'not-answered' }));
    }
    setPaletteOpen(false);
  };

  const selectOptionValue = (optIdx) => {
    setSelectedAnswers(prev => ({ ...prev, [globalIndex]: optIdx }));
    // Immediately mark as answered
    setQuestionStatuses(prev => ({ ...prev, [globalIndex]: 'answered' }));
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
    setQuestionStatuses(prev => ({ ...prev, [globalIndex]: 'marked' }));
    goToNextQuestion();
  };

  const saveAndNext = () => {
    if (selectedAnswers[globalIndex] !== undefined) {
      setQuestionStatuses(prev => ({ ...prev, [globalIndex]: 'answered' }));
    }
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (globalIndex < mockData.questions.length - 1) {
      jumpToQuestion(globalIndex + 1);
    }
  };

  if (loading) {
    return (
      <div id="exam-portal" className="no-select">
         <div className="exam-initializing-overlay">
            <RefreshCw className="spin-icon spin-icon-blue" size={32} />
            <span className="exam-initializing-text">Initializing Secure Mock Exam Environment...</span>
         </div>
      </div>
    );
  }

  if (!mockData?.questions?.length) {
    return (
      <div id="exam-portal" className="no-select">
         <div className="exam-initializing-overlay">
            <span className="exam-initializing-text">Could not load this mock test. Please go back and try again.</span>
            <button type="button" className="btn-cancel" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={onCancel}>
              <ArrowLeft size={16} /> Back to Mocks
            </button>
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
          <span className="timer-label-full">Time Left </span>
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
          
          <div className="question-area">
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
                        key={idx} 
                        className={`opt-label ${isActive ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`opt-radio-${globalIndex}`}
                          checked={isActive}
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
              <div className="exam-q-missing">Question data missing or invalid.</div>
            )}
          </div>

          <div className="footer-buttons">
            <button type="button" className="btn btn-clear" onClick={clearResponse}>
              <Eraser size={15} strokeWidth={2} />
              <span>Clear</span>
            </button>
            <button type="button" className="btn btn-review" onClick={markForReview}>
              <Flag size={15} strokeWidth={2} />
              <span>Mark</span>
            </button>
            <button type="button" className="btn btn-save" onClick={saveAndNext}>
              <Save size={15} strokeWidth={2} />
              <span>Next</span>
            </button>
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
                <div className="exam-user-name">{user?.username || 'Guest User'}</div>
                <div className="exam-user-meta">
                  {qCount} Q · {exam.mockMinutes} min · {exam.name}
                </div>
              </div>
            </div>
            
            <div className="palette-header">
              {currentSection} Palette
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
                <span className="dot dot-white"></span> Not Visited
              </div>
              <div className="legend-item">
                <span className="dot dot-red"></span> Not Answered
              </div>
              <div className="legend-item">
                <span className="dot dot-green"></span> Answered
              </div>
              <div className="legend-item">
                <span className="dot dot-yellow"></span> Marked
              </div>
            </div>
          </div>

          <div className="exam-palette-actions">
            <button 
              type="button"
              className="btn btn-submit-section" 
              onClick={() => onSubmit(mockData, selectedAnswers, timer, sectionTimes)}
            >
              <Send size={15} strokeWidth={2} /> Submit Test
            </button>
            <button 
              type="button"
              className="btn btn-cancel-test" 
              onClick={() => {
                setPaletteOpen(false);
                setCancelConfirmOpen(true);
              }}
            >
              <Ban size={15} strokeWidth={2} /> Abort
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
                Abort Mock Exam?
              </h3>
              <button className="btn-close-modal" onClick={() => setCancelConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-cancel">
              <p className="modal-body-bold">Are you sure you want to abort the mock exam?</p>
              <p className="modal-body-sub">All your current progress and answered questions will be <strong>erased</strong>. This action cannot be undone.</p>
            </div>

            <div className="modal-actions-row">
              <button 
                type="button" 
                className="btn-cancel btn-cancel-flex"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Continue Exam
              </button>
              <button 
                type="button" 
                className="btn-save-topic btn-confirm-flex" 
                onClick={() => {
                  setCancelConfirmOpen(false);
                  onCancel();
                }}
              >
                <XCircle size={16} /> Yes, Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
