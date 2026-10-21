import { ArrowRight } from 'lucide-react';
import { BrandWordmark } from './BrandWordmark';

interface StickyMobileCtaProps {
  onGoToDashboard: () => void;
}

export function StickyMobileCta({ onGoToDashboard }: StickyMobileCtaProps) {
  return (
    <div className="lp-sticky-mobile-bar" role="region" aria-label="Open app">
      <div className="lp-sticky-content">
        <div className="lp-sticky-text">
          <span className="lp-sticky-title">
            <BrandWordmark className="lp-brand-wordmark--sm" />
            <span> practice app</span>
          </span>
        </div>
        <button
          type="button"
          className="lp-sticky-btn"
          onClick={onGoToDashboard}
        >
          <span>Open app</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
