import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, Sun, Moon,
  ArrowRight, ArrowLeft, ShieldCheck, LogIn, UserPlus,
} from 'lucide-react';
import { useTheme } from '@/shared/context/useTheme';
import { APP_NAME, pageTitle } from '@/shared/brand';
import { useGoogleLogin, useGoogleOAuth } from '@react-oauth/google';
import { showAppToast } from '@/shared/utils/appToast';
import '../auth.css';

const OTP_LEN = 6;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

function GoogleSignInButton({ disabled, onCode, onError }) {
  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const startGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',
    scope: 'openid email profile',
    // Avoid FedCM — many browsers/environments don't support it
    use_fedcm_for_prompt: false,
    use_fedcm_for_button: false,
    onSuccess: async (response) => {
      if (!response?.code) {
        onError?.('Google did not return an auth code.');
        return;
      }
      await onCode(response.code);
    },
    onError: (err) => {
      onError?.(err?.error_description || err?.error || 'Google sign-in failed.');
    },
    onNonOAuthError: (err) => {
      const type = err?.type;
      if (type === 'popup_closed') {
        onError?.('Google sign-in popup was closed.');
        return;
      }
      if (type === 'popup_failed_to_open') {
        onError?.('Popup blocked. Allow popups for localhost and try again.');
        return;
      }
      onError?.(type || 'Google sign-in failed.');
    },
  });

  return (
    <button
      type="button"
      className="auth-google-btn"
      disabled={disabled || !scriptLoadedSuccessfully}
      onClick={() => startGoogleLogin()}
    >
      <svg className="auth-google-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span>{scriptLoadedSuccessfully ? 'Sign in with Google' : 'Loading Google…'}</span>
    </button>
  );
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return email;
  const shown = local.slice(0, Math.min(2, local.length));
  return `${shown}${'•'.repeat(Math.max(local.length - shown.length, 2))}@${domain}`;
}

