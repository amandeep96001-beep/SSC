import { Helmet } from 'react-helmet-async';
import { pageTitle } from '@/shared/brand';
import { ArrowLeft, RotateCcw, Copy, Zap } from 'lucide-react';
import { McqText } from '@/shared/components/ui/McqText';
import { showAppToast } from '@/shared/utils/appToast';
import '@/features/dashboard/Dashboard.css';
import '@/features/exam/exam.css';

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
      const qLabel = testQuestions?.length || 0;
      showAppToast(`${qLabel}-Q error log copied.`, { variant: 'success', durationMs: 2200 });
    }
  };

  const isMock = testSummary?.isMock;
  const qCount = testQuestions?.length || 0;

  return (
    <div className="results-container results-portal-visible" id="results-portal">
      <Helmet><title>{pageTitle('Results')}</title></Helmet>
      <div className="score-box">
        <h2 style={{ marginBottom: '8px', color: '#fafafa', fontWeight: 600, letterSpacing: '-0.02em' }}>Performance Assessment Summary</h2>
        <p>Your final official calculation sheet:</p>
        <div className="score-num" id="final-marks">{testSummary?.score} / {testSummary?.maxScore || 50}</div>
        
        <div style={{ background: 'var(--bg-surface)', padding: '15px 25px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'inline-block', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-primary)', fontSize: '1.2rem' }}>Total Time Taken: {testSummary?.elapsedTime || 'N/A'}</h4>
            <p className="results-summary-subtitle" style={{ margin: 0, fontSize: '0.95rem' }}>
              Correct: <span style={{color: '#10b981'}}>{testSummary?.correct}</span> | Wrong: <span style={{color: '#ef4444'}}>{testSummary?.wrong}</span> | Blank: {testSummary?.blank}
            </p>
        </div>

        {testSummary?.sectionTimes && (
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            {Object.entries(testSummary.sectionTimes).map(([sec, secs]) => (
              <div key={sec} style={{ background: '#1e293b', padding: '10px 15px', borderRadius: '8px', border: '1px solid #334155', minWidth: '100px' }}>
                <div style={{ color: '#94a3b8', marginBottom: '4px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sec}</div>
                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{Math.floor(secs / 60)}m {secs % 60}s</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="results-error-log-banner">
        <span className="results-error-log-title">
          Complete {qCount}-Question Error Log:
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
          <Copy size={15} strokeWidth={2} /> Copy Full Error Log
        </button>
      </div>

      <h3>Exhaustive Post-Mortem & Explanation Breakdown</h3>
      <div id="full-review-box">
        {testQuestions && testQuestions.map((item, idx) => {
          const userAns = selectedAnswers ? selectedAnswers[idx] : null;
          const correctAns = item.a;
          const isCorrect = userAns === correctAns;
          const userText = userAns !== null && userAns !== undefined ? item.o[userAns] : "Left Unattempted";
          const correctText = item.o[correctAns];

          return (
            <div 
              key={idx} 
              className={`review-card ${userAns === null || userAns === undefined ? '' : (isCorrect ? 'correct' : 'wrong')}`}
            >
              <h4>Q{idx + 1}. <McqText text={item.q} /></h4>
              {item.state && (
                <p className="review-state-link">
                  Hidden State Link: {item.state}
                </p>
              )}
              {item.section && (
                <p className="review-state-link" style={{ background: '#3b82f6', color: '#fff', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '8px' }}>
                  Section: {item.section}
                </p>
              )}
              <p style={{ margin: '8px 0', color: userAns === null || userAns === undefined ? '#7f8c8d' : (isCorrect ? '#2ecc71' : '#e74c3c') }}>
                <b>Your Choice:</b> <McqText text={userText} />
              </p>
              <p className="review-official-key">
                <b>Official answer key:</b> <McqText text={correctText} />
              </p>
              <div className="review-core-logic">
                <b>Official Core Logic:</b> <McqText text={item.e} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="results-actions-row">
        {isMock ? (
          <>
            <button className="btn btn-save" onClick={() => setActiveView('mock')}>
              <ArrowLeft size={16} strokeWidth={2} /> Back to Mock Exams
            </button>
            <button className="btn btn-clear btn-outline" onClick={() => setActiveView('drill')}>
              <Zap size={16} strokeWidth={2} /> Back to Drills
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-save" onClick={startTest}>
              <RotateCcw size={16} strokeWidth={2} /> Retake Topic Test
            </button>
            <button className="btn btn-clear btn-outline" onClick={() => setActiveView('topics')}>
              <ArrowLeft size={16} strokeWidth={2} /> Back to Topics
            </button>
            <button className="btn btn-clear btn-outline" onClick={() => setActiveView('drill')}>
              <Zap size={16} strokeWidth={2} /> Back to Drills
            </button>
          </>
        )}
      </div>
    </div>
  );
}
