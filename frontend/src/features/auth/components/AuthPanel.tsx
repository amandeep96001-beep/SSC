import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Mail, Lock, Eye, EyeOff, Loader2, Sun, Moon,
  ArrowRight, ArrowLeft, ShieldCheck, LogIn, UserPlus, KeyRound,
} from 'lucide-react';
import { useTheme } from '@/shared/context/useTheme';
import { APP_NAME, pageTitle } from '@/shared/brand';
import { preloadGsi, mountGoogleButton, signInWithGoogle, isCancelledError } from '@/shared/utils/gsi';
import { showAppToast } from '@/shared/utils/appToast';
import { apiService } from '@/shared/services/apiService';
import '../auth.css';

const OTP_LEN = 6;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Never surface raw API / stack messages in the UI. */
function toastAuthError(fallback: string = 'Something went wrong. Please try again.') {
  showAppToast(fallback, { variant: 'error' });
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  clientId: string;
  disabled?: boolean;
  onAuth?: (payload: { credential?: string; code?: string }) => void | Promise<void>;
  onError?: () => void;
}

function GoogleSignInButton({ clientId, disabled, onAuth, onError }: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);
  const [useOfficialBtn, setUseOfficialBtn] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onAuthRef.current = onAuth;
    onErrorRef.current = onError;
  }, [onAuth, onError]);

  const preferOfficial = typeof navigator !== 'undefined'
    && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && window.innerWidth < 900));

  useEffect(() => {
    preloadGsi();
  }, []);

  // Official Google button on mobile — popups are unreliable there
  useEffect(() => {
    if (!preferOfficial || !clientId) return undefined;
    let cleanup = () => {};
    let cancelled = false;

    const tryMount = async () => {
      setUseOfficialBtn(true);
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled || !hostRef.current) {
        if (!cancelled) setUseOfficialBtn(false);
        return;
      }
      try {
        cleanup = await mountGoogleButton(hostRef.current, clientId, {
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
            if (!isCancelledError(err)) onErrorRef.current?.();
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
  }, [preferOfficial, clientId]);

  const handleClick = async () => {
    if (disabled || busy) return;
    if (!clientId) {
      toastAuthError('Google login configuration is missing or server is unreachable.');
      return;
    }
    setBusy(true);
    try {
      const payload = await signInWithGoogle(clientId);
      await onAuth?.(payload);
    } catch (err) {
      if (!isCancelledError(err)) onError?.();
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
      disabled={disabled || busy}
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

function maskEmail(email: string | null | undefined): string {
  const [local, domain] = String(email).split('@');
  if (!domain) return String(email || '');
  const shown = local.slice(0, Math.min(2, local.length));
  return `${shown}${'•'.repeat(Math.max(local.length - shown.length, 2))}@${domain}`;
}

export interface AuthActionResult {
  success: boolean;
  needsVerification?: boolean;
  email?: string | null;
  mailSent?: boolean;
  debugOtp?: string;
  message?: string;
  alreadyVerified?: boolean;
}

interface AuthPanelProps {
  loginUser: (username: string, password: string) => Promise<AuthActionResult>;
  registerUser: (email: string, password: string) => Promise<AuthActionResult>;
  requestOtp: (email: string) => Promise<AuthActionResult>;
  verifyOtp: (email: string, code: string) => Promise<AuthActionResult>;
  forgotPassword: (email: string) => Promise<AuthActionResult>;
  resetPassword: (email: string, code: string, password: string) => Promise<AuthActionResult>;
  loginWithGoogle: (payload: string | { credential?: string; code?: string }) => Promise<AuthActionResult>;
}

export function AuthPanel({
  loginUser,
  registerUser,
  requestOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
}: AuthPanelProps) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(OTP_LEN).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [mailSent, setMailSent] = useState(true);
  const [debugOtp, setDebugOtp] = useState('');
  const [googleClientId, setGoogleClientId] = useState(
    () => import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '',
  );
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const formStageRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const entranceDoneRef = useRef(false);
  const { theme, toggleTheme } = useTheme();
  const otpValue = otpDigits.join('');
  const isOtpMode = mode === 'verify' || mode === 'reset';
  const showAuthTabs = mode === 'login' || mode === 'register' || mode === 'register-step-2';
  const showGoogle = mode === 'login' || mode === 'register';

  // Premium entrance — shell, showcase copy, form (respects reduced motion)
  useGSAP(() => {
    if (prefersReducedMotion() || !shellRef.current) {
      if (shellRef.current) gsap.set(shellRef.current, { opacity: 1, clearProps: 'filter' });
      entranceDoneRef.current = true;
      return;
    }

    const shell = shellRef.current;
    const showcase = shell.querySelectorAll(
      '.auth-showcase__eyebrow, .auth-showcase__title, .auth-showcase__copy, .auth-showcase__art'
    );
    const stageBits = shell.querySelectorAll('.auth-form-stage > *');

    gsap.set([shell, showcase, stageBits], { clearProps: 'all' });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
    });

    // Never leave the shell invisible if GSAP is interrupted
    const safety = window.setTimeout(() => {
      if (!shellRef.current) return;
      gsap.set(shellRef.current, { opacity: 1, clearProps: 'filter,transform' });
      entranceDoneRef.current = true;
    }, 1800);

    tl.eventCallback('onComplete', () => {
      window.clearTimeout(safety);
      entranceDoneRef.current = true;
    });

    tl.fromTo(
      shell,
      { opacity: 0, y: 32, scale: 0.96, filter: 'blur(8px)' },
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.85 },
    )
      .fromTo(
        showcase,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.09 },
        '-=0.45',
      )
      .fromTo(
        stageBits,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.42, stagger: 0.055, clearProps: 'transform' },
        '-=0.3',
      );

    // Soft ambient float on desk art
    if (artRef.current) {
      gsap.to(artRef.current.querySelector('.auth-art-screen'), {
        y: -4,
        duration: 3.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      gsap.to(artRef.current.querySelector('.auth-art-book'), {
        y: -6,
        rotation: 10,
        duration: 3.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.4,
      });
    }
  }, { scope: pageRef });

  // Mode switch — cross-fade / rise the form stage
  useGSAP(() => {
    if (!entranceDoneRef.current || prefersReducedMotion() || !formStageRef.current) return;
    const nodes = formStageRef.current.children;
    if (!nodes?.length) return;
    gsap.fromTo(
      nodes,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.045,
        ease: 'power2.out',
        clearProps: 'transform',
      },
    );
  }, { dependencies: [mode], scope: formStageRef });

  // Subtle pointer parallax on showcase art
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const page = pageRef.current;
    const art = artRef.current;
    if (!page || !art) return undefined;

    const onMove = (e: globalThis.PointerEvent) => {
      const rect = page.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(art, {
        x: x * 12,
        y: y * 8,
        duration: 0.7,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
    const onLeave = () => {
      gsap.to(art, { x: 0, y: 0, duration: 0.8, ease: 'power3.out' });
    };

    page.addEventListener('pointermove', onMove);
    page.addEventListener('pointerleave', onLeave);
    return () => {
      page.removeEventListener('pointermove', onMove);
      page.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const resetAuthFields = (opts: { keepEmail?: boolean } = {}) => {
    const { keepEmail = false } = opts;
    if (!keepEmail) setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setOtpDigits(Array(OTP_LEN).fill(''));
    setResendIn(0);
    setMailSent(true);
    setDebugOtp('');
  };

  const switchAuthMode = (nextMode: string) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetAuthFields();
  };

  useEffect(() => {
    if (googleClientId) return undefined;
    let cancelled = false;

    const applyId = (id: unknown) => {
      const value = String(id || '').trim();
      if (!cancelled && value) setGoogleClientId(value);
    };

    apiService.get('/auth/google-config').then((data) => {
      applyId(data?.clientId);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [googleClientId]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const focusOtp = (index: number) => {
    otpRefs.current[index]?.focus();
    otpRefs.current[index]?.select?.();
  };

  const setOtpFromString = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LEN).split('');
    const next = Array(OTP_LEN).fill('');
    digits.forEach((d, i) => { next[i] = d; });
    setOtpDigits(next);
    requestAnimationFrame(() => focusOtp(Math.min(digits.length, OTP_LEN - 1)));
  };

  const handleOtpChange = (index: number, value: string) => {
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

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
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

  const goToVerify = (addr: string, opts: { mailSent?: boolean; debugOtp?: string } = {}) => {
    setEmail(addr);
    setMode('verify');
    setOtpDigits(Array(OTP_LEN).fill(''));
    setResendIn(30);
    setMailSent(opts.mailSent !== false);
    setDebugOtp(import.meta.env.DEV ? (opts.debugOtp || '') : '');
    requestAnimationFrame(() => focusOtp(0));
  };

  const handleGoogleAuth = async (payload: { credential?: string; code?: string } | string) => {
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

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toastAuthError('Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginUser(email.trim(), password);
      if (res.needsVerification) {
        goToVerify(res.email || email.trim(), {
          mailSent: res.mailSent,
          debugOtp: res.debugOtp,
        });
        showAppToast(
          res.mailSent
            ? 'Please verify your email to continue.'
            : (import.meta.env.DEV && res.debugOtp
              ? `Email not delivered — use code ${res.debugOtp}`
              : 'Please verify your email. Delivery failed; check SMTP or spam.'),
          {
            variant: res.mailSent ? 'warn' : 'warn',
            title: 'Verification required',
            durationMs: res.mailSent ? 5000 : 12000,
          },
        );
        return;
      }
      if (!res.success) {
        const msg = String(res.message || '');
        if (/timed out|network|connection/i.test(msg)) {
          toastAuthError('Network error. Check your connection and try again.');
        } else {
          toastAuthError('Invalid email or password.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toastAuthError('Please enter a valid email address.');
      return;
    }
    setMode('register-step-2');
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!password || password.length < 8) {
      toastAuthError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toastAuthError('Password must include at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      toastAuthError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerUser(trimmed, password);
      if (res.needsVerification) {
        goToVerify(res.email || trimmed, {
          mailSent: res.mailSent,
          debugOtp: res.debugOtp,
        });
        showAppToast(
          res.mailSent
            ? 'A verification code has been sent to your email.'
            : (import.meta.env.DEV && res.debugOtp
              ? `Email delivery failed — use code ${res.debugOtp}`
              : 'Email delivery failed. Check SMTP settings or spam folder.'),
          {
            variant: res.mailSent ? 'success' : 'warn',
            title: res.mailSent ? 'Check your inbox' : 'OTP not emailed',
            durationMs: res.mailSent ? 5000 : 12000,
          },
        );
        return;
      }
      if (!res.success) {
        toastAuthError(res.message || 'Unable to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
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
      } else {
        const msg = String(res.message || '');
        if (/expired/i.test(msg)) {
          toastAuthError('Code expired. Request a new one.');
        } else if (/too many/i.test(msg)) {
          toastAuthError('Too many attempts. Request a new code.');
        } else {
          toastAuthError('Incorrect verification code.');
        }
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
        const delivered = res.mailSent !== false;
        setMailSent(delivered);
        setDebugOtp(import.meta.env.DEV ? (res.debugOtp || '') : '');
        setOtpDigits(Array(OTP_LEN).fill(''));
        showAppToast(
          delivered
            ? 'A new code has been sent to your email.'
            : (import.meta.env.DEV && res.debugOtp ? `Use code ${res.debugOtp}` : 'Could not email the code. Try again.'),
          { variant: delivered ? 'success' : 'warn', durationMs: 10000 },
        );
        requestAnimationFrame(() => focusOtp(0));
      } else {
        toastAuthError('Unable to resend code. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
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
        toastAuthError(res.message || 'Unable to send reset code. Please try again.');
        return;
      }
      setEmail(res.email || email.trim());
      setMode('reset');
      setPassword('');
      setConfirmPassword('');
      setOtpDigits(Array(OTP_LEN).fill(''));
      setResendIn(30);
      const delivered = res.mailSent !== false;
      setMailSent(delivered);
      showAppToast(
        delivered
          ? 'If that email exists, a reset code was sent. Check your inbox (and spam).'
          : (import.meta.env.DEV && res.debugOtp
            ? `Use code ${res.debugOtp}`
            : 'Could not email the code. Check SMTP settings or try again.'),
        { variant: delivered ? 'success' : 'warn', durationMs: 10000 },
      );
      requestAnimationFrame(() => focusOtp(0));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpValue)) {
      toastAuthError('Enter the 6-digit code from your email.');
      return;
    }
    if (!password || password.length < 8) {
      toastAuthError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toastAuthError('Password must include at least one letter and one number.');
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
        toastAuthError(res.message || 'Password reset failed. Please try again.');
        return;
      }
      showAppToast('Password updated. Sign in with your new password.', {
        variant: 'success',
      });
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setOtpDigits(Array(OTP_LEN).fill(''));
      setShowPassword(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageHeading = {
    login: 'Sign in',
    register: 'Create account',
    'register-step-2': 'Set password',
    verify: 'Verify email',
    forgot: 'Reset password',
    reset: 'Choose new password',
  }[mode] || 'Sign in';

  return (
    <div className="auth-page" ref={pageRef}>
      <div className="auth-page__wallpaper" aria-hidden="true" />
      <div className="auth-page__veil" aria-hidden="true" />
      <div className="auth-page__orb auth-page__orb--a" aria-hidden="true" />
      <div className="auth-page__orb auth-page__orb--b" aria-hidden="true" />
      <Helmet>
        <title>{pageTitle(pageHeading)}</title>
      </Helmet>

      <button type="button" className="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-shell" ref={shellRef}>
        <aside className="auth-showcase" aria-hidden="true">
          <div className="auth-showcase__glow" />
          <div className="auth-showcase__grid" />
          <p className="auth-showcase__eyebrow">SSC · Banking · Railways · UPSC</p>
          <h2 className="auth-showcase__title">
            Prep that feels
            <span> focused.</span>
          </h2>
          <p className="auth-showcase__copy">
            Drills, mocks, notes, and battles — one calm workspace for every exam day.
          </p>
          <div className="auth-showcase__art" ref={artRef}>
            <div className="auth-art-desk">
              <div className="auth-art-lamp" />
              <div className="auth-art-screen">
                <span />
                <span />
                <span />
              </div>
              <div className="auth-art-book" />
              <div className="auth-art-chip auth-art-chip--a">+12 streak</div>
              <div className="auth-art-chip auth-art-chip--b">Mock 84%</div>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-form-stage" ref={formStageRef}>
          <div className="auth-brand">
            <div className={`auth-brand-icon ${isOtpMode ? 'auth-brand-icon--otp' : ''}`} style={(!isOtpMode && mode !== 'forgot' && mode !== 'reset') ? { background: 'transparent', border: 'none', boxShadow: 'none' } : {}}>
              {mode === 'forgot' || mode === 'reset'
                ? <KeyRound size={28} />
                : mode === 'verify'
                  ? <ShieldCheck size={28} />
                  : <img src="/logo.png" alt="App Logo" className="auth-brand-logo" />}
            </div>
            <p className="auth-brand-tagline">{APP_NAME}</p>
            <h1>
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create account'}
              {mode === 'register-step-2' && 'Set a password'}
              {mode === 'verify' && 'Verify email'}
              {mode === 'forgot' && 'Reset password'}
              {mode === 'reset' && 'New password'}
            </h1>
            <p className="auth-brand-action">
              {mode === 'login' && 'Sign in to continue your prep.'}
              {mode === 'register' && 'Start your exam prep in a minute.'}
              {mode === 'register-step-2' && 'Almost there, secure your account.'}
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
                onClick={() => switchAuthMode('login')}
              >
                <LogIn size={15} /> Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register' || mode === 'register-step-2'}
                className={mode === 'register' || mode === 'register-step-2' ? 'active' : ''}
                onClick={() => switchAuthMode('register')}
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
                    resetAuthFields({ keepEmail: true });
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
              onClick={() => switchAuthMode('login')}
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="auth-form" noValidate>
            <div className={`auth-otp-banner ${mailSent ? '' : 'auth-otp-banner--warn'}`}>
              <Mail size={18} aria-hidden />
              <div>
                <strong>{mailSent ? 'Reset code sent' : 'Email not delivered'}</strong>
                <span>{maskEmail(email)}</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reset-otp-0">Reset code</label>
              <div
                className="otp-boxes"
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
                onClick={() => switchAuthMode('login')}
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
          <form onSubmit={handleNextStep} className="auth-form" noValidate>
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
            <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
              <span>Continue</span><ArrowRight size={18} />
            </button>
          </form>
        )}

        {mode === 'register-step-2' && (
          <form onSubmit={handleRegister} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="reg-pass">Create a password</label>
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
            </div>
            <div className="form-group">
              <label htmlFor="reg-pass-confirm">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" aria-hidden />
                <input
                  id="reg-pass-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
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
            <div className="auth-otp-actions" style={{ marginTop: '16px', justifyContent: 'center' }}>
              <button
                type="button"
                className="auth-back-link"
                disabled={isSubmitting}
                onClick={() => setMode('register')}
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="auth-form auth-form--otp" noValidate>
            <div className={`auth-otp-banner ${mailSent ? '' : 'auth-otp-banner--warn'}`}>
              <Mail size={18} aria-hidden />
              <div>
                <strong>{mailSent ? 'Code sent to your email' : 'Email not delivered'}</strong>
                <span>{maskEmail(email)}</span>
              </div>
            </div>

            {import.meta.env.DEV && debugOtp && (
              <div className="auth-otp-debug" role="status">
                <span>Local debug code</span>
                <kbd>{debugOtp}</kbd>
              </div>
            )}

            <div className="form-group auth-otp-group">
              <label htmlFor="otp-0">Enter 6-digit code</label>
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
              <p className="auth-hint">
                {mailSent
                  ? 'Check inbox and spam. Code expires in 10 minutes.'
                  : 'Fix SMTP in backend/.env, or use the debug code above.'}
              </p>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting || otpValue.length !== OTP_LEN}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="spin-icon" /><span>Verifying…</span></>
              ) : (
                <><span>Verify & continue</span><ArrowRight size={18} /></>
              )}
            </button>
            <div className="auth-otp-actions">
              <button
                type="button"
                className="auth-back-link"
                disabled={isSubmitting}
                onClick={() => switchAuthMode('login')}
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
              clientId={googleClientId}
              disabled={isSubmitting}
              onAuth={handleGoogleAuth}
              onError={handleGoogleError}
            />
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
