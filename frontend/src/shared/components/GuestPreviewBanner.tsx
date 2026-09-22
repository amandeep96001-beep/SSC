import type { ReactNode } from 'react';
import { LogIn } from 'lucide-react';
import './guest-preview.css';

interface GuestPreviewBannerProps {
  /** One short line — what this screen does */
  line: string;
  onSignIn: () => void;
  cta?: string;
}

/** Soft preview strip — show the real UI, ask login only to use/save. */
export function GuestPreviewBanner({
  line,
  onSignIn,
  cta = 'Sign in to save yours',
}: GuestPreviewBannerProps) {
  return (
    <div className="guest-preview-banner" role="status">
      <div className="guest-preview-banner__pulse" aria-hidden="true" />
      <p className="guest-preview-banner__line">{line}</p>
      <button type="button" className="guest-preview-banner__cta" onClick={onSignIn}>
        <LogIn size={14} />
        {cta}
      </button>
    </div>
  );
}

interface GuestPreviewShellProps {
  line: string;
  onSignIn: () => void;
  cta?: string;
  children: ReactNode;
}

export function GuestPreviewShell({ line, onSignIn, cta, children }: GuestPreviewShellProps) {
  return (
    <div className="guest-preview-shell">
      <GuestPreviewBanner line={line} onSignIn={onSignIn} cta={cta} />
      <div className="guest-preview-shell__body">{children}</div>
    </div>
  );
}
