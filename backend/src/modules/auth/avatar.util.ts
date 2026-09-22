import { createHash } from 'node:crypto';

/** Max decoded image bytes (~120KB) — keeps Mongo docs lean. */
export const AVATAR_MAX_BYTES = 120_000;
/** Max data-URL string length after base64 encoding. */
export const AVATAR_MAX_CHARS = 180_000;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export type AvatarValidation =
  | { ok: true; dataUrl: string }
  | { ok: false; message: string };

/**
 * Accepts a browser data-URL (client should resize to ≤256px JPEG first).
 * Rejects anything that isn't a small image data URL.
 */
export function validateAvatarDataUrl(raw: unknown): AvatarValidation {
  if (raw === null || raw === '') {
    return { ok: true, dataUrl: '' };
  }
  if (typeof raw !== 'string') {
    return { ok: false, message: 'Invalid avatar payload.' };
  }

  const dataUrl = raw.trim();
  if (!dataUrl) {
    return { ok: true, dataUrl: '' };
  }

  if (dataUrl.length > AVATAR_MAX_CHARS) {
    return { ok: false, message: 'Profile photo is too large. Use a smaller image (under ~100KB).' };
  }

  const match = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) {
    return { ok: false, message: 'Profile photo must be a JPEG, PNG, or WebP image.' };
  }

  const mime = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, message: 'Only JPEG, PNG, or WebP photos are allowed.' };
  }

  const b64 = match[2].replace(/\s+/g, '');
  let bytes: number;
  try {
    bytes = Buffer.from(b64, 'base64').byteLength;
  } catch {
    return { ok: false, message: 'Invalid image data.' };
  }

  if (bytes < 32) {
    return { ok: false, message: 'Image looks empty or corrupt.' };
  }
  if (bytes > AVATAR_MAX_BYTES) {
    return { ok: false, message: 'Profile photo is too large. Use a smaller image (under ~100KB).' };
  }

  // Soft magic-byte check
  const buf = Buffer.from(b64.slice(0, 48), 'base64');
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isWebp = buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) {
    return { ok: false, message: 'File does not look like a valid image.' };
  }

  return { ok: true, dataUrl: `data:${mime};base64,${b64}` };
}

export function avatarFingerprint(dataUrl: string | null | undefined): string {
  if (!dataUrl) return '';
  return createHash('sha256').update(dataUrl).digest('hex').slice(0, 16);
}
