import { ArrowRight, ChevronDown } from 'lucide-react';
import { AppPreviewFrame } from './AppPreviewFrame';

interface LandingHeroProps {
  onGoToDashboard: () => void;
}

export function LandingHero({ onGoToDashboard }: LandingHeroProps) {
  return (
    <section id="hero" className="lp-hero-section">
      <div className="lp-hero-container">
        {/* Direct, clean H1 without any cheesy AI pill chips */}
        <h1 className="lp-hero-h1">
          SSC exam prep,<br />
          <span className="lp-brand-gradient">pattern first, then practice.</span>
        </h1>
        <p className="lp-hero-desc">
          Pick your target exam, read the official pattern and syllabus, then practise topic-wise questions
          and mocks. The app tracks those attempts, lets you add questions, and stores your notes.
          Railway is a separate recruitment — overlapping subjects help; the process is not the same.
        </p>

        {/* Action Buttons */}
        <div className="lp-hero-cta-group">
          <button
            type="button"
            className="lp-btn-hero-primary"
            onClick={onGoToDashboard}
            aria-label="Open Exam Dashboard"
          >
            <span>Open Exam Dashboard</span>
            <ArrowRight size={16} />
          </button>

          <a href="#how-it-works" className="lp-btn-hero-secondary">
            <span>How the app works</span>
            <ChevronDown size={15} />
          </a>
        </div>

        {/* Product UI Demonstration */}
        <div className="lp-hero-showcase">
          <div className="lp-showcase-caption">
            <span>Platform preview</span>
          </div>
          <AppPreviewFrame />
        </div>
      </div>
    </section>
  );
}
