import { ArrowRight, Zap, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { AppPreviewFrame } from './AppPreviewFrame';

interface LandingHeroProps {
  onGoToDashboard: () => void;
}

export function LandingHero({ onGoToDashboard }: LandingHeroProps) {
  return (
    <section id="hero" className="lp-hero-section">
      <div className="lp-hero-container">
        {/* Live Social Proof Badge */}
        <div className="lp-hero-live-badge">
          <span className="lp-live-pulse-dot" />
          <span className="lp-live-text">
            <strong>1,480+ Aspirants</strong> practicing live
          </span>
          <span className="lp-live-divider">•</span>
          <span className="lp-live-highlight">TCS Exam Engine • Zero Paywalls</span>
        </div>

        {/* High-Impact Professional SEO H1 */}
        <h1 className="lp-hero-h1">
          Master the TCS Pattern.<br />
          <span className="lp-brand-gradient">Precision Mocks, Speed Engine &amp; AIR Rank Simulator</span>
        </h1>

        <p className="lp-hero-desc">
          Engineered for serious SSC CGL, CHSL, CPO, MTS &amp; GD aspirants. Master 1-50 speed calculation tables, solve full-length CBT mocks with official negative marking (−0.50), analyze 15-year repeated PYQs, and systematically eliminate exam-day error.
        </p>

        {/* Action Buttons */}
        <div className="lp-hero-cta-group">
          <button
            type="button"
            className="lp-btn-hero-primary"
            onClick={onGoToDashboard}
            aria-label="Start Free Mock Test"
          >
            <Sparkles size={18} />
            <span>Start Free Mock Test (Instant Access)</span>
            <ArrowRight size={17} />
          </button>

          <a href="#speed-drill-tool" className="lp-btn-hero-secondary">
            <Zap size={16} className="lp-btn-zap" />
            <span>Test Calculation Speed (10s Drill)</span>
          </a>
        </div>

        {/* Trust Badges Strip */}
        <div className="lp-hero-trust-bar">
          <div className="lp-trust-item">
            <div className="lp-trust-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="#ffb800" color="#ffb800" />
              ))}
            </div>
            <span><strong>4.9/5</strong> (48,900+ Aspirants)</span>
          </div>

          <div className="lp-trust-item">
            <CheckCircle2 size={16} className="lp-check-green" />
            <span>Exact TCS CBT Exam Screen</span>
          </div>

          <div className="lp-trust-item">
            <CheckCircle2 size={16} className="lp-check-green" />
            <span>Bilingual (हिन्दी + English)</span>
          </div>

          <div className="lp-trust-item">
            <CheckCircle2 size={16} className="lp-check-green" />
            <span>100% Free • No Credit Card</span>
          </div>
        </div>

        {/* Product UI Demonstration */}
        <div className="lp-hero-showcase">
          <div className="lp-showcase-caption">
            <span>Live Interactive Exam Platform Preview</span>
          </div>
          <AppPreviewFrame />
        </div>
      </div>
    </section>
  );
}
