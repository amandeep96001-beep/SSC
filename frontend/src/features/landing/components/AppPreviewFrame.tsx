import { useState } from 'react';
import {
  Timer,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Bookmark,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';

export function AppPreviewFrame() {
  const [activeTab, setActiveTab] = useState<'mock' | 'drill' | 'diagnostic'>('mock');
  const [selectedMockOption, setSelectedMockOption] = useState<number | null>(1); // B is correct
  const [drillAnswered, setDrillAnswered] = useState<number | null>(266);
  const [drillStreak, setDrillStreak] = useState(14);

  return (
    <div className="lp-preview-window" aria-label="Interactive platform demonstration">
      {/* Window Titlebar */}
      <div className="lp-window-bar">
        <div className="lp-window-dots" aria-hidden="true">
          <span className="lp-dot lp-dot-red" />
          <span className="lp-dot lp-dot-yellow" />
          <span className="lp-dot lp-dot-green" />
        </div>

        <div className="lp-window-tabs">
          <button
            type="button"
            className={`lp-window-tab ${activeTab === 'mock' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('mock')}
          >
            <span className="lp-tab-indicator" />
            Full Mock Simulation
          </button>
          <button
            type="button"
            className={`lp-window-tab ${activeTab === 'drill' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('drill')}
          >
            <span className="lp-tab-indicator" />
            Speed Drill Engine
          </button>
          <button
            type="button"
            className={`lp-window-tab ${activeTab === 'diagnostic' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('diagnostic')}
          >
            <span className="lp-tab-indicator" />
            Error Diagnostics
          </button>
        </div>

        <div className="lp-window-status">
          <img src="/logo.svg" alt="" className="lp-window-mini-logo" aria-hidden="true" />
          <span className="lp-pulse-dot" />
          <span>CrackuEx Live Engine</span>
        </div>
      </div>

      {/* Window Body */}
      <div className="lp-window-body">
        {/* TAB 1: MOCK EXAM SIMULATION */}
        {activeTab === 'mock' && (
          <div className="lp-mock-screen">
            {/* Exam sub-header */}
            <div className="lp-mock-header">
              <div className="lp-mock-meta">
                <span className="lp-tag-exam">SSC CGL Tier-1</span>
                <span className="lp-mock-section-title">Section 2: Quantitative Aptitude</span>
                <span className="lp-mock-qnum">Question 14 / 25</span>
              </div>
              <div className="lp-mock-timer">
                <Timer size={15} className="lp-timer-icon" />
                <span className="lp-timer-digits">38:42</span>
                <span className="lp-timer-label">rem</span>
              </div>
            </div>

            {/* Question + Palette layout */}
            <div className="lp-mock-content-grid">
              <div className="lp-mock-main">
                <div className="lp-q-statement">
                  A sum of <strong className="lp-highlight">₹12,500</strong> invested at simple interest amounts to{' '}
                  <strong className="lp-highlight">₹15,500</strong> in <strong className="lp-highlight">4 years</strong>.
                  What is the rate of interest per annum?
                </div>

                <div className="lp-options-list" role="radiogroup">
                  {[
                    { id: 0, text: '5.25% p.a.', label: 'A' },
                    { id: 1, text: '6.00% p.a.', label: 'B' },
                    { id: 2, text: '6.50% p.a.', label: 'C' },
                    { id: 3, text: '7.20% p.a.', label: 'D' },
                  ].map((opt) => {
                    const isSelected = selectedMockOption === opt.id;
                    const isCorrect = opt.id === 1;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`lp-option-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedMockOption(opt.id)}
                        role="radio"
                        aria-checked={isSelected}
                      >
                        <span className="lp-opt-badge">{opt.label}</span>
                        <span className="lp-opt-text">{opt.text}</span>
                        {isSelected && isCorrect && (
                          <span className="lp-opt-feedback lp-opt-correct">
                            <CheckCircle2 size={15} /> Correct (Topper Speed: 22s)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="lp-mock-footer-bar">
                  <div className="lp-marking-info">
                    <span className="lp-mark-pos">+2.00</span>
                    <span className="lp-mark-neg">-0.50</span>
                  </div>
                  <div className="lp-mock-buttons">
                    <button type="button" className="lp-btn-sm-ghost">
                      <Bookmark size={14} /> Review Later
                    </button>
                    <button type="button" className="lp-btn-sm-primary">
                      Save & Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mini Question Palette */}
              <div className="lp-mock-palette-sidebar">
                <div className="lp-palette-header">
                  <span>Question Palette</span>
                  <span className="lp-palette-count">13 / 25 Done</span>
                </div>
                <div className="lp-palette-grid">
                  {Array.from({ length: 20 }).map((_, i) => {
                    let status = 'unseen';
                    if (i < 13) status = 'answered';
                    if (i === 13) status = 'current';
                    if (i === 6 || i === 11) status = 'review';
                    return (
                      <div key={i} className={`lp-palette-node is-${status}`}>
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                <div className="lp-palette-legend">
                  <span className="lp-leg-item"><span className="lp-dot-sm bg-emerald" /> Answered</span>
                  <span className="lp-leg-item"><span className="lp-dot-sm bg-amber" /> Review</span>
                  <span className="lp-leg-item"><span className="lp-dot-sm bg-indigo" /> Current</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPEED DRILL ENGINE */}
        {activeTab === 'drill' && (
          <div className="lp-drill-screen">
            <div className="lp-drill-header">
              <div className="lp-drill-mode-badge">
                <Zap size={14} /> Multiplication Rapid Drill (11 to 25)
              </div>
              <div className="lp-drill-streak-pill">
                <Award size={14} color="#f59e0b" />
                <span>Streak: {drillStreak} in a row</span>
              </div>
            </div>

            <div className="lp-drill-core">
              <div className="lp-drill-timer-bar">
                <div className="lp-drill-timer-fill" style={{ width: '74%' }} />
              </div>

              <div className="lp-drill-prompt">
                <span className="lp-drill-num">19</span>
                <span className="lp-drill-op">×</span>
                <span className="lp-drill-num">14</span>
                <span className="lp-drill-eq">=</span>
                <span className="lp-drill-answer-box">{drillAnswered ?? '?'}</span>
              </div>

              <div className="lp-drill-keypad">
                {[256, 266, 276, 286].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`lp-drill-btn ${drillAnswered === val ? 'is-correct' : ''}`}
                    onClick={() => {
                      setDrillAnswered(val);
                      if (val === 266) setDrillStreak((s) => s + 1);
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <div className="lp-drill-metrics-strip">
                <div className="lp-drill-metric">
                  <span className="lp-dm-val">0.78s</span>
                  <span className="lp-dm-lbl">Avg Response Latency</span>
                </div>
                <div className="lp-drill-metric">
                  <span className="lp-dm-val">98.4%</span>
                  <span className="lp-dm-lbl">Accuracy Rate</span>
                </div>
                <div className="lp-drill-metric">
                  <span className="lp-dm-val">+14.2%</span>
                  <span className="lp-dm-lbl">Speed Gain this week</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ERROR DIAGNOSTICS */}
        {activeTab === 'diagnostic' && (
          <div className="lp-diag-screen">
            <div className="lp-diag-badge-bar">
              <span className="lp-tag-rose">
                <XCircle size={13} /> Common Conceptual Trap Detected
              </span>
              <span className="lp-diag-exam-tag">Time & Distance · Relative Speed</span>
            </div>

            <div className="lp-diag-card">
              <div className="lp-diag-question">
                <strong>Q:</strong> Two trains running in opposite directions cross a man standing on the platform in
                27 seconds and 17 seconds respectively, and they cross each other in 23 seconds. The ratio of their
                speeds is:
              </div>

              <div className="lp-diag-choices-comparison">
                <div className="lp-diag-choice lp-choice-wrong">
                  <div className="lp-dc-header">
                    <XCircle size={14} /> Student Mistake (Option A: 2:3)
                  </div>
                  <p className="lp-dc-explain">
                    <strong>Error Type: Calculation Slip.</strong> Took simple difference of (27 - 23) and (23 - 17)
                    in inverted denominator order.
                  </p>
                </div>

                <div className="lp-diag-choice lp-choice-right">
                  <div className="lp-dc-header">
                    <CheckCircle2 size={14} /> Correct Method (Option B: 3:2)
                  </div>
                  <p className="lp-dc-explain">
                    <strong>Rule of Alligation:</strong> (27 - 23) : (23 - 17) = 4 : 6 = 2 : 3 for times ➔ Speed ratio
                    is inversely <strong>3 : 2</strong>.
                  </p>
                </div>
              </div>

              <div className="lp-diag-action-hook">
                <Sparkles size={16} className="lp-hook-icon" />
                <div className="lp-hook-text">
                  <strong>Auto-Action:</strong> Added 4 similar Alligation relative speed MCQs to your Daily Revision
                  Queue for tomorrow.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Window Status Bar */}
      <div className="lp-window-footer">
        <div className="lp-wf-left">
          <span className="lp-wf-dot" />
          <span>Platform: Web & Mobile responsive</span>
        </div>
        <div className="lp-wf-right">
          <span>TCS iON Examination Engine Simulation</span>
          <span className="lp-wf-sep">·</span>
          <span>Zero Subscription</span>
        </div>
      </div>
    </div>
  );
}
