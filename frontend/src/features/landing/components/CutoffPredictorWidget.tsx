import { useState, useId } from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface CutoffPredictorProps {
  onGoToDashboard: () => void;
}

type ExamId = 'cgl' | 'chsl' | 'cpo' | 'gd';
type Category = 'UR' | 'OBC' | 'EWS' | 'SC' | 'ST';
type ShiftDifficulty = 'easy' | 'moderate' | 'hard';

interface ExamCutoffData {
  name: string;
  maxMarks: number;
  expectedCutoffs: Record<Category, number>;
  baseSafeScore: Record<Category, number>;
}

const EXAM_BENCHMARKS: Record<ExamId, ExamCutoffData> = {
  cgl: {
    name: 'SSC CGL Tier-1 (2025/2026)',
    maxMarks: 200,
    expectedCutoffs: { UR: 148, OBC: 144, EWS: 140, SC: 125, ST: 116 },
    baseSafeScore: { UR: 156, OBC: 152, EWS: 148, SC: 134, ST: 125 },
  },
  chsl: {
    name: 'SSC CHSL Tier-1 (10+2)',
    maxMarks: 200,
    expectedCutoffs: { UR: 154, OBC: 151, EWS: 146, SC: 132, ST: 121 },
    baseSafeScore: { UR: 162, OBC: 158, EWS: 154, SC: 140, ST: 130 },
  },
  cpo: {
    name: 'SSC CPO Paper-1 (SI in DP/CAPFs)',
    maxMarks: 200,
    expectedCutoffs: { UR: 138, OBC: 132, EWS: 128, SC: 110, ST: 104 },
    baseSafeScore: { UR: 146, OBC: 140, EWS: 136, SC: 119, ST: 112 },
  },
  gd: {
    name: 'SSC GD Constable (CBE)',
    maxMarks: 160,
    expectedCutoffs: { UR: 128, OBC: 124, EWS: 118, SC: 106, ST: 98 },
    baseSafeScore: { UR: 136, OBC: 132, EWS: 126, SC: 115, ST: 106 },
  },
};

