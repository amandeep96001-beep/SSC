import { ArrowRight, Zap } from 'lucide-react';

interface StickyMobileCtaProps {
  onGoToDashboard: () => void;
}

export function StickyMobileCta({ onGoToDashboard }: StickyMobileCtaProps) {
  return (
    <div className="lp-sticky-mobile-bar" role="region" aria-label="Quick Action">
      <div className="lp-sticky-content">
        <div className="lp-sticky-text">
          <div className="lp-sticky-live">
            <span className="lp-live-dot" />
            <span>100% Free Mock</span>
          </div>
          <span className="lp-sticky-title">SSC CGL & CHSL TCS Engine</span>
        </div>
        <button
          type="button"
          className="lp-sticky-btn"
          onClick={onGoToDashboard}
          aria-label="Start Free Mock Test"
        >
          <Zap size={14} />
          <span>Attempt Now</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
