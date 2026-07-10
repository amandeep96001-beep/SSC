import { Helmet } from 'react-helmet-async';
import { pageTitle } from '@/shared/brand';
import { RefreshCw, Activity, X, XCircle } from 'lucide-react';
import '@/features/dashboard/Dashboard.css';

export function ExamPortal({
  selectedSubject,
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
  const activeQ = testQuestions[currentQuestionIdx];

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `Time Remaining: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div id="exam-portal" className="no-select">
      <Helmet><title>{pageTitle('Topic Test')}</title></Helmet>
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
              <div className="exam-initializing-overlay">
                <RefreshCw className="spin-icon spin-icon-blue" size={32} />
                <span className="exam-initializing-text">Initializing secure test environment...</span>
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
                <div className="exam-user-name">{user.username}</div>
                <div className="exam-user-meta">25 Questions | 15 Mins</div>
              </div>
            </div>
            <div className="palette-header">
              Question Palette :
            </div>
            
            <div className="palette-grid" id="palette-box">
              {testQuestions.map((_, i) => {
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

            {testQuestions.length > 0 && testQuestions.length < 25 && (
              <div className="palette-warning">
                <strong>Note:</strong> Only {testQuestions.length} questions available. Add more MCQs to this topic to simulate a full 25-Q mock test.
              </div>
            )}
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
                <span className="dot dot-yellow"></span> Marked for Review
              </div>
            </div>
            <button 
              className="btn btn-submit-section" 
              onClick={submitExam}
            >
              Submit Section
            </button>
            <button 
              className="btn btn-cancel-test" 
              onClick={() => setCancelConfirmOpen(true)}
            >
              ✕ Cancel Test
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
                Cancel Current Test?
              </h3>
              <button className="btn-close-modal" onClick={() => setCancelConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-cancel">
              <p className="modal-body-bold">Are you sure you want to cancel the mock test?</p>
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
