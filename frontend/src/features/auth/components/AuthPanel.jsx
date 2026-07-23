import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, Sun, Moon,
  ArrowRight, ArrowLeft, ShieldCheck, LogIn, UserPlus, KeyRound,
} from 'lucide-react';
import { useTheme } from '@/shared/context/useTheme';
import { APP_NAME, pageTitle } from '@/shared/brand';
import { preloadGsi, mountGoogleButton, signInWithGoogle } from '@/shared/utils/gsi';
import { showAppToast } from '@/shared/utils/appToast';
import '../auth.css';

const OTP_LEN = 6;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

/** Never surface raw API / stack messages in the UI. */
function toastAuthError(fallback = 'Something went wrong. Please try again.') {
  showAppToast(fallback, { variant: 'error' });
}

function GoogleMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GoogleSignInButton({ disabled, onAuth, onError }) {
  const [busy, setBusy] = useState(false);
  const [useOfficialBtn, setUseOfficialBtn] = useState(false);
  const hostRef = useRef(null);
  const onAuthRef = useRef(onAuth);
  const onErrorRef = useRef(onError);
  onAuthRef.current = onAuth;
  onErrorRef.current = onError;

  const preferOfficial = typeof navigator !== 'undefined'
    && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && window.innerWidth < 900));

  useEffect(() => {
    preloadGsi();
  }, []);

  // Official Google button on mobile — popups are unreliable there
  useEffect(() => {
    if (!preferOfficial || !GOOGLE_CLIENT_ID) return undefined;
    let cleanup = () => {};
    let cancelled = false;

    const tryMount = async () => {
      // wait one frame so hostRef is in DOM when we switch to official layout
      setUseOfficialBtn(true);
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled || !hostRef.current) {
        if (!cancelled) setUseOfficialBtn(false);
        return;
      }
      try {
        cleanup = await mountGoogleButton(hostRef.current, GOOGLE_CLIENT_ID, {
          width: hostRef.current?.clientWidth || 320,
          onCredential: async (credential) => {
            setBusy(true);
            try {
              await onAuthRef.current?.({ credential });
            } finally {
              setBusy(false);
            }
          },
          onError: (err) => {
            if (!err?.cancelled) onErrorRef.current?.();
          },
        });
      } catch {
        if (!cancelled) setUseOfficialBtn(false);
      }
    };

    tryMount();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [preferOfficial]);

  const handleClick = async () => {
    if (!GOOGLE_CLIENT_ID || disabled || busy) return;
    setBusy(true);
    try {
      const payload = await signInWithGoogle(GOOGLE_CLIENT_ID);
      await onAuth?.(payload);
    } catch (err) {
      if (!err?.cancelled) onError?.();
    } finally {
      setBusy(false);
    }
  };

  if (useOfficialBtn) {
    return (
      <div className={`auth-google-host${busy || disabled ? ' is-busy' : ''}`}>
        {busy && (
          <div className="auth-google-host__busy">
            <Loader2 size={18} className="spin-icon" />
            <span>Connecting…</span>
          </div>
        )}
        <div ref={hostRef} className="auth-google-host__btn" aria-hidden={busy} />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="auth-google-btn"
      disabled={disabled || busy || !GOOGLE_CLIENT_ID}
      onClick={handleClick}
    >
      {busy ? (
        <>
          <Loader2 size={18} className="spin-icon" />
          <span>Connecting…</span>
        </>
      ) : (
        <>
          <GoogleMark className="auth-google-btn__icon" />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return email;
  const shown = local.slice(0, Math.min(2, local.length));
  return `${shown}${'•'.repeat(Math.max(local.length - shown.length, 2))}@${domain}`;
}

export function AuthPanel({
  loginUser,
  registerUser,
  requestOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
}) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LEN).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);
  const { theme, toggleTheme } = useTheme();
  const otpValue = otpDigits.join('');
  const isOtpMode = mode === 'verify' || mode === 'reset';
  const showAuthTabs = mode === 'login' || mode === 'register';
  const showGoogle = showAuthTabs && GOOGLE_CLIENT_ID;

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

  const handleGoogleAuth = async (payload) => {
    if (!loginWithGoogle) {
      toastAuthError('Google sign-in is unavailable right now.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle(payload);
      if (!res.success) {
        toastAuthError('Google sign-in could not be completed. Please try again.');
      }
    } catch {
      toastAuthError('Google sign-in could not be completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    toastAuthError('Google sign-in could not be completed. Please try again.');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toastAuthError('Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginUser(email.trim(), password);
      if (res.needsVerification) {
        goToVerify(res.email || email.trim(), res.debugOtp);
        showAppToast('Please verify your email to continue.', {
          variant: 'warn',
          title: 'Verification required',
        });
        return;
      }
      if (!res.success) {
        toastAuthError('Invalid email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toastAuthError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      toastAuthError('Password must be at least 8 characters and include letters and numbers.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerUser(trimmed, password);
      if (res.needsVerification) {
        goToVerify(res.email || trimmed, res.debugOtp);
        showAppToast('A verification code has been sent to your email.', {
          variant: 'success',
          title: 'Check your inbox',
        });
        return;
      }
      if (!res.success) {
        toastAuthError('Unable to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpValue)) {
      toastAuthError('Enter the 6-digit verification code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyOtp(email, otpValue);
      if (res.success) {
        showAppToast('Email verified. You can now sign in.', {
          variant: 'success',
          title: 'Verified',
        });
        setMode('login');
        setPassword('');
        setOtpDigits(Array(OTP_LEN).fill(''));
        setDebugOtp('');
      } else {
        toastAuthError('Incorrect verification code.');
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
      const res = mode === 'reset'
        ? await forgotPassword(email)
        : await requestOtp(email);
      if (res.success) {
        setResendIn(30);
        if (res.debugOtp) {
          setDebugOtp(res.debugOtp);
          showAppToast(`${mode === 'reset' ? 'Reset' : 'Verification'} code: ${res.debugOtp}`, {
            variant: 'info',
            durationMs: 10000,
          });
        } else {
          showAppToast('A new code has been sent.', { variant: 'success' });
        }
      } else {
        toastAuthError('Unable to resend code. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toastAuthError('Enter your account email.');
      return;
    }
    if (!forgotPassword) {
      toastAuthError('Password reset is not available.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      if (!res.success) {
        toastAuthError('Unable to send reset code. Please try again.');
        return;
      }
      setEmail(res.email || email.trim());
      setMode('reset');
      setPassword('');
      setConfirmPassword('');
      setOtpDigits(Array(OTP_LEN).fill(''));
      setResendIn(30);
      setDebugOtp(res.debugOtp || '');
      showAppToast('If that email exists, a reset code was sent.', {
        variant: 'success',
        durationMs: 7000,
      });
      if (res.debugOtp) {
        showAppToast(`Reset code: ${res.debugOtp}`, { variant: 'info', durationMs: 10000 });
      }
      requestAnimationFrame(() => focusOtp(0));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (otpValue.length !== OTP_LEN) {
      toastAuthError('Enter the 6-digit code from your email.');
      return;
    }
    if (!password || password.length < 8) {
      toastAuthError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toastAuthError('Passwords do not match.');
      return;
    }
    if (!resetPassword) {
      toastAuthError('Password reset is not available.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await resetPassword(email, otpValue, password);
      if (!res.success) {
        toastAuthError('Password reset failed. Please try again.');
        return;
      }
      showAppToast('Password updated. Sign in with your new password.', {
        variant: 'success',
      });
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setOtpDigits(Array(OTP_LEN).fill(''));
      setDebugOtp('');
      setShowPassword(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageHeading = {
    login: 'Sign in',
    register: 'Create account',
    verify: 'Verify email',
    forgot: 'Reset password',
    reset: 'Choose new password',
  }[mode] || 'Sign in';

  return (
    <div className="auth-page">
      <Helmet>
        <title>{pageTitle(pageHeading)}</title>
      </Helmet>

      <button type="button" className="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className={`auth-brand-icon ${isOtpMode ? 'auth-brand-icon--otp' : ''}`}>
            {mode === 'forgot' || mode === 'reset'
              ? <KeyRound size={28} />
              : mode === 'verify'
                ? <ShieldCheck size={28} />
                : <GraduationCap size={28} />}
          </div>
          <h1>{APP_NAME}</h1>
          <p className="auth-brand-action">
            {mode === 'login' && 'Welcome back. Sign in to continue.'}
            {mode === 'register' && 'Create your account to get started.'}
            {mode === 'verify' && 'Confirm your email address to continue.'}
            {mode === 'forgot' && 'Enter your email and we’ll send a reset code.'}
            {mode === 'reset' && `Enter the code sent to ${maskEmail(email)} and choose a new password.`}
          </p>
        </div>

        {showAuthTabs && (
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
              <div className="auth-label-row">
                <label htmlFor="login-pass">Password</label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  disabled={isSubmitting}
                  onClick={() => {
                    setMode('forgot');
                    setPassword('');
                    setConfirmPassword('');
                    setDebugOtp('');
                    setShowPassword(false);
                  }}
                >
                  Forgot password?
                </button>
              </div>
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

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="forgot-email">Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" aria-hidden />
                <input
                  id="forgot-email"
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
            <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 size={18} className="spin-icon" /><span>Sending code…</span></>
              ) : (
                <><span>Send reset code</span><ArrowRight size={18} /></>
              )}
            </button>
            <button
              type="button"
              className="auth-back-link auth-back-link--block"
              disabled={isSubmitting}
              onClick={() => setMode('login')}
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="reset-otp-0">Reset code</label>
              <div
                className="otp-row"
                onPaste={(e) => {
                  e.preventDefault();
                  setOtpFromString(e.clipboardData.getData('text') || '');
                }}
                role="group"
                aria-label="6-digit reset code"
              >
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={i === 0 ? 'reset-otp-0' : undefined}
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
            <div className="form-group">
              <label htmlFor="reset-pass">New password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" aria-hidden />
                <input
                  id="reset-pass"
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
              <p className="auth-hint">Must include a letter and a number.</p>
            </div>
            <div className="form-group">
              <label htmlFor="reset-pass-confirm">Confirm password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" aria-hidden />
                <input
                  id="reset-pass-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting || otpValue.length !== OTP_LEN}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="spin-icon" /><span>Updating…</span></>
              ) : (
                <><span>Update password</span><ArrowRight size={18} /></>
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
                  setConfirmPassword('');
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

        {showGoogle && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <GoogleSignInButton
              disabled={isSubmitting}
              onAuth={handleGoogleAuth}
              onError={handleGoogleError}
            />
          </>
        )}
      </div>
    </div>
  );
}