export function AuthPanel({ loginUser, registerUser, requestOtp, verifyOtp, loginWithGoogle }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LEN).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);
  const { theme, toggleTheme } = useTheme();
  const otpValue = otpDigits.join('');

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const focusOtp = (index) => {
    otpRefs.current[index]?.focus();
    otpRefs.current[index]?.select?.();
  };

  const setOtpFromString = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LEN).split('');
    const next = Array(OTP_LEN).fill('');
    digits.forEach((d, i) => { next[i] = d; });
    setOtpDigits(next);
    requestAnimationFrame(() => focusOtp(Math.min(digits.length, OTP_LEN - 1)));
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      setOtpFromString(value);
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LEN - 1) focusOtp(index + 1);
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      e.preventDefault();
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      focusOtp(index - 1);
    }
  };

  const goToVerify = (addr, maybeDebug) => {
    setEmail(addr);
    setMode('verify');
    setOtpDigits(Array(OTP_LEN).fill(''));
    setResendIn(30);
    setDebugOtp(maybeDebug || '');
    if (maybeDebug) {
      showAppToast(`Verification code: ${maybeDebug}`, {
        variant: 'info',
        title: 'Email verification',
        durationMs: 10000,
      });
    }
    requestAnimationFrame(() => focusOtp(0));
  };

  const handleGoogleCode = async (code) => {
    if (!loginWithGoogle) {
      showAppToast('Google sign-in is not wired up.', { variant: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle({ code });
      if (!res.success) {
        showAppToast(res.message || 'Google sign-in failed.', { variant: 'error' });
      }
    } catch (err) {
      showAppToast(err?.message || 'Google sign-in failed.', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = (message) => {
    showAppToast(
      message || 'Google sign-in failed. Allow popups for localhost, and ensure Authorized JavaScript origins includes http://localhost:5173.',
      { variant: 'error', durationMs: 10000 },
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showAppToast('Please enter your email and password.', { variant: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginUser(email.trim(), password);
      if (res.needsVerification) {
        goToVerify(res.email || email.trim(), res.debugOtp);
        showAppToast(res.message || 'Please verify your email to continue.', {
          variant: 'warn',
          title: 'Verification required',
        });
        return;
      }
      if (!res.success) {
        showAppToast(res.message || 'Invalid credentials.', { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      showAppToast('Please enter a valid email address.', { variant: 'error' });
      return;
    }
    if (!password || password.length < 8) {
      showAppToast('Password must be at least 8 characters and include letters and numbers.', {
        variant: 'error',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerUser(trimmed, password);
      if (res.needsVerification) {
        goToVerify(res.email || trimmed, res.debugOtp);
        showAppToast(res.message || 'A verification code has been sent to your email.', {
          variant: 'success',
          title: 'Check your inbox',
        });
        return;
      }
      if (!res.success) {
        showAppToast(res.message || 'Unable to create account.', { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpValue)) {
      showAppToast('Enter the 6-digit verification code.', { variant: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyOtp(email, otpValue);
      if (res.success) {
        showAppToast(res.message || 'Email verified. You can now sign in.', {
          variant: 'success',
          title: 'Verified',
        });
        setMode('login');
        setPassword('');
        setOtpDigits(Array(OTP_LEN).fill(''));
        setDebugOtp('');
      } else {
        showAppToast(res.message || 'Incorrect verification code.', { variant: 'error' });
        setOtpDigits(Array(OTP_LEN).fill(''));
        requestAnimationFrame(() => focusOtp(0));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await requestOtp(email);
      if (res.success) {
        setResendIn(30);
        if (res.debugOtp) {
          setDebugOtp(res.debugOtp);
          showAppToast(`Verification code: ${res.debugOtp}`, {
            variant: 'info',
            durationMs: 10000,
          });
        } else {
          showAppToast(res.message || 'A new code has been sent.', { variant: 'success' });
        }
      } else {
        showAppToast(res.message || 'Unable to resend code.', { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Helmet>
        <title>{pageTitle(mode === 'register' ? 'Create account' : 'Sign in')}</title>
      </Helmet>

      <button type="button" className="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className={`auth-brand-icon ${mode === 'verify' ? 'auth-brand-icon--otp' : ''}`}>
            {mode === 'verify' ? <ShieldCheck size={28} /> : <GraduationCap size={28} />}
          </div>
          <h1>{APP_NAME}</h1>
          <p className="auth-brand-action">
            {mode === 'login' && 'Welcome back. Sign in to continue.'}
            {mode === 'register' && 'Create your account to get started.'}
            {mode === 'verify' && 'Confirm your email address to continue.'}
          </p>
        </div>

        {mode !== 'verify' && (
          <div className="auth-mode-selector" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setDebugOtp(''); }}
            >
              <LogIn size={15} /> Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); setDebugOtp(''); }}
            >
              <UserPlus size={15} /> Register
            </button>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-id">Email or username</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" aria-hidden />
                <input
                  id="login-id"
                  type="text"
                  autoComplete="username"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="login-pass">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" aria-hidden />
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>
            <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 size={18} className="spin-icon" /><span>Signing in…</span></>
              ) : (
                <><span>Sign in</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" aria-hidden />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-pass">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" aria-hidden />
                <input
                  id="reg-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <p className="field-hint">
                Use letters and numbers. A verification code will be sent to confirm your email.
              </p>
            </div>
            <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 size={18} className="spin-icon" /><span>Creating account…</span></>
              ) : (
                <><span>Create account</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="auth-form" noValidate>
            <div className="auth-otp-banner">
              <Mail size={16} aria-hidden />
              <div>
                <strong>Verification code sent</strong>
                <span>{maskEmail(email)}</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="otp-0">Verification code</label>
              <div
                className="otp-boxes"
                onPaste={(e) => {
                  e.preventDefault();
                  setOtpFromString(e.clipboardData.getData('text') || '');
                }}
                role="group"
                aria-label="6-digit verification code"
              >
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={i === 0 ? 'otp-0' : undefined}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    className={`otp-box ${digit ? 'otp-box--filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={i === 0 ? OTP_LEN : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={isSubmitting}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
              {debugOtp && (
                <p className="auth-dev-otp">Dev code <kbd>{debugOtp}</kbd></p>
              )}
            </div>
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting || otpValue.length !== OTP_LEN}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="spin-icon" /><span>Verifying…</span></>
              ) : (
                <><span>Verify email</span><ArrowRight size={18} /></>
              )}
            </button>
            <div className="auth-otp-actions">
              <button
                type="button"
                className="auth-back-link"
                disabled={isSubmitting}
                onClick={() => {
                  setMode('login');
                  setOtpDigits(Array(OTP_LEN).fill(''));
                  setDebugOtp('');
                }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
              <button
                type="button"
                className="auth-resend"
                disabled={isSubmitting || resendIn > 0}
                onClick={handleResend}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {mode !== 'verify' && GOOGLE_CLIENT_ID && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <GoogleSignInButton
              disabled={isSubmitting}
              onCode={handleGoogleCode}
              onError={handleGoogleError}
            />
            {import.meta.env.DEV && (
              <details className="auth-google-setup">
                <summary>Google sign-in setup (required once)</summary>
                <ol>
                  <li>
                    Open{' '}
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
                      Google Cloud → Credentials
                    </a>
                  </li>
                  <li>
                    Create / open an OAuth client of type <strong>Web application</strong>
                  </li>
                  <li>
                    Under <strong>Authorized JavaScript origins</strong>, add exactly:
                    <code>http://localhost:5173</code>
                  </li>
                  <li>
                    Copy Client ID + Client Secret into <code>backend/.env</code>, and the same Client ID into{' '}
                    <code>frontend/.env.local</code> as <code>VITE_GOOGLE_CLIENT_ID</code>
                  </li>
                  <li>
                    OAuth consent screen → if status is Testing, add your Gmail as a{' '}
                    <strong>Test user</strong>
                  </li>
                  <li>Allow popups for localhost, then hard-refresh this page</li>
                </ol>
                <p className="auth-google-hint">
                  Current Client ID: <code>{GOOGLE_CLIENT_ID}</code>
                </p>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}
