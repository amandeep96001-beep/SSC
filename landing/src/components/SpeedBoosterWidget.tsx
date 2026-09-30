import { useState, useEffect } from 'react';
import { Zap, CheckCircle2, XCircle, RotateCcw, ArrowRight, Award } from 'lucide-react';

interface SpeedBoosterProps {
  onGoToDashboard: () => void;
}

type DrillMode = 'tables' | 'fractions' | 'squares';

interface Question {
  prompt: string;
  options: string[];
  correct: string;
  hint: string;
}

const DRILL_QUESTIONS: Record<DrillMode, Question[]> = {
  tables: [
    { prompt: '19 × 7 = ?', options: ['123', '133', '143', '137'], correct: '133', hint: '19 × 7 = (20 - 1) × 7 = 140 - 7 = 133' },
    { prompt: '23 × 6 = ?', options: ['128', '132', '138', '144'], correct: '138', hint: '23 × 6 = (20 × 6) + (3 × 6) = 120 + 18 = 138' },
    { prompt: '17 × 9 = ?', options: ['143', '153', '163', '157'], correct: '153', hint: '17 × 9 = 170 - 17 = 153' },
    { prompt: '28 × 4 = ?', options: ['108', '112', '114', '118'], correct: '112', hint: '28 × 4 = (30 - 2) × 4 = 120 - 8 = 112' },
    { prompt: '37 × 3 = ?', options: ['101', '109', '111', '121'], correct: '111', hint: '37 × 3 = 111 (frequently asked in SSC Mensuration)' },
  ],
  fractions: [
    { prompt: '1/7 as Percentage = ?', options: ['12.5%', '14.28%', '16.66%', '13.33%'], correct: '14.28%', hint: '1/7 = 14.28% (or 14 2/7%) — high repeating in SSC Profit & Loss' },
    { prompt: '3/8 as Percentage = ?', options: ['32.5%', '35.0%', '37.5%', '40.0%'], correct: '37.5%', hint: '1/8 = 12.5%, so 3/8 = 3 × 12.5% = 37.5%' },
    { prompt: '1/13 as Percentage = ?', options: ['7.69%', '8.33%', '6.25%', '9.09%'], correct: '7.69%', hint: '1/13 = 7.69% (or 7 9/13%) — crucial for SSC CGL Tier 2' },
    { prompt: '5/6 as Percentage = ?', options: ['78.5%', '81.25%', '83.33%', '85.0%'], correct: '83.33%', hint: '5/6 = 1 - 1/6 = 100% - 16.66% = 83.33%' },
    { prompt: '1/14 as Percentage = ?', options: ['6.66%', '7.14%', '7.69%', '8.14%'], correct: '7.14%', hint: '1/14 = (1/7) / 2 = 14.28% / 2 = 7.14%' },
  ],
  squares: [
    { prompt: '24² = ?', options: ['526', '576', '596', '616'], correct: '576', hint: '24² = 576 (High repeating in Pythagorean triples: 10, 24, 26)' },
    { prompt: '29² = ?', options: ['781', '821', '841', '861'], correct: '841', hint: '29² = (30 - 1)² = 900 - 60 + 1 = 841' },
    { prompt: '32² = ?', options: ['984', '1024', '1044', '1084'], correct: '1024', hint: '32² = 2¹⁰ = 1024' },
    { prompt: '13³ = ?', options: ['2187', '2197', '2287', '2397'], correct: '2197', hint: '13³ = 2197 — essential for SSC CGL Compound Interest' },
    { prompt: '14³ = ?', options: ['2744', '2644', '2844', '2944'], correct: '2744', hint: '14³ = 2744' },
  ],
};

