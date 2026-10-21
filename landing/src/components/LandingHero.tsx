import { ArrowRight } from 'lucide-react';
import { AppPreviewFrame } from './AppPreviewFrame';
import { BrandWordmark } from './BrandWordmark';

interface LandingHeroProps {
  onGoToDashboard: () => void;
}

const STEPS = [
  { n: '1', title: 'Drill', text: 'Short timed questions for speed and accuracy.' },
  { n: '2', title: 'Notes + topic test', text: 'Read a chapter, then sit a small test on it.' },
  { n: '3', title: 'Full mock', text: 'Timer, question palette, negative marking.' },
  { n: '4', title: 'Progress', text: 'Mastered, Reviewing, or Needs work — from your score.' },
];

export function LandingHero({ onGoToDashboard }: LandingHeroProps) {
  return (
    <section id="hero" className="lp-hero-section">
      <div className="lp-hero-container">
        <div className="lp-hero-grid">
          <div className="lp-hero-copy">
            <p className="lp-kicker">SSC practice desk</p>
            <h1 className="lp-hero-h1">
              Solve papers. Keep notes. See which topics still leak marks.
            </h1>
            <p className="lp-hero-desc">
              <BrandWordmark className="lp-brand-wordmark--inline" /> is a study app for <strong>CGL, CHSL, GD, CPO and MTS</strong>.
              Open the app, pick your exam, then practise. We do not invent a rank
              or an unofficial cut-off.
            </p>
            <ol className="lp-hero-steps">
              {STEPS.map((step) => (
                <li key={step.n}>
                  <span className="lp-step-n" aria-hidden="true">{step.n}</span>
                  <span>
                    <b>{step.title}.</b> {step.text}
                  </span>
                </li>
              ))}
            </ol>
            <div className="lp-hero-cta-group">
              <button
                type="button"
                className="lp-btn-hero-primary"
                onClick={onGoToDashboard}
              >
                <span>Start practice</span>
                <ArrowRight size={16} />
              </button>
              <a href="#how-it-works" className="lp-btn-hero-secondary">
                See how the app works
              </a>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-hero-showcase">
              <div className="lp-showcase-caption">Inside the app</div>
              <AppPreviewFrame />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
