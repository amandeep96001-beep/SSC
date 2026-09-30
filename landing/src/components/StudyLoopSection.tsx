import { Zap, BookOpen, ClipboardCheck, ArrowRight } from 'lucide-react';
import { STUDY_LOOP_STEPS } from '../data/landingData';

interface StudyLoopSectionProps {
  onGoToDashboard: () => void;
}

export function StudyLoopSection({ onGoToDashboard }: StudyLoopSectionProps) {
  return (
    <section id="study-loop" className="lp-section lp-loop-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">A simple daily loop</h2>
        <p className="lp-section-lead">
          The 10-step plan is above. For each day, these three tasks are enough.
        </p>
      </div>

      <div className="lp-loop-grid">
        {STUDY_LOOP_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="lp-loop-card">
              <div className="lp-loop-card-top">
                <span className="lp-loop-num">{step.step}</span>
                <span className="lp-loop-time">{step.time}</span>
              </div>

              <div className="lp-loop-icon-wrap">
                <Icon size={22} className="lp-loop-icon" />
              </div>

              <h3 className="lp-loop-title">{step.title}</h3>
              <p className="lp-loop-desc">{step.description}</p>
            </div>
          );
        })}
      </div>

      <div className="lp-loop-footer">
        <button
          type="button"
          className="lp-btn-loop-action"
          onClick={onGoToDashboard}
        >
          <span>Begin with topic practice</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
