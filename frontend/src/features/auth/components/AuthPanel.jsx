import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { GraduationCap, User, Lock, XCircle, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/shared/context/useTheme';
import { APP_NAME, APP_TAGLINE, APP_BLURB, pageTitle } from '@/shared/brand';
import '../auth.css';

export function AuthPanel({ loginUser, registerUser }) {
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const switchMode = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setAuthUsername('');
    setAuthPassword('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      if (!authUsername.trim() || !authPassword) {
        setAuthError('Please fill in all required fields.');
        return;
      }

      if (authMode === 'register' && authPassword.length < 8) {
        setAuthError('Password must be at least 8 characters with letters and numbers.');
        return;
      }

      const action = authMode === 'login' ? loginUser : registerUser;
      const res = await action(authUsername, authPassword);

      if (res.success) {
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(res.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Helmet>
        <title>{pageTitle(authMode === 'login' ? 'Sign In' : 'Register')}</title>
      </Helmet>

      <button
        type="button"
        className="auth-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <GraduationCap size={28} />
          </div>
          <h1>{APP_NAME}</h1>
          <p className="auth-brand-tagline">{APP_TAGLINE}</p>
          <p className="auth-brand-blurb">{APP_BLURB}</p>
          <p className="auth-brand-action">
            {authMode === 'login' ? 'Sign in to continue your prep' : 'Create an account to start preparing'}
          </p>
        </div>

        <div className="auth-mode-selector" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'login'}
            className={authMode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'register'}
            className={authMode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="auth-form" noValidate>
          {authError && (
            <div className="alert-message error" role="alert">
              <XCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User size={16} className="field-icon" aria-hidden />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter username"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" aria-hidden />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Enter password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {authMode === 'register' && (
              <p className="field-hint">Minimum 8 characters with letters and numbers</p>
            )}
          </div>

          <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Please wait…</span>
              </>
            ) : (
              authMode === 'login' ? 'Continue Prep' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
