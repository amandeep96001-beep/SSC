import { ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';

interface LandingCtaProps {
  onGoToDashboard: () => void;
}

export function LandingCta({ onGoToDashboard }: LandingCtaProps) {
  return (
    <section className="lp-section lp-cta-section">
      <div className="lp-cta-box">
        <div className="lp-cta-glow" aria-hidden="true" />

        <div className="lp-cta-stars-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={16} fill="#ffb800" color="#ffb800" />
          ))}
          <span className="lp-cta-star-text">Rated 4.9/5 by 48,900+ SSC Aspirants</span>
        </div>

        <h2 className="lp-cta-h2">
          Ready to Crack SSC CGL, CHSL or GD on Your First Attempt?
        </h2>
        <p className="lp-cta-p">
          Stop losing marks to slow calculations and negative marking. Practice full-length TCS mocks, master 1-50 speed calculation tables, and eliminate mistakes with the smart Revision Deck.
        </p>

        <div className="lp-cta-actions">
          <button
            type="button"
            className="lp-btn-cta-main"
            onClick={onGoToDashboard}
            aria-label="Launch Free Exam Engine"
          >
            <Zap size={18} />
            <span>Start Free Mock Test Now</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="lp-cta-footnotes">
          <span className="lp-cf-item">
            <ShieldCheck size={14} className="text-emerald" />
            <span>100% Free Forever • No Credit Card Required</span>
          </span>
          <span className="lp-cf-sep">·</span>
          <span className="lp-cf-item">
            <span>Real TCS Interface (Hindi &amp; English)</span>
          </span>
          <span className="lp-cf-sep">·</span>
          <span className="lp-cf-item">
            <span>Instant access on Mobile &amp; PC</span>
          </span>
        </div>
      </div>
    </section>
  );
}
