import { ArrowRight } from 'lucide-react';

interface LandingCtaProps {
  onGoToDashboard: () => void;
}

export function LandingCta({ onGoToDashboard }: LandingCtaProps) {
  return (
    <section className="lp-section lp-cta-section">
      <div className="lp-cta-box">
        <h2 className="lp-cta-h2">Open the practice app</h2>
        <p className="lp-cta-p">
          Sign in to keep scores, notes and wrong-question review. Guest mode lets you
          try a few drills first.
        </p>

        <div className="lp-cta-actions">
          <button
            type="button"
            className="lp-btn-cta-main"
            onClick={onGoToDashboard}
          >
            <span>Go to the app</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
