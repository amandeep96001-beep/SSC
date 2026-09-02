import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { pageTitle } from '@/shared/brand';
import { RefreshCw, Activity, X, XCircle, Flag, Eraser, Save, Send, Timer } from 'lucide-react';
import { McqText } from '@/shared/components/ui/McqText';
import '@/features/dashboard/Dashboard.css';
import '@/features/exam/exam.css';

export function ExamPortal({
  selectedSubject,
  selectedTopicId,
  activeNotes,
  timer,
  testQuestions,
  currentQuestionIdx,
  selectedAnswers,
  questionStatuses,
  user,
  cancelConfirmOpen,
  setCancelConfirmOpen,
  selectOptionValue,
  jumpToQuestion,
  saveAndNext,
  markForReview,
  clearResponse,
  submitExam,
  cancelTest
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const activeQ = testQuestions[currentQuestionIdx];
  const qCount = testQuestions?.length || 0;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const goToQuestion = (i) => {
    jumpToQuestion(i);
    setPaletteOpen(false);
  };

  const handleTouchStart = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) {
      return;
    }

    if (dx > 0 && currentQuestionIdx > 0) {
      goToQuestion(currentQuestionIdx - 1);
    } else if (dx < 0 && currentQuestionIdx < qCount - 1) {
      goToQuestion(currentQuestionIdx + 1);
    }
  };

  return (
    <div id="exam-portal" className="no-select exam-portal--topic">
      <Helmet><title>{pageTitle('Topic Test')}</title></Helmet>
      
      {/* Top Navbar */}
      <div className="navbar">
        <div className="exam-nav-title">
          <span className="exam-nav-title__full">Topic Test — {selectedSubject?.toUpperCase()}</span>
          <span className="exam-nav-title__meta">{qCount} Q · Topic Wise</span>
        </div>
        <div id="timer-box" className={timer < 300 ? 'timer-urgent' : ''} style={{ color: timer < 300 ? '#ef4444' : 'inherit' }}>
          <Timer size={16} strokeWidth={2} />
          <span className="timer-label-full">Time Left </span>
          <strong>{formatTimer(timer)}</strong>
        </div>
      </div>

      <div className="main-layout">
        <div className="left-panel">
          <div className="section-bar">
            <span>Q{currentQuestionIdx + 1}/{qCount} · {selectedSubject || 'Topic'}</span>
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
                  <b>Q{currentQuestionIdx + 1}.</b>{' '}
                  <McqText text={activeQ.q} />
                </div>

                <div className="options-box" id="options-display-box">
                  {activeQ.o.map((opt, idx) => {
                    const isActive = selectedAnswers[currentQuestionIdx] === idx;
                    return (
                      <label 
                        key={`${currentQuestionIdx}-${idx}`} 
                        className={`opt-label ${isActive ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`opt-radio-${currentQuestionIdx}`}
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
              <div className="exam-initializing-overlay">
                <RefreshCw className="spin-icon spin-icon-blue" size={32} />
                <span className="exam-initializing-text">Initializing secure test environment...</span>
              </div>
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
              <button type="button" className="btn btn-save" onClick={saveAndNext}>
                <Save size={15} strokeWidth={2} />
                <span>Next</span>
              </button>
              <button type="button" className="btn btn-submit-section" onClick={submitExam}>
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
                <div className="exam-user-name">{user?.username || 'Guest User'}</div>
                <div className="exam-user-meta">
                  {qCount} Q · {Math.round(timer / 60)} min · Topic Wise
                </div>
              </div>
            </div>
            
            <div className="palette-header">
              Questions Palette
            </div>
            
            <div className="palette-grid" id="palette-box">
              {testQuestions.map((_, i) => {
                const status = questionStatuses[i] || 'not-visited';
                const isActive = i === currentQuestionIdx;
                return (
                  <button
                    key={i}
                    type="button"
                    id={`p-btn-${i}`}
                    className={`palette-btn ${status} ${isActive ? 'active-q' : ''}`}
                    onClick={() => goToQuestion(i)}
                  >
                    {i + 1}
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
              onClick={submitExam}
            >
              <Send size={15} strokeWidth={2} /> Submit
            </button>
            <button 
              type="button"
              className="btn btn-cancel-test" 
              onClick={() => setCancelConfirmOpen(true)}
            >
              <X size={15} strokeWidth={2} /> Cancel
            </button>
          </div>
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

      {/* --- CANCEL TEST CONFIRMATION MODAL --- */}
      {cancelConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-content-cancel">
            <div className="modal-header">
              <h3 className="modal-title-warning">
                <Activity size={20} color="#f59e0b" />
                Cancel Current Test?
              </h3>
              <button type="button" className="btn-close-modal" onClick={() => setCancelConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-cancel">
              <p className="modal-body-bold">Are you sure you want to cancel the topic test?</p>
              <p className="modal-body-sub">All your current progress and answered questions will be <strong>erased</strong>. This action cannot be undone.</p>
            </div>

            <div className="modal-actions-row">
              <button 
                type="button" 
                className="btn-cancel btn-cancel-flex"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Continue Test
              </button>
              <button 
                type="button" 
                className="btn-save-topic btn-confirm-flex" 
                onClick={() => {
                  setCancelConfirmOpen(false);
                  cancelTest();
                }}
              >
                <XCircle size={16} /> Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
