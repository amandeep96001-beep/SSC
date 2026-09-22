import type { ReactNode } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { APP_NAME } from '@/shared/brand';
import './guest-locked.css';

interface GuestLockedPanelProps {
  title: string;
  blurb: string;
  bullets?: string[];
  onSignIn: () => void;
  children?: ReactNode;
}

/** Soft gate — show what the feature offers, ask guest to sign in to use it. */
export function GuestLockedPanel({
  title,
  blurb,
  bullets = [],
  onSignIn,
  children,
}: GuestLockedPanelProps) {
  return (
    <div className="guest-locked">
      {children}
      <div className="guest-locked__card">
        <div className="guest-locked__icon" aria-hidden="true">
          <Lock size={22} />
        </div>
        <h2 className="guest-locked__title">{title}</h2>
        <p className="guest-locked__blurb">{blurb}</p>
        {bullets.length > 0 && (
          <ul className="guest-locked__list">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <button type="button" className="guest-locked__cta" onClick={onSignIn}>
          <LogIn size={16} />
          Sign in to unlock
        </button>
        <p className="guest-locked__hint">
          Free on {APP_NAME} — browse the rest of the app without an account.
        </p>
      </div>
    </div>
  );
}
