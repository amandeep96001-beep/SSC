import type { ComponentProps } from 'react';
import { X } from 'lucide-react';
import { AuthPanel } from '@/features/auth/components/AuthPanel';
import '@/features/auth/auth.css';

type AuthPanelProps = ComponentProps<typeof AuthPanel>;

/** Guest sign-in overlay with a always-visible Continue browsing control. */
export function AuthModal({
  onClose,
  ...authProps
}: Omit<AuthPanelProps, 'variant' | 'onClose'> & { onClose: () => void }) {
  return (
    <div
      className="auth-modal-layer"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="auth-modal-frame" role="dialog" aria-modal="true" aria-label="Sign in">
        <div className="auth-modal-chrome">
          <button type="button" className="auth-modal-dismiss" onClick={onClose}>
            <X size={14} strokeWidth={2.5} aria-hidden />
            Continue browsing
          </button>
          <span className="auth-modal-chrome__hint">Free browse · login only to save</span>
        </div>
        <AuthPanel variant="modal" onClose={onClose} {...authProps} />
      </div>
    </div>
  );
}