export function SpeedBoosterWidget({ onGoToDashboard }: SpeedBoosterProps) {
  const [mode, setMode] = useState<DrillMode>('tables');
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState<number>(0);

  const currentQuestions = DRILL_QUESTIONS[mode];
  const currentQ = currentQuestions[qIndex];

  useEffect(() => {
    // Reset state on mode change
    setQIndex(0);
    setSelectedOpt(null);
    setScore(0);
    setIsFinished(false);
    setStartTime(Date.now());
  }, [mode]);

  const handleSelect = (opt: string) => {
    if (selectedOpt !== null || isFinished) return;
    setSelectedOpt(opt);
    const isCorrect = opt === currentQ.correct;
    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      if (qIndex + 1 < currentQuestions.length) {
        setQIndex((i) => i + 1);
        setSelectedOpt(null);
      } else {
        const totalSecs = Math.round((Date.now() - startTime) / 1000);
        setTimeTaken(totalSecs);
        setIsFinished(true);
      }
    }, 900);
  };

  const handleRestart = () => {
    setQIndex(0);
    setSelectedOpt(null);
    setScore(0);
    setIsFinished(false);
    setStartTime(Date.now());
  };

  return (
    <div className="lp-speed-widget" id="speed-drill-tool">
      <div className="lp-speed-header">
        <div className="lp-speed-tag">
          <Zap size={14} className="lp-bolt-icon" />
          <span>SSC Speed Math Challenge • 10-Second Test</span>
        </div>
        <h3 className="lp-speed-title">
          Test Your Calculation Speed (TCS Pattern)
        </h3>
        <p className="lp-speed-desc">
          SSC CGL toppers solve Quant questions in <strong>22 seconds</strong> using direct table, square & fraction recall. Can you beat the average score?
        </p>

        {/* Mode Tabs */}
        <div className="lp-speed-modes" role="tablist" aria-label="Speed Drill Modes">
          <button
            type="button"
            className={`lp-speed-mode-btn ${mode === 'tables' ? 'is-active' : ''}`}
            onClick={() => setMode('tables')}
          >
            Multiplication Tables (1-50)
          </button>
          <button
            type="button"
            className={`lp-speed-mode-btn ${mode === 'fractions' ? 'is-active' : ''}`}
            onClick={() => setMode('fractions')}
          >
            Fraction to % Conversion
          </button>
          <button
            type="button"
            className={`lp-speed-mode-btn ${mode === 'squares' ? 'is-active' : ''}`}
            onClick={() => setMode('squares')}
          >
            Squares & Cubes
          </button>
        </div>
      </div>

      <div className="lp-speed-card">
        {!isFinished ? (
          <>
            <div className="lp-speed-card-top">
              <span className="lp-speed-counter">
                Question {qIndex + 1} of {currentQuestions.length}
              </span>
              <span className="lp-speed-score-pill">
                Score: {score}/{currentQuestions.length}
              </span>
            </div>

            <div className="lp-speed-prompt">
              <span className="lp-speed-math-text">{currentQ.prompt}</span>
            </div>

            <div className="lp-speed-grid">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOpt === opt;
                const isCorrect = opt === currentQ.correct;
                let btnClass = 'lp-speed-opt';

                if (selectedOpt !== null) {
                  if (isCorrect) btnClass += ' is-correct';
                  else if (isSelected) btnClass += ' is-wrong';
                  else btnClass += ' is-dimmed';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    className={btnClass}
                    onClick={() => handleSelect(opt)}
                    disabled={selectedOpt !== null}
                  >
                    <span>{opt}</span>
                    {selectedOpt !== null && isCorrect && <CheckCircle2 size={16} className="lp-opt-icon green" />}
                    {selectedOpt !== null && isSelected && !isCorrect && <XCircle size={16} className="lp-opt-icon red" />}
                  </button>
                );
              })}
            </div>

            {selectedOpt !== null && (
              <div className="lp-speed-hint">
                <span className="lp-hint-badge">💡 Topper Shortcut:</span>
                <span>{currentQ.hint}</span>
              </div>
            )}
          </>
        ) : (
          <div className="lp-speed-result">
            <div className="lp-result-icon-wrap">
              <Award size={36} className="lp-award-icon" />
            </div>
            <h4 className="lp-result-heading">
              {score >= 4 ? '🔥 Superfast! You are in Top 5% Aspirants!' : '⚡ Good Effort! Room to Boost Speed by 35%'}
            </h4>
            <p className="lp-result-summary">
              You scored <strong>{score} / {currentQuestions.length}</strong> in <strong>{timeTaken} seconds</strong> (avg {(timeTaken / 5).toFixed(1)}s per question).
            </p>

            <div className="lp-result-comparison">
              <div className="lp-comp-item">
                <span className="lp-comp-lbl">Your Speed:</span>
                <span className="lp-comp-val green">{(timeTaken / 5).toFixed(1)}s / Q</span>
              </div>
              <div className="lp-comp-item">
                <span className="lp-comp-lbl">SSC CGL Average:</span>
                <span className="lp-comp-val">4.5s / Q</span>
              </div>
              <div className="lp-comp-item">
                <span className="lp-comp-lbl">AIR Top 100 Target:</span>
                <span className="lp-comp-val cyan">&lt; 1.8s / Q</span>
              </div>
            </div>

            <div className="lp-result-actions">
              <button type="button" className="lp-btn-restart" onClick={handleRestart}>
                <RotateCcw size={15} />
                <span>Try Again</span>
              </button>
              <button type="button" className="lp-btn-full-drill" onClick={onGoToDashboard}>
                <span>Practice Full 50-Table Drill in App</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
