import { ArrowUpRight } from 'lucide-react';
import { APP_NAME } from '@/shared/brand';

interface LandingFooterProps {
  onGoToDashboard: () => void;
}

export function LandingFooter({ onGoToDashboard }: LandingFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="lp-footer">
      <div className="lp-footer-container">
        <div className="lp-footer-grid">
          {/* Brand Col with official logo */}
          <div className="lp-footer-brand-col">
            <div className="lp-footer-logo">
              <div className="lp-brand-logo-wrap" aria-hidden="true">
                <img src="/logo.svg" alt="CrackuEx" className="lp-brand-logo-img" />
              </div>
              <span className="lp-brand-wordmark">
                <span className="lp-brand-cracku">Cracku</span>
                <span className="lp-brand-ex">Ex</span>
              </span>
            </div>
            <p className="lp-footer-tagline">
              SSC pattern, syllabus and practice in one place. Railway is a separate recruitment; some subjects overlap.
            </p>
            <div className="lp-footer-status">
              <span className="lp-status-live-dot" />
              <span>All Question Banks & Mocks Operational</span>
            </div>
          </div>

          {/* Col 2: Exams */}
          <div className="lp-footer-col">
            <div className="lp-fc-title">Target Exams</div>
            <ul className="lp-fc-list">
              <li><a href="#exams">SSC CGL</a></li>
              <li><a href="#exams">SSC CHSL</a></li>
              <li><a href="#exams">SSC GD / CPO / MTS</a></li>
              <li><a href="#railway">RRB NTPC</a></li>
              <li><a href="#railway">Level-1, ALP, JE, RPF</a></li>
            </ul>
          </div>

          {/* Col 3: Modules */}
          <div className="lp-footer-col">
            <div className="lp-fc-title">Modules</div>
            <ul className="lp-fc-list">
              <li><button type="button" onClick={onGoToDashboard}>Calculation drills</button></li>
              <li><button type="button" onClick={onGoToDashboard}>Mock test</button></li>
              <li><button type="button" onClick={onGoToDashboard}>Syllabus notes</button></li>
              <li><button type="button" onClick={onGoToDashboard}>Performance</button></li>
              <li><a href="#how-it-works">How the app works</a></li>
              <li><a href="#syllabus">View Syllabus</a></li>
            </ul>
          </div>

          {/* Col 4: Platform */}
          <div className="lp-footer-col">
            <div className="lp-fc-title">Studio</div>
            <ul className="lp-fc-list">
              <li><a href="#hero">Back to Top</a></li>
              <li><a href="#exams">SSC exams</a></li>
              <li><a href="#process">Selection process</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li>
                <button type="button" className="lp-fc-link-app" onClick={onGoToDashboard}>
                  <span>Open Studio</span>
                  <ArrowUpRight size={13} />
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p className="lp-fb-copy">
            © {currentYear} {APP_NAME}. Exam pattern and syllabus follow official SSC and RRB notices. Details can change in the next recruitment.
          </p>
          <div className="lp-fb-pills">
            <span className="lp-fb-pill">100% Free Public Initiative</span>
            <span className="lp-fb-pill">No Credit Card Required</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
