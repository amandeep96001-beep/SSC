import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Camera, Loader2, Trash2, X } from 'lucide-react';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { compressImageToAvatarDataUrl } from '@/shared/utils/avatarCompress';
import { errorMessage, type AppUser } from '@/types/app';
import './profile-modal.css';

interface ProfileModalProps {
  user: AppUser;
  open: boolean;
  onClose: () => void;
  onSave: (payload: { displayName?: string | null; avatarUrl?: string | null }) => Promise<{
    success: boolean;
    message?: string;
  }>;
}

export function ProfileModal({ user, open, onClose, onSave }: ProfileModalProps) {
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setDisplayName(user.displayName || '');
    setAvatarUrl(user.avatarUrl || null);
    setAvatarDirty(false);
    setError('');
    setOkMsg('');
  }, [open, user.displayName, user.avatarUrl]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const previewUser: AppUser = {
    ...user,
    displayName: displayName.trim() || user.displayName,
    avatarUrl,
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setOkMsg('');
    setCompressing(true);
    try {
      const dataUrl = await compressImageToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
      setAvatarDirty(true);
    } catch (err) {
      setError(errorMessage(err) || 'Could not process photo.');
    } finally {
      setCompressing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = () => {
    setAvatarUrl(null);
    setAvatarDirty(true);
    setOkMsg('');
    setError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOkMsg('');
    try {
      const payload: { displayName?: string | null; avatarUrl?: string | null } = {
        displayName: displayName.trim() || null,
      };
      if (avatarDirty) {
        payload.avatarUrl = avatarUrl;
      }
      const res = await onSave(payload);
      if (!res.success) {
        setError(res.message || 'Could not save profile.');
        return;
      }
      setOkMsg('Profile saved.');
      setAvatarDirty(false);
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setError(errorMessage(err) || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="profile-modal__head">
          <h2 id={titleId}>Edit profile</h2>
          <button type="button" className="profile-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <form className="profile-modal__body" onSubmit={submit}>
          <div className="profile-modal__avatar-block">
            <UserAvatar user={previewUser} size={88} className="profile-modal__avatar" />
            <div className="profile-modal__avatar-actions">
              <button
                type="button"
                className="profile-modal__btn"
                disabled={compressing || saving}
                onClick={() => fileRef.current?.click()}
              >
                {compressing ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
                {compressing ? 'Processing…' : 'Upload photo'}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  className="profile-modal__btn profile-modal__btn--ghost"
                  disabled={saving || compressing}
                  onClick={removePhoto}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                hidden
                onChange={(e) => void onPickFile(e.target.files?.[0])}
              />
              <p className="profile-modal__hint">JPEG / PNG / WebP · auto-resized · one device login only</p>
            </div>
          </div>

          <label className="profile-modal__field">
            <span>Display name</span>
            <input
              type="text"
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How others see you"
              autoComplete="nickname"
            />
          </label>

          <label className="profile-modal__field">
            <span>Username</span>
            <input type="text" value={user.username} disabled readOnly />
            <small>Username can’t be changed (progress is tied to it).</small>
          </label>

          {user.email ? (
            <label className="profile-modal__field">
              <span>Email</span>
              <input type="email" value={user.email} disabled readOnly />
            </label>
          ) : null}

          {error ? <p className="profile-modal__error" role="alert">{error}</p> : null}
          {okMsg ? <p className="profile-modal__ok" role="status">{okMsg}</p> : null}

          <div className="profile-modal__footer">
            <button type="button" className="profile-modal__btn profile-modal__btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="profile-modal__btn profile-modal__btn--primary" disabled={saving || compressing}>
              {saving ? <Loader2 size={14} className="spin" /> : null}
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
