import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { APP_NAME } from '@/shared/brand';

interface LandingCtaProps {
  onGoToDashboard: () => void;
}

export function LandingCta({ onGoToDashboard }: LandingCtaProps) {
  return (
    <section className="lp-section lp-cta-section">
      <div className="lp-cta-box">
        <div className="lp-cta-glow" aria-hidden="true" />

        <h2 className="lp-cta-h2">Pattern is clear. Start practice.</h2>
        <p className="lp-cta-p">
          Topic practice, mock tests and performance analysis are in the app. No claims on selection or cut-off.
        </p>

        <div className="lp-cta-actions">
          <button
            type="button"
            className="lp-btn-cta-main"
            onClick={onGoToDashboard}
            aria-label="Launch Free Exam Studio"
          >
            <span>Start Practice</span>
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="lp-cta-footnotes">
          <span className="lp-cf-item">
            <ShieldCheck size={14} className="text-emerald" />
            <span>No payment or card required</span>
          </span>
          <span className="lp-cf-sep">·</span>
          <span className="lp-cf-item">
            <span>Instant access in any modern browser</span>
          </span>
        </div>
      </div>
    </section>
  );
}
