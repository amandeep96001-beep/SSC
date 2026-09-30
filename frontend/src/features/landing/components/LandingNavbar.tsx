import { ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/shared/context/useTheme';

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
            <span className="lp-brand-sub">Exam Prep Studio</span>
          </div>
        </a>

        {/* Links */}
        <div className="lp-nav-center">
          <a href="#exams" className="lp-nav-link">SSC Exams</a>
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
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
            aria-label="Open App Free"
          >
            <span>Go to App</span>
            <ArrowRight size={14} className="lp-btn-arrow" />
          </button>
        </div>
      </nav>
    </header>
  );
}
