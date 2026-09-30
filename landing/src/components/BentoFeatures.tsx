import {
  Zap,
  ClipboardCheck,
  BrainCircuit,
  BookOpen,
  ArrowRight,
  Timer,
  XCircle,
  Bookmark,
} from 'lucide-react';

interface BentoFeaturesProps {
  onGoToDashboard: () => void;
}

export function BentoFeatures({ onGoToDashboard }: BentoFeaturesProps) {
  return (
    <section id="features" className="lp-section lp-bento-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">Practice in the app</h2>
        <p className="lp-section-lead">
          After the syllabus, use drills, notes, mocks and wrong-question review. How progress,
          questions and notes work is in the next section.
        </p>
      </div>

      <div className="lp-bento-grid">
        {/* BENTO CARD 1: Speed Calculation */}
        <div className="lp-bento-card lp-bento-card-large">
          <div className="lp-bento-content">
            <div className="lp-bento-icon-badge">
              <Zap size={18} />
            </div>
            <h3 className="lp-bento-h3">Calculation drills</h3>
            <p className="lp-bento-p">
              Tables, squares, cubes and fraction-to-percentage. If Quant is slow, start with drills, then chapter questions.
            </p>
            <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
              <span>Practice Speed Math</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="lp-bento-visual lp-bento-vis-drill" aria-hidden="true">
            <div className="lp-mini-drill-box">
              <div className="lp-mdb-header">
                <span className="lp-mdb-title">Fraction ➔ % Conversion</span>
                <span className="lp-mdb-speed">0.4s response</span>
              </div>
              <div className="lp-mdb-chips">
                <div className="lp-mdb-chip is-done">
                  <span className="lp-chip-q">1/7</span>
                  <span className="lp-chip-a">14.28%</span>
                </div>
                <div className="lp-mdb-chip is-done">
                  <span className="lp-chip-q">1/8</span>
                  <span className="lp-chip-a">12.50%</span>
                </div>
                <div className="lp-mdb-chip is-active">
                  <span className="lp-chip-q">1/9</span>
                  <span className="lp-chip-a">11.11%</span>
                </div>
                <div className="lp-mdb-chip is-pending">
                  <span className="lp-chip-q">1/12</span>
                  <span className="lp-chip-a">8.33%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: Full Exam Hall Simulation */}
        <div className="lp-bento-card lp-bento-card-regular">
          <div className="lp-bento-content">
            <div className="lp-bento-icon-badge">
              <ClipboardCheck size={18} />
            </div>
            <h3 className="lp-bento-h3">Mock tests</h3>
            <p className="lp-bento-p">
              Full paper with timer, question palette and negative marking. This is how you check speed and accuracy.
            </p>
          </div>

          <div className="lp-bento-visual lp-bento-vis-mock" aria-hidden="true">
            <div className="lp-mini-mock-palette">
              <div className="lp-mmp-row">
                <span className="lp-mmp-btn bg-emerald">1</span>
                <span className="lp-mmp-btn bg-emerald">2</span>
                <span className="lp-mmp-btn bg-amber">3</span>
                <span className="lp-mmp-btn bg-emerald">4</span>
                <span className="lp-mmp-btn is-active">5</span>
              </div>
              <div className="lp-mmp-status">
                <Timer size={13} />
                <span>Section Timer: 19:42 left</span>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 3: Error Diagnostics */}
        <div className="lp-bento-card lp-bento-card-regular">
          <div className="lp-bento-content">
            <div className="lp-bento-icon-badge">
              <BrainCircuit size={18} />
            </div>
            <h3 className="lp-bento-h3">Incorrect answers</h3>
            <p className="lp-bento-p">
              Save incorrect questions for revision. Start the next session from those topics.
            </p>
          </div>

          <div className="lp-bento-visual lp-bento-vis-diag" aria-hidden="true">
            <div className="lp-mini-diag-card">
              <div className="lp-mdc-label">
                <XCircle size={12} color="#fb7185" />
                <span>Wrong Question Saved</span>
              </div>
              <div className="lp-mdc-trap">Simple Interest vs Compound Interest formula mix-up</div>
              <div className="lp-mdc-action">Queued into Revision Deck for review</div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 4: Syllabus & Notes Reader */}
        <div className="lp-bento-card lp-bento-card-large">
          <div className="lp-bento-content">
            <div className="lp-bento-icon-badge">
              <BookOpen size={18} />
            </div>
            <h3 className="lp-bento-h3">Syllabus notes</h3>
            <p className="lp-bento-p">
              Chapter notes, bookmarks and topic tests. Attempt questions on the same topic right after reading.
            </p>
            <button type="button" className="lp-bento-link" onClick={onGoToDashboard}>
              <span>Browse Syllabus Notes</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="lp-bento-visual lp-bento-vis-notes" aria-hidden="true">
            <div className="lp-mini-notes-view">
              <div className="lp-mnv-head">
                <Bookmark size={13} color="#f59e0b" />
                <span>Modern Indian History · Charter Act of 1833</span>
              </div>
              <p className="lp-mnv-body">
                Governor-General of Bengal redesignated as <mark>Governor-General of India</mark>.
                Lord William Bentinck became the first Governor-General of India.
              </p>
              <div className="lp-mnv-meta">
                <span className="lp-mnv-tag">10 Q Topic Test Attached</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