export function CutoffPredictorWidget({ onGoToDashboard }: CutoffPredictorProps) {
  const [exam, setExam] = useState<ExamId>('cgl');
  const [category, setCategory] = useState<Category>('UR');
  const [rawScore, setRawScore] = useState<number>(135);
  const [shift, setShift] = useState<ShiftDifficulty>('moderate');
  const rawScoreInputId = useId();

  const benchmark = EXAM_BENCHMARKS[exam];
  const expectedCutoff = benchmark.expectedCutoffs[category];
  const safeScore = benchmark.baseSafeScore[category];

  // Realistic TCS Normalization formula simulation
  let normBonus = 0;
  if (shift === 'hard') normBonus = Math.round(rawScore * 0.08 + 8);
  else if (shift === 'moderate') normBonus = Math.round(rawScore * 0.03 + 3);
  else normBonus = Math.round(rawScore * 0.005);

  const predictedNormalized = Math.min(benchmark.maxMarks, rawScore + normBonus);
  const diffFromCutoff = predictedNormalized - expectedCutoff;

  let status: 'safe' | 'borderline' | 'danger' = 'safe';
  let probability = 94;

  if (diffFromCutoff >= 8) {
    status = 'safe';
    probability = Math.min(99, 90 + Math.round(diffFromCutoff * 0.8));
  } else if (diffFromCutoff >= -2) {
    status = 'borderline';
    probability = Math.max(55, Math.min(84, 70 + diffFromCutoff * 2.5));
  } else {
    status = 'danger';
    probability = Math.max(15, Math.round(50 + diffFromCutoff * 2.2));
  }

  return (
    <div className="lp-cutoff-widget" id="rank-predictor">
      <div className="lp-cutoff-header">
        <div className="lp-cutoff-tag">
          <TrendingUp size={14} />
          <span>TCS Normalization & Cut-off Simulator</span>
        </div>
        <h3 className="lp-cutoff-title">
          SSC Score & Tier-1 Qualification Predictor
        </h3>
        <p className="lp-cutoff-desc">
          Enter your target or mock raw score to simulate TCS shift normalization and estimate your probability of cracking the official cutoff.
        </p>
      </div>

      <div className="lp-cutoff-body">
        {/* Controls Column */}
        <div className="lp-cutoff-controls">
          {/* Exam Selector */}
          <div className="lp-form-group">
            <span className="lp-form-label">Select Target Exam</span>
            <div className="lp-form-pills">
              {(['cgl', 'chsl', 'cpo', 'gd'] as ExamId[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`lp-pill-btn ${exam === e ? 'is-active' : ''}`}
                  onClick={() => {
                    setExam(e);
                    if (e === 'gd' && rawScore > 150) setRawScore(115);
                  }}
                >
                  {e.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div className="lp-form-group">
            <span className="lp-form-label">Select Your Category</span>
            <div className="lp-form-pills">
              {(['UR', 'OBC', 'EWS', 'SC', 'ST'] as Category[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`lp-pill-btn ${category === c ? 'is-active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Difficulty */}
          <div className="lp-form-group">
            <span className="lp-form-label">Exam Shift Difficulty</span>
            <div className="lp-form-pills">
              <button
                type="button"
                className={`lp-pill-btn ${shift === 'easy' ? 'is-active' : ''}`}
                onClick={() => setShift('easy')}
              >
                Easy (+1-3 Normalization)
              </button>
              <button
                type="button"
                className={`lp-pill-btn ${shift === 'moderate' ? 'is-active' : ''}`}
                onClick={() => setShift('moderate')}
              >
                Moderate (+5-8)
              </button>
              <button
                type="button"
                className={`lp-pill-btn ${shift === 'hard' ? 'is-active' : ''}`}
                onClick={() => setShift('hard')}
              >
                Hard (+10-18)
              </button>
            </div>
          </div>

          {/* Raw Score Slider */}
          <div className="lp-form-group">
            <div className="lp-slider-header">
              <label htmlFor={rawScoreInputId} className="lp-form-label">
                Your Mock Raw Score (out of {benchmark.maxMarks})
              </label>
              <span className="lp-slider-val-badge">{rawScore} Marks</span>
            </div>
            <input
              id={rawScoreInputId}
              type="range"
              min="50"
              max={benchmark.maxMarks}
              step="1"
              value={rawScore}
              onChange={(e) => setRawScore(Number(e.target.value))}
              className="lp-slider-input"
            />
            <div className="lp-slider-ticks">
              <span>50</span>
              <span>100</span>
              <span>150</span>
              <span>{benchmark.maxMarks}</span>
            </div>
          </div>
        </div>

        {/* Prediction Results Card */}
        <div className={`lp-cutoff-output lp-status-${status}`}>
          <div className="lp-output-header">
            <span className="lp-output-tag">Predicted Outcome</span>
            <div className="lp-output-prob-badge">
              {probability}% Qualification Chance
            </div>
          </div>

          <div className="lp-output-scores">
            <div className="lp-score-cell">
              <span className="lp-cell-lbl">Raw Score</span>
              <span className="lp-cell-num">{rawScore}</span>
            </div>
            <div className="lp-score-cell">
              <span className="lp-cell-lbl">Estimated Normalized</span>
              <span className="lp-cell-num highlight">~{predictedNormalized}</span>
            </div>
            <div className="lp-score-cell">
              <span className="lp-cell-lbl">{category} Exp. Cut-off</span>
              <span className="lp-cell-num">{expectedCutoff}</span>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="lp-prob-bar-wrap">
            <div className="lp-prob-bar">
              <div
                className="lp-prob-fill"
                style={{ width: `${probability}%` }}
              />
            </div>
          </div>

          {/* Diagnostic Message */}
          <div className="lp-output-verdict">
            {status === 'safe' ? (
              <div className="lp-verdict-safe">
                <CheckCircle2 size={18} className="lp-verdict-icon green" />
                <div>
                  <strong>Safe Zone for Tier-2!</strong>
                  <p>
                    Your projected score exceeds the expected {category} cutoff ({expectedCutoff}). Safe target for top posts (ASO, ITI, Excise) is <strong>{safeScore}+</strong>.
                  </p>
                </div>
              </div>
            ) : status === 'borderline' ? (
              <div className="lp-verdict-borderline">
                <AlertCircle size={18} className="lp-verdict-icon amber" />
                <div>
                  <strong>Borderline Zone (Needs +10 to +15 Marks)</strong>
                  <p>
                    You are very close to the cutoff ({expectedCutoff}). Increasing speed in Maths & eliminating negative marks in English will guarantee selection.
                  </p>
                </div>
              </div>
            ) : (
              <div className="lp-verdict-danger">
                <AlertCircle size={18} className="lp-verdict-icon red" />
                <div>
                  <strong>Score Booster Required</strong>
                  <p>
                    You need +{expectedCutoff - predictedNormalized} marks to clear {category} cutoff. Focus on high-yield PYQ topics: Percentage, Geometry, Error Spotting & Static GK.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="lp-btn-cutoff-cta"
            onClick={onGoToDashboard}
          >
            <span>Take Free Diagnostic Mock to Test Real Score</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
