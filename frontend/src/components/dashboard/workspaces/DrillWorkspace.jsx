import { useState, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import {
  Flame, Zap, Percent, TrendingUp, BookOpen,
  CheckCircle, XCircle, RefreshCw, Brain, FileText,
  Calculator, Cpu, AlertTriangle, Trash2, Sparkles,
  ChevronDown, ChevronUp, Loader2, RotateCcw, Send
} from 'lucide-react';
import '../../../pages/Dashboard.css';

// ── Markdown Formatter ────────────────────────────────────────────────────────
const formatAIText = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={i} style={{ display: 'block', marginBottom: '6px' }}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} style={{ color: '#f8fafc' }}>{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </span>
    );
  });
};

// ── Re-Attempt + AI Card ──────────────────────────────────────────────────────
function WrongQuestionCard({ wq }) {
  const [aiText, setAiText]       = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState('');
  const [aiOpen, setAiOpen]       = useState(false);

  // Re-attempt state
  const [attempting, setAttempting] = useState(false);
  const [retryAnswer, setRetryAnswer] = useState('');
  const [retryResult, setRetryResult] = useState(null); // null | 'correct' | 'wrong'

  const isMCQ = Array.isArray(wq.options) && wq.options.length > 0;

  const handleAI = useCallback(async () => {
    if (aiText) { setAiOpen(o => !o); return; }
    setAiLoading(true); setAiError(''); setAiOpen(true);
    try {
      const res = await apiService.post('/ai/explain', {
        question: wq.question,
        correctAnswer: wq.correctAnswer,
        explanation: wq.explanation
      });
      setAiText(res.data?.explanation || 'No explanation returned.');
    } catch { setAiError('AI service is currently unavailable. Please try again.'); }
    finally { setAiLoading(false); }
  }, [aiText, wq]);

  const handleRetrySubmit = useCallback((chosen) => {
    const ans = (chosen ?? retryAnswer);
    if (!ans?.trim()) return;
    const clean = s => s.toString().trim().toLowerCase().replace('%', '');
    const correct = clean(ans) === clean(wq.correctAnswer);
    setRetryResult(correct ? 'correct' : 'wrong');
    if (correct) setAttempting(false);
  }, [retryAnswer, wq.correctAnswer]);

  const resetRetry = () => { setRetryAnswer(''); setRetryResult(null); setAttempting(false); };

  return (
    <div className={`wrong-q-card ${wq.wrongCount >= 3 ? 'wrong-q-card--danger' : wq.wrongCount >= 2 ? 'wrong-q-card--warn' : ''}`}>

      {/* Header */}
      <div className="wrong-q-header">
        <div className="wrong-q-meta">
          {wq.category && <span className="wrong-q-category">{wq.category}</span>}
          <span className="wrong-q-type">{wq.type?.replace('-mcq', ' MCQ')}</span>
        </div>
        <div className={`wrong-q-count-badge ${wq.wrongCount >= 3 ? 'badge-danger' : wq.wrongCount >= 2 ? 'badge-warn' : 'badge-default'}`}>
          <AlertTriangle size={11} /> {wq.wrongCount}× incorrect
        </div>
      </div>

      {/* Question */}
      <p className="wrong-q-question">{wq.question}</p>

      {/* Correct answer */}
      <div className="wrong-q-answer-row">
        <CheckCircle size={14} className="wrong-q-correct-icon" />
        <span>Correct Answer: <strong>{wq.correctAnswer}</strong></span>
      </div>

      {/* Official explanation */}
      {wq.explanation && <div className="wrong-q-hint">{wq.explanation}</div>}

      {/* ── RE-ATTEMPT SECTION ───────────────────────────────────────────── */}
      {!attempting && retryResult !== 'correct' && (
        <button className="btn-retry-attempt" onClick={() => { setAttempting(true); setRetryResult(null); setRetryAnswer(''); }}>
          <RotateCcw size={14} /> Attempt Again
        </button>
      )}

      {attempting && (
        <div className="retry-attempt-box">
          <p className="retry-label">🎯 Try Again:</p>
          {isMCQ ? (
            <div className="retry-options-grid">
              {wq.options.map((opt) => (
                <button
                  key={opt}
                  className={`retry-option-btn ${retryResult && opt === wq.correctAnswer ? 'retry-opt-correct' : retryResult === 'wrong' && opt === retryAnswer ? 'retry-opt-wrong' : ''}`}
                  onClick={() => handleRetrySubmit(opt)}
                  disabled={!!retryResult}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="retry-input-row">
              <input
                type="text"
                className="retry-text-input"
                placeholder={wq.placeholder || 'Enter your answer...'}
                value={retryAnswer}
                onChange={e => setRetryAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRetrySubmit()}
                autoFocus
              />
              <button className="btn-retry-submit" onClick={() => handleRetrySubmit()} disabled={!retryAnswer.trim()}>
                <Send size={14} />
              </button>
            </div>
          )}

          {retryResult === 'wrong' && (
            <div className="retry-feedback retry-feedback--wrong">
              <XCircle size={14} /> Incorrect again. Correct Answer: <strong>{wq.correctAnswer}</strong>
              <button className="retry-reset-link" onClick={resetRetry}>Reset</button>
            </div>
          )}
          {retryResult === 'correct' && (
            <div className="retry-feedback retry-feedback--correct">
              <CheckCircle size={14} /> Correct! Well done! 🎉
            </div>
          )}
        </div>
      )}

      {retryResult === 'correct' && (
        <div className="retry-success-row">
          <CheckCircle size={16} className="wrong-q-correct-icon" />
          <span>Answered correctly this time!</span>
          <button className="retry-reset-link" onClick={resetRetry}>Try Again</button>
        </div>
      )}

      {/* ── AI FULL CONCEPT ──────────────────────────────────────────────── */}
      <button className="btn-ai-explain" onClick={handleAI} disabled={aiLoading}>
        {aiLoading
          ? <><Loader2 size={14} className="spin-inline" /> Generating AI Concept...</>
          : aiText
            ? <>{aiOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} AI Concept {aiOpen ? 'Hide' : 'View'}</>
            : <><Sparkles size={14} /> Explain Full Concept with AI</>
        }
      </button>

      {aiOpen && (
        <div className="ai-explanation-panel">
          {aiLoading && (
            <div className="ai-loading-row">
              <Loader2 size={16} className="spin-inline" />
              <span>Generating detailed concept via Pollinations AI...</span>
            </div>
          )}
          {aiError && <p className="ai-error-text">{aiError}</p>}
          {aiText && !aiLoading && (
            <div className="ai-response-text" style={{ lineHeight: '1.5', fontSize: '0.9rem', color: '#e2e8f0' }}>
              <div className="ai-response-badge" style={{ marginBottom: '12px' }}><Sparkles size={12} /> AI — Full Concept Explanation</div>
              <div>{formatAIText(aiText)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main DrillWorkspace ───────────────────────────────────────────────────────
const MCQ_TYPES = ['vocab', 'gk', 'english-mcq', 'maths-mcq', 'reasoning-mcq'];

export function DrillWorkspace({
  drillType, currentDrill, userAnswer, setUserAnswer,
  maxTableBase, setMaxTableBase, drillStats, drillFeedback,
  wrongQuestions, clearWrongLog,
  changeDrillType, submitDrillAnswer, skipDrillQuestion, loadNextDrill
}) {
  const [activeTab, setActiveTab] = useState('drill');

  const switchDrill = (type) => { setActiveTab('drill'); changeDrillType(type); };

  const TABS = [
    { key: 'table',         label: 'Jumping Tables',   Icon: Zap },
    { key: 'fraction',      label: 'Fraction to %',    Icon: Percent },
    { key: 'percentage',    label: '% to Fraction',    Icon: TrendingUp },
    { key: 'square',        label: 'Square Speed',     Icon: Zap },
    { key: 'cube',          label: 'Cube Speed',       Icon: Zap },
    { key: 'vocab',         label: 'Vocabulary',       Icon: BookOpen },
    { key: 'gk',            label: 'GK Quiz',          Icon: Brain },
    { key: 'english-mcq',   label: 'English MCQ',      Icon: FileText },
    { key: 'maths-mcq',     label: 'Maths MCQ',        Icon: Calculator },
    { key: 'reasoning-mcq', label: 'Reasoning MCQ',    Icon: Cpu },
  ];

  return (
    <div className="drill-workspace">
      <div className="workspace-header-sticky">
        <div className="section-header">
          <h1>Practice Speed Drills</h1>
          <p>Solve high-speed calculations and English vocab vocabulary drills.</p>
        </div>
        <div className="tabs-header">
          <div className="drill-tabs">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`drill-tab ${activeTab === 'drill' && drillType === key ? 'active' : ''}`}
                onClick={() => switchDrill(key)}
              >
                <Icon size={14} /><span>{label}</span>
              </button>
            ))}
            <button
              className={`drill-tab drill-tab--wronglog ${activeTab === 'wronglog' ? 'active' : ''}`}
              onClick={() => setActiveTab('wronglog')}
            >
              <AlertTriangle size={14} />
              <span>Wrong Questions</span>
              {wrongQuestions.length > 0 && (
                <span className="wrong-tab-pill">{wrongQuestions.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-scrollable-content">
        {/* Stats row — always visible */}
        <div className="stats-row">
          <div className="stat-box"><span className="stat-label">Total Attempts</span><span className="stat-val">{drillStats.totalAsked}</span></div>
          <div className="stat-box"><span className="stat-label">Correct Answers</span><span className="stat-val">{drillStats.score}</span></div>
          <div className="stat-box"><span className="stat-label">Incorrect / Skips</span><span className="stat-val">{drillStats.totalAsked - drillStats.score}</span></div>
          <div className="stat-box"><span className="stat-label">Streak</span><span className="stat-val streak-val"><Flame className="streak-icon" size={20} />{drillStats.streak}</span></div>
        </div>

        {/* ═══ TAB: DRILL ═══════════════════════════════════════════════════ */}
        {activeTab === 'drill' && (
          <>
            {['table', 'square', 'cube'].includes(drillType) && (
              <div className="drill-config-card">
                <div className="config-label">
                  <TrendingUp size={16} className="config-icon" />
                  <span>
                    {drillType === 'table' && 'Max Multiplication Base (12–50):'}
                    {drillType === 'square' && 'Max Square Base (2–50):'}
                    {drillType === 'cube' && 'Max Cube Base (2–50):'}
                  </span>
                </div>
                <input type="number" min={drillType === 'table' ? 12 : 2} max="50"
                  className="config-input" value={maxTableBase}
                  onChange={e => {
                    const min = drillType === 'table' ? 12 : 2;
                    const v = Math.min(50, Math.max(min, parseInt(e.target.value, 10) || min));
                    setMaxTableBase(v); loadNextDrill(drillType, v);
                  }} />
              </div>
            )}

            {currentDrill ? (
              <div className="drill-card-viewport">
                <div className={`drill-interactive-card ${drillFeedback.isChecked ? drillFeedback.isCorrect ? 'correct' : 'incorrect' : ''}`}>
                  <div className="card-heading">
                    <h3>
                      {drillType === 'table'         && <><Zap size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> Jumping Tables Drill</>}
                      {drillType === 'vocab'         && <><BookOpen size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> Vocab Drill</>}
                      {['fraction','percentage'].includes(drillType) && <><Percent size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> Value Conversion</>}
                      {['square','cube'].includes(drillType)         && <><Zap size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> Roots &amp; Powers</>}
                      {drillType === 'gk'            && <><Brain size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> GK Blast — {currentDrill.category}</>}
                      {drillType === 'english-mcq'   && <><FileText size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> English MCQ — {currentDrill.category}</>}
                      {drillType === 'maths-mcq'     && <><Calculator size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> Maths MCQ — {currentDrill.category}</>}
                      {drillType === 'reasoning-mcq' && <><Cpu size={18} style={{verticalAlign:'text-bottom',marginRight:'6px'}} /> Reasoning MCQ — {currentDrill.category}</>}
                    </h3>
                    <p>Enter correct answer or select options.</p>
                  </div>

                  <div className={`question-text-box ${MCQ_TYPES.includes(drillType) ? 'mcq-question-box' : ''}`}>
                    <h2>{currentDrill.question}</h2>
                    {drillType === 'vocab' && currentDrill.definition && (
                      <div className="pos-definition">
                        <span className="pos-badge">{currentDrill.pos}</span>
                        <p>"{currentDrill.definition}"</p>
                      </div>
                    )}
                  </div>

                  {drillFeedback.isChecked ? (
                    <div className="feedback-result">
                      {drillFeedback.isCorrect ? (
                        <div className="alert-message success">
                          <CheckCircle size={18} /><span>Correct! Streak increased.</span>
                        </div>
                      ) : (
                        <div className="alert-message error drill-error-card">
                          <div className="drill-error-header">
                            <XCircle size={18} />
                            <span>Incorrect. Correct Key: <strong>{currentDrill.correctAnswer}</strong></span>
                          </div>
                          {drillType === 'vocab' && (
                            <div className="drill-error-vocab-details">
                              <div className="drill-error-vocab-row"><strong>Meaning:</strong> {currentDrill.revealDefinition}</div>
                              {currentDrill.revealSynonyms?.length > 0 && <div className="drill-error-vocab-row"><strong>Synonyms:</strong> {currentDrill.revealSynonyms.join(', ')}</div>}
                              {currentDrill.revealAntonyms?.length > 0 && <div className="drill-error-vocab-last-row"><strong>Antonyms:</strong> {currentDrill.revealAntonyms.join(', ')}</div>}
                            </div>
                          )}
                          {MCQ_TYPES.includes(drillType) && currentDrill.explanation && (
                            <div className="drill-error-vocab-details">
                              <div className="drill-error-vocab-row"><strong>Explanation:</strong> {currentDrill.explanation}</div>
                            </div>
                          )}
                          <button className="btn btn-save btn-drill-next" onClick={() => loadNextDrill(drillType)}>Next Question ➔</button>
                        </div>
                      )}
                      {drillFeedback.isCorrect && <span className="loader-next-text">Sourcing next question...</span>}
                    </div>
                  ) : (
                    <form onSubmit={submitDrillAnswer} className="submit-form">
                      {MCQ_TYPES.includes(drillType) && currentDrill.options ? (
                        <div className="options-selector-grid">
                          {currentDrill.options.map(opt => (
                            <button key={opt} type="button" className="option-choice-btn" onClick={() => submitDrillAnswer(null, opt)}>{opt}</button>
                          ))}
                        </div>
                      ) : (
                        <div className="input-row">
                          <input type="text" placeholder={currentDrill.placeholder} value={userAnswer}
                            onChange={e => setUserAnswer(e.target.value)} className="text-answer-input" autoFocus />
                        </div>
                      )}
                      <div className="action-row">
                        <button type="button" className="btn-skip" onClick={skipDrillQuestion}>Skip Drill</button>
                        {!MCQ_TYPES.includes(drillType) && (
                          <button type="submit" disabled={!userAnswer.trim()} className="btn-submit">Verify Answer</button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="loading-state">
                <RefreshCw className="spin-icon" size={32} /><p>Generating drill question...</p>
              </div>
            )}
          </>
        )}

        {/* ═══ TAB: WRONG QUESTIONS LOG ════════════════════════════════════ */}
        {activeTab === 'wronglog' && (
          <div className="wrong-log-section">
            <div className="wrong-log-header">
              <div className="wrong-log-title-group">
                <AlertTriangle size={20} className="wrong-log-icon" />
                <div>
                  <h2 className="wrong-log-title">Wrong Questions Log</h2>
                  <p className="wrong-log-subtitle">
                    {wrongQuestions.length === 0
                      ? 'No incorrect answers yet — great work!'
                      : `${wrongQuestions.length} unique question${wrongQuestions.length > 1 ? 's' : ''} answered incorrectly — review and re-attempt below`}
                  </p>
                </div>
              </div>
              {wrongQuestions.length > 0 && (
                <button className="btn-clear-wrong-log" onClick={clearWrongLog}>
                  <Trash2 size={14} /> Clear Log
                </button>
              )}
            </div>

            {wrongQuestions.length === 0 ? (
              <div className="wrong-log-empty">
                <CheckCircle size={48} className="wrong-log-empty-icon" />
                <h3>All Correct!</h3>
                <p>No incorrect answers this session — keep drilling!</p>
              </div>
            ) : (
              <div className="wrong-q-list">
                {wrongQuestions.map((wq, idx) => (
                  <WrongQuestionCard key={`${wq.question}-${idx}`} wq={wq} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
