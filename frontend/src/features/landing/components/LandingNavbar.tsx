import { useEffect, useState } from 'react';
import { ArrowRight, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '@/shared/context/useTheme';
import { BrandWordmark } from './BrandWordmark';

interface LandingNavbarProps {
  onGoToDashboard: () => void;
}

const LINKS = [
  { href: '#exams', label: 'Exams' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#syllabus', label: 'Syllabus' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNavbar({ onGoToDashboard }: LandingNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lp-nav-wrapper${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <nav className="lp-nav" aria-label="Main">
        <a href="#hero" className="lp-nav-brand" onClick={() => setOpen(false)}>
          <div className="lp-brand-logo-wrap" aria-hidden="true">
            <img src="/logo.svg" alt="" className="lp-brand-logo-img" />
          </div>
          <div className="lp-brand-meta">
            <BrandWordmark />
            <span className="lp-brand-sub">SSC practice desk</span>
          </div>
        </a>

        <div className="lp-nav-center">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="lp-nav-link"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="lp-nav-actions">
          <button
            type="button"
            className="lp-btn-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            className="lp-btn-nav-login"
            onClick={onGoToDashboard}
          >
            Sign in
          </button>

          <button
            type="button"
            className="lp-btn-nav-cta"
            onClick={onGoToDashboard}
          >
            <span>Start practice</span>
            <ArrowRight size={14} className="lp-btn-arrow" />
          </button>

          <button
            type="button"
            className="lp-nav-burger"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
