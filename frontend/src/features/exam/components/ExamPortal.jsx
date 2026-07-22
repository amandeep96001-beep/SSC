import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { pageTitle } from '@/shared/brand';
import { RefreshCw, Activity, X, XCircle, Flag, Eraser, Save, Send, Timer, LayoutGrid } from 'lucide-react';
import { McqText } from '@/shared/components/ui/McqText';
import '@/features/dashboard/Dashboard.css';
import '@/features/study/study.css';
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
  const activeQ = testQuestions[currentQuestionIdx];
  const qCount = testQuestions?.length || 0;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `Time Remaining: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const goToQuestion = (i) => {
    jumpToQuestion(i);
    setPaletteOpen(false);
  };

  return (
    <div id="exam-portal" className="no-select">
      <Helmet><title>{pageTitle('Topic Test')}</title></Helmet>
      <div className="navbar">
        <div>TOPIC TEST — {selectedSubject?.toUpperCase()}</div>
        <div id="timer-box"><Timer size={16} strokeWidth={2} /> {formatTimer(timer)}</div>
      </div>

      <div className="main-layout">
        <div className="left-panel">
          <div className="section-bar">
            <span>
              Q{currentQuestionIdx + 1}/{qCount} · {selectedSubject || 'Topic'}
              {activeNotes?.name ? ` · ${activeNotes.name}` : ''}
            </span>
            <button
              type="button"
              className="exam-palette-toggle"
              onClick={() => setPaletteOpen(true)}
              aria-expanded={paletteOpen}
            >
              <LayoutGrid size={15} strokeWidth={2} />
              Palette
            </button>
          </div>
          
          <div className="question-area">
            <div className="direction" id="q-direction">
              Direction: Choose the correct option.
            </div>

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
                        key={idx} 
                        className={`opt-label ${isActive ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`opt-radio-${currentQuestionIdx}`}
                          checked={isActive}
                          onChange={() => selectOptionValue(idx)}
                        />
                        <McqText text={opt} />
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
            <div>
              <button type="button" className="btn btn-review" onClick={markForReview}>
                <Flag size={15} strokeWidth={2} /> Mark for Review & Next
              </button>
              <button type="button" className="btn btn-clear" onClick={clearResponse}>
                <Eraser size={15} strokeWidth={2} /> Clear Response
              </button>
            </div>
            <button type="button" className="btn btn-save" onClick={saveAndNext}>
              <Save size={15} strokeWidth={2} /> Save & Next
            </button>
          </div>
        </div>

        <div className={`right-panel${paletteOpen ? ' is-open' : ''}`}>
          <div className="exam-palette-sheet-head">
            <strong>Question palette</strong>
            <button
              type="button"
              className="exam-palette-close"
              onClick={() => setPaletteOpen(false)}
              aria-label="Close palette"
            >
              <X size={18} />
            </button>
          </div>

          <div className="exam-palette-body">
            <div className="user-profile">
              <div className="avatar">{user?.username?.slice(0, 2).toUpperCase() || 'US'}</div>
              <div>
                <div className="exam-user-name">{user?.username || 'Student'}</div>
                <div className="exam-user-meta">{qCount} Questions · 15 Mins</div>
              </div>
            </div>
            <div className="palette-header">
              Question Palette
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
                    className={`palette-btn ${status}${isActive ? ' active-q' : ''}`}
                    onClick={() => goToQuestion(i)}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {qCount > 0 && qCount < 25 && (
              <div className="palette-warning">
                <strong>Note:</strong> Only {qCount} questions available. Add more MCQs to this topic to simulate a full 25-Q mock test.
              </div>
            )}

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
                <span className="dot dot-yellow"></span> Marked for Review
              </div>
            </div>
          </div>

          <div className="exam-palette-actions">
            <button 
              type="button"
              className="btn btn-submit-section" 
              onClick={submitExam}
            >
              <Send size={15} strokeWidth={2} /> Submit Section
            </button>
            <button 
              type="button"
              className="btn btn-cancel-test" 
              onClick={() => setCancelConfirmOpen(true)}
            >
              <X size={15} strokeWidth={2} /> Cancel Test
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
