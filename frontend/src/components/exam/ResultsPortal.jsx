import React from 'react';
import { Helmet } from 'react-helmet-async';
import '../../pages/Dashboard.css';

export function ResultsPortal({
  testSummary,
  testQuestions,
  selectedAnswers,
  startTest,
  setActiveView
}) {

  const copyErrorLog = () => {
    if (testSummary && testSummary.errorLog) {
      navigator.clipboard.writeText(testSummary.errorLog);
      alert("📋 Full 25-Q Error Log safely copy ho gaya hai bhai!");
    }
  };

  return (
    <div className="results-container results-portal-visible" id="results-portal">
      <Helmet><title>Test Results | SSC Speed Engine</title></Helmet>
      <div className="score-box">
        <h2>Performance Assessment Summary</h2>
        <p>Bhai, tera final official calculations sheet:</p>
        <div className="score-num" id="final-marks">{testSummary?.score} / 50</div>
        <p className="results-summary-subtitle" id="time-taken-summary">
          {testSummary?.summaryText}
        </p>
      </div>

      <div className="results-error-log-banner">
        <span className="results-error-log-title">
          Complete 25-Question Error Log (Paste directly in chat):
        </span>
        <textarea 
          id="error-log-box" 
          value={testSummary?.errorLog || ''} 
          readOnly 
          className="results-error-log-textarea"
        />
        <button 
          className="btn btn-clear btn-copy-log" 
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
                <p className="review-state-link">
                  Hidden State Link: {item.state}
                </p>
              )}
              <p style={{ margin: '8px 0', color: userAns === null ? '#7f8c8d' : (isCorrect ? '#2ecc71' : '#e74c3c') }}>
                <b>Your Choice:</b> {userText}
              </p>
              <p className="review-official-key">
                <b>Official TCS Key:</b> {correctText}
              </p>
              <div className="review-core-logic">
                <b>Official Core Logic:</b> {item.e}
              </div>
            </div>
          );
        })}
      </div>

      <div className="results-actions-row">
        <button className="btn btn-save" onClick={startTest}>
          Retake Mock Test
        </button>
        <button className="btn btn-clear btn-outline" onClick={() => setActiveView('topics')}>
          Back to Topics
        </button>
        <button className="btn btn-clear btn-outline" onClick={() => setActiveView('drill')}>
          Back to Drills
        </button>
      </div>
    </div>
  );
}
