import { 
  Flame, 
  Zap, 
  Percent, 
  TrendingUp, 
  BookOpen, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Brain,
  FileText,
  Calculator,
  Cpu
} from 'lucide-react';
import '../../../pages/Dashboard.css';

export function DrillWorkspace({
  drillType,
  currentDrill,
  userAnswer,
  setUserAnswer,
  maxTableBase,
  setMaxTableBase,
  drillStats,
  drillFeedback,
  changeDrillType,
  submitDrillAnswer,
  skipDrillQuestion,
  loadNextDrill
}) {
  return (
    <div className="drill-workspace">
      <div className="workspace-header-sticky">
        <div className="section-header">
          <h1>Practice Speed Drills</h1>
          <p>Solve high-speed calculations and English vocab vocabulary drills.</p>
        </div>
        <div className="tabs-header">
          <div className="drill-tabs">
            <button
              className={`drill-tab ${drillType === 'table' ? 'active' : ''}`}
              onClick={() => changeDrillType('table')}
            >
              <Zap size={14} />
              <span>Jumping Tables</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'fraction' ? 'active' : ''}`}
              onClick={() => changeDrillType('fraction')}
            >
              <Percent size={14} />
              <span>Fraction to %</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'percentage' ? 'active' : ''}`}
              onClick={() => changeDrillType('percentage')}
            >
              <TrendingUp size={14} />
              <span>% to Fraction</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'square' ? 'active' : ''}`}
              onClick={() => changeDrillType('square')}
            >
              <Zap size={14} />
              <span>Square Speed</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'cube' ? 'active' : ''}`}
              onClick={() => changeDrillType('cube')}
            >
              <Zap size={14} />
              <span>Cube Speed</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'vocab' ? 'active' : ''}`}
              onClick={() => changeDrillType('vocab')}
            >
              <BookOpen size={14} />
              <span>Vocabulary Builder</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'gk' ? 'active' : ''}`}
              onClick={() => changeDrillType('gk')}
            >
              <Brain size={14} />
              <span>GK Blast</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'english-mcq' ? 'active' : ''}`}
              onClick={() => changeDrillType('english-mcq')}
            >
              <FileText size={14} />
              <span>English MCQ</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'maths-mcq' ? 'active' : ''}`}
              onClick={() => changeDrillType('maths-mcq')}
            >
              <Calculator size={14} />
              <span>Maths MCQ</span>
            </button>
            <button
              className={`drill-tab ${drillType === 'reasoning-mcq' ? 'active' : ''}`}
              onClick={() => changeDrillType('reasoning-mcq')}
            >
              <Cpu size={14} />
              <span>Reasoning MCQ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-scrollable-content">
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Attempts</span>
            <span className="stat-val">{drillStats.totalAsked}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Correct Answers</span>
            <span className="stat-val">{drillStats.score}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Incorrect / Skips</span>
            <span className="stat-val">{drillStats.totalAsked - drillStats.score}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Active Streak</span>
            <span className="stat-val streak-val">
              <Flame className="streak-icon" size={20} />
              {drillStats.streak}
            </span>
          </div>
        </div>

      {['table', 'square', 'cube'].includes(drillType) && (
        <div className="drill-config-card">
          <div className="config-label">
            <TrendingUp size={16} className="config-icon" />
            <span>
              {drillType === 'table' && 'Max Multiplication Base (Bases: 12 to 50, Multipliers: 2-9):'}
              {drillType === 'square' && 'Max Square Base (2 to 50):'}
              {drillType === 'cube' && 'Max Cube Base (2 to 50):'}
            </span>
          </div>
          <input
            type="number"
            min={drillType === 'table' ? 12 : 2}
            max="50"
            className="config-input"
            value={maxTableBase}
            onChange={(e) => {
              const minVal = drillType === 'table' ? 12 : 2;
              const val = Math.min(50, Math.max(minVal, parseInt(e.target.value, 10) || minVal));
              setMaxTableBase(val);
              loadNextDrill(drillType, val);
            }}
          />
        </div>
      )}

      {currentDrill ? (
        <div className="drill-card-viewport">
          <div className={`drill-interactive-card ${
            drillFeedback.isChecked 
              ? drillFeedback.isCorrect 
                ? 'correct' 
                : 'incorrect' 
              : ''
          }`}>
            <div className="card-heading">
              <h3>
                {drillType === 'table' && <><Zap size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> Jumping Tables Drill</>}
                {drillType === 'vocab' && <><BookOpen size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> Vocab Drill</>}
                {['fraction', 'percentage'].includes(drillType) && <><Percent size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> Value Conversion</>}
                {['square', 'cube'].includes(drillType) && <><Zap size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> Roots & Powers</>}
                {drillType === 'gk' && <><Brain size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> GK Blast — {currentDrill.category}</>}
                {drillType === 'english-mcq' && <><FileText size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> English MCQ — {currentDrill.category}</>}
                {drillType === 'maths-mcq' && <><Calculator size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> Maths MCQ — {currentDrill.category}</>}
                {drillType === 'reasoning-mcq' && <><Cpu size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> Reasoning MCQ — {currentDrill.category}</>}
              </h3>
              <p>Enter correct answer or select options.</p>
            </div>

            <div className={`question-text-box ${['gk', 'english-mcq', 'maths-mcq', 'reasoning-mcq'].includes(drillType) ? 'mcq-question-box' : ''}`}>
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
                    <CheckCircle size={18} />
                    <span>Correct answer registered! Streak increased.</span>
                  </div>
                ) : (
                  <div className="alert-message error drill-error-card">
                    <div className="drill-error-header">
                      <XCircle size={18} />
                      <span>Incorrect choice. Correct Key: <strong>{currentDrill.correctAnswer}</strong></span>
                    </div>
                    {drillType === 'vocab' && (
                      <div className="drill-error-vocab-details">
                        <div className="drill-error-vocab-row"><strong>Meaning:</strong> {currentDrill.revealDefinition}</div>
                        {currentDrill.revealSynonyms?.length > 0 && (
                          <div className="drill-error-vocab-row"><strong>Synonyms:</strong> {currentDrill.revealSynonyms.join(', ')}</div>
                        )}
                        {currentDrill.revealAntonyms?.length > 0 && (
                          <div className="drill-error-vocab-last-row"><strong>Antonyms:</strong> {currentDrill.revealAntonyms.join(', ')}</div>
                        )}
                      </div>
                    )}
                    {['gk', 'english-mcq', 'maths-mcq', 'reasoning-mcq'].includes(drillType) && currentDrill.explanation && (
                      <div className="drill-error-vocab-details">
                        <div className="drill-error-vocab-row"><strong>Explanation:</strong> {currentDrill.explanation}</div>
                      </div>
                    )}
                    <button 
                      className="btn btn-save btn-drill-next" 
                      onClick={() => loadNextDrill(drillType)}
                    >
                      Next Question ➔
                    </button>
                  </div>
                )}
                {drillFeedback.isCorrect && <span className="loader-next-text">Sourcing next question...</span>}
              </div>
            ) : (
              <form onSubmit={submitDrillAnswer} className="submit-form">
                {['vocab', 'gk', 'english-mcq', 'maths-mcq', 'reasoning-mcq'].includes(drillType) && currentDrill.options ? (
                  <div className="options-selector-grid">
                    {currentDrill.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="option-choice-btn"
                        onClick={() => submitDrillAnswer(null, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="input-row">
                    <input
                      type="text"
                      placeholder={currentDrill.placeholder}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="text-answer-input"
                      autoFocus
                    />
                  </div>
                )}

                <div className="action-row">
                  <button
                    type="button"
                    className="btn-skip"
                    onClick={skipDrillQuestion}
                  >
                    Skip Drill
                  </button>
                  {!['vocab', 'gk', 'english-mcq', 'maths-mcq', 'reasoning-mcq'].includes(drillType) && (
                    <button
                      type="submit"
                      disabled={!userAnswer.trim()}
                      className="btn-submit"
                    >
                      Verify Answer
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="loading-state">
          <RefreshCw className="spin-icon" size={32} />
          <p>Generating drill question...</p>
        </div>
      )}
      </div>
    </div>
  );
}
