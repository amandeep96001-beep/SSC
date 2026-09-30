import { ArrowRight } from 'lucide-react';
import { APP_WORK_CARDS, PROGRESS_FLOW } from '../data/landingData';

interface HowTheAppWorksProps {
  onGoToDashboard: () => void;
}

export function HowTheAppWorks({ onGoToDashboard }: HowTheAppWorksProps) {
  return (
    <section id="how-it-works" className="lp-section">
      <div className="lp-section-header">
        <h2 className="lp-section-title">How the app works</h2>
        <p className="lp-section-lead">
          After you pick an exam, use the app to practise, add questions, write notes, and see what is
          strong or weak. Nothing here invents a rank or a cut-off.
        </p>
      </div>

      <div className="lp-how-grid">
        {APP_WORK_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className="lp-loop-card">
              <div className="lp-loop-icon-wrap">
                <Icon size={20} className="lp-loop-icon" />
              </div>
              <h3 className="lp-loop-title">{card.title}</h3>
              <p className="lp-loop-desc">{card.text}</p>
              <ul className="lp-plain-list">
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="lp-how-track">
        <h3 className="lp-how-track-title">Progress, in order</h3>
        <ol className="lp-flow lp-how-flow">
          {PROGRESS_FLOW.map((item) => (
            <li key={item.step} className="lp-flow-step">
              <span className="lp-flow-index">{item.step}</span>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="lp-bridge-row">
        <button type="button" className="lp-btn-exam-start" onClick={onGoToDashboard}>
          Start practice <ArrowRight size={14} />
        </button>
        <button type="button" className="lp-btn-sm-ghost" onClick={onGoToDashboard}>
          Add a question
        </button>
        <button type="button" className="lp-btn-sm-ghost" onClick={onGoToDashboard}>
          Open notes
        </button>
        <button type="button" className="lp-btn-sm-ghost" onClick={onGoToDashboard}>
          View performance
        </button>
      </div>
    </section>
  );
}
