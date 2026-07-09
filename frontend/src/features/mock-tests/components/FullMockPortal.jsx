import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { RefreshCw, Activity, X, XCircle } from 'lucide-react';
import '../../pages/Dashboard.css';
import { apiService } from '../../services/apiService';

const SECTIONS = ['English', 'GK', 'Quant', 'Reasoning'];

export function FullMockPortal({ mockTestId, user, onCancel, onSubmit }) {
  const [loading, setLoading] = useState(true);
  const [mockData, setMockData] = useState(null);
  
  const [timer, setTimer] = useState(3600); // 60 mins
  const [currentSection, setCurrentSection] = useState(SECTIONS[0]);
  const [globalIndex, setGlobalIndex] = useState(0); // 0 to 99
  
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questionStatuses, setQuestionStatuses] = useState({}); // 'not-visited', 'not-answered', 'answered', 'marked'
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const [sectionTimes, setSectionTimes] = useState({
    'English': 0, 'GK': 0, 'Quant': 0, 'Reasoning': 0
  });

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
    async function loadTest() {
      try {
        const res = await apiService.get(`/mock/${mockTestId}`);
        if (res.success && res.data) {
          const testData = res.data;
          setMockData(testData);
          
          // Pre-populate visited for the first question
          if (testData.questions && testData.questions.length > 0) {
            setQuestionStatuses(prev => ({ ...prev, 0: 'not-answered' }));
            
            // Set first section based on the first question
            if (testData.questions[0].section) {
              setCurrentSection(testData.questions[0].section);
            }
          }
        }
      } catch (err) {
        console.error('Error loading mock test', err);
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [mockTestId]);

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
    return `Time Remaining: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

  if (loading || !mockData) {
    return (
      <div id="exam-portal" className="no-select">
         <div className="exam-initializing-overlay">
            <RefreshCw className="spin-icon spin-icon-blue" size={32} />
            <span className="exam-initializing-text">Initializing Secure Mock Exam Environment...</span>
         </div>
      </div>
    );
  }

  const activeQ = mockData.questions[globalIndex];
  
  // Filter questions for the palette based on current section
  const sectionQuestions = mockData.questions.map((q, i) => ({ ...q, originalIndex: i })).filter(q => q.section === currentSection);

  return (
    <div id="exam-portal" className="no-select">
      <Helmet><title>Full Mock Test | ExamPrep Pro</title></Helmet>
      
      {/* Top Navbar */}
      <div className="navbar">
        <div>{mockData.title.toUpperCase()} - FULL MOCK (100 Qs)</div>
        <div id="timer-box" style={{ color: timer < 300 ? '#ef4444' : 'inherit' }}>{formatTimer(timer)}</div>
      </div>

      {/* Section Tabs */}
      <div className="revision-sub-tabs" style={{ margin: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
        {SECTIONS.map(st => (
          <button
            key={st}
            className={`revision-sub-tab ${currentSection === st ? 'active' : ''}`}
            onClick={() => {
               setCurrentSection(st);
               // optionally jump to the first question of this section
               const firstQIdx = mockData.questions.findIndex(q => q.section === st);
               if (firstQIdx !== -1) jumpToQuestion(firstQIdx);
            }}
            style={{ borderRadius: 0, padding: '12px 24px' }}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="main-layout" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="left-panel">
          <div className="section-bar">
            Section: {currentSection}
          </div>
          
          <div className="question-area">
            {activeQ ? (
              <>
                <div className="q-text" id="q-display-text" style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
                  <b>Q{globalIndex + 1}.</b> {activeQ.q}
                </div>

                <div className="options-box" id="options-display-box" style={{ marginTop: '30px' }}>
                  {activeQ.o.map((opt, idx) => {
                    const isActive = selectedAnswers[globalIndex] === idx;
                    return (
                      <label 
                        key={idx} 
                        className={`opt-label ${isActive ? 'active' : ''}`}
                        style={{ padding: '15px' }}
                      >
                        <input
                          type="radio"
                          name={`opt-radio-${globalIndex}`}
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
              <div style={{ padding: '20px' }}>Question data missing or invalid.</div>
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
              <div className="avatar">{user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'}</div>
              <div>
                <div className="exam-user-name">{user?.username || 'Guest User'}</div>
                <div className="exam-user-meta">100 Questions | 60 Mins</div>
              </div>
            </div>
            
            <div className="palette-header">
              {currentSection} Palette :
            </div>
            
            <div className="palette-grid" id="palette-box">
              {sectionQuestions.map((sq, sectionIdx) => {
                const status = questionStatuses[sq.originalIndex] || 'not-visited';
                const isActive = globalIndex === sq.originalIndex;
                return (
                  <button
                    key={sq.originalIndex}
                    id={`p-btn-${sq.originalIndex}`}
                    className={`palette-btn ${status} ${isActive ? 'active-q' : ''}`}
                    onClick={() => jumpToQuestion(sq.originalIndex)}
                    style={isActive ? { border: '2px solid #000' } : {}}
                  >
                    {sectionIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
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
            <button 
              className="btn btn-submit-section" 
              onClick={() => onSubmit(mockData, selectedAnswers, timer, sectionTimes)}
              style={{ background: '#10b981' }}
            >
              Submit Full Test
            </button>
            <button 
              className="btn btn-cancel-test" 
              onClick={() => setCancelConfirmOpen(true)}
            >
              ✕ Abort Test
            </button>
          </div>
        </div>
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
