const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: unknown): string {
  return String(raw || '').trim().toLowerCase();
}

/** Gmail aliases (dots / plus-tags) so lookup matches stored variants. */
export function emailAliases(raw: unknown): string[] {
  const email = normalizeEmail(raw);
  if (!email) return [];
  const out = new Set<string>([email]);
  const at = email.lastIndexOf('@');
  if (at <= 0) return [...out];
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const base = local.split('+')[0].replace(/\./g, '');
    out.add(`${base}@gmail.com`);
    out.add(`${base}@googlemail.com`);
  }
  return [...out];
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function resolveRoleByEmail(email: string): 'user' | 'admin' {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || '');
  if (adminEmail && email === adminEmail) return 'admin';
  return 'user';
}
