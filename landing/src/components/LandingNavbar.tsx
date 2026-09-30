import { ArrowRight, Sun, Moon, Zap, Target } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingNavbarProps {
  onGoToDashboard: () => void;
}

export function LandingNavbar({ onGoToDashboard }: LandingNavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="lp-nav-wrapper">
      <nav className="lp-nav" aria-label="Main Navigation">
        {/* Official Brand Logo */}
        <a href="#hero" className="lp-nav-brand">
          <div className="lp-brand-logo-wrap" aria-hidden="true">
            <img src="/logo.svg" alt="CrackuEx" className="lp-brand-logo-img" />
          </div>
          <div className="lp-brand-meta">
            <span className="lp-brand-wordmark">
              <span className="lp-brand-cracku">Cracku</span>
              <span className="lp-brand-ex">Ex</span>
            </span>
            <span className="lp-brand-sub">SSC Exam Prep Studio</span>
          </div>
        </a>

        {/* Links */}
        <div className="lp-nav-center">
          <a href="#speed-drill-tool" className="lp-nav-link highlight">
            <Zap size={14} className="lp-nav-icon-zap" />
            <span>Speed Math</span>
          </a>
          <a href="#rank-predictor" className="lp-nav-link highlight">
            <Target size={14} className="lp-nav-icon-target" />
            <span>Rank Predictor</span>
          </a>
          <a href="#tcs-weightage" className="lp-nav-link">TCS Weightage</a>
          <a href="#exams" className="lp-nav-link">Exams</a>
          <a href="#syllabus" className="lp-nav-link">Syllabus</a>
          <a href="#faq" className="lp-nav-link">FAQ</a>
        </div>

        {/* Action Buttons & Theme Toggle */}
        <div className="lp-nav-actions">
          <button
            type="button"
            className="lp-btn-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            className="lp-btn-nav-login"
            onClick={onGoToDashboard}
            aria-label="Log in to your account"
          >
            Sign In
          </button>

          <button
            type="button"
            className="lp-btn-nav-cta"
            onClick={onGoToDashboard}
            aria-label="Start Free Mock Test"
          >
            <span>Free Mock</span>
            <ArrowRight size={14} className="lp-btn-arrow" />
          </button>
        </div>
      </nav>
    </header>
  );
}
