import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { isHostedRuntime } from '../../config/env.config.js';

const LOGO_CID = 'examprep-logo';
const LOGO_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../assets/logo.png',
);

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_USER
    && smtpPass()
  );
}

function smtpPass() {
  return String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
}

/** Keep auth APIs from hanging when SMTP host is unreachable. */
const SMTP_CONNECT_MS = 8_000;
const SMTP_SOCKET_MS = 10_000;

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    connectionTimeout: SMTP_CONNECT_MS,
    greetingTimeout: SMTP_CONNECT_MS,
    socketTimeout: SMTP_SOCKET_MS,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPass(),
    },
  });
}

function publicLogoUrl() {
  const origin = String(process.env.FRONTEND_URL || 'https://myexamprep-theta.vercel.app')
    .trim()
    .replace(/\/+$/, '');
  return `${origin}/logo.png`;
}

function logoImgHtml({ size = 44, radius = 12 } = {}) {
  const src = fs.existsSync(LOGO_FILE) ? `cid:${LOGO_CID}` : publicLogoUrl();
  return `<img src="${src}" width="${size}" height="${size}" alt="ExamPrep" style="display:block;width:${size}px;height:${size}px;border-radius:${radius}px;border:0;outline:none;" />`;
}

function logoAttachment() {
  if (!fs.existsSync(LOGO_FILE)) return [];
  return [{
    filename: 'examprep-logo.png',
    path: LOGO_FILE,
    cid: LOGO_CID,
    contentType: 'image/png',
  }];
}

/**
 * Generic mail sender used by OTP + study reminders.
 * @returns {{ sent: boolean, reason?: string }}
 */
export async function sendMail({ to, subject, text, html, attachments = [] }) {
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@examprep.local')
    .trim()
    .replace(/^["']+|["']+$/g, '');
  if (!to) return { sent: false, reason: 'no_recipient' };

  if (!smtpConfigured()) {
    if (isHostedRuntime()) {
      throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
    }
    console.info(`[mail] SMTP not configured — would send to ${to}: ${subject}`);
    console.info(`[mail] ${text}`);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      attachments: [...logoAttachment(), ...attachments],
    });
    return { sent: true };
  } catch (err) {
    const reason = err?.message || String(err);
    console.error('[mail] SMTP send failed:', reason);
    if (isHostedRuntime()) {
      throw new Error('Unable to send email. Please try again shortly.');
    }
    return { sent: false, reason };
  }
}

function buildOtpEmailHtml(code, { title, subtitle, lead }) {
  const digits = String(code).split('').map((d) => (
    `<td style="width:42px;height:52px;text-align:center;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;letter-spacing:0;color:#1a1d2e;background:#ffffff;border:1px solid rgba(99,102,241,0.22);border-radius:12px;">${d}</td>`
  )).join('<td style="width:8px;"></td>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#e8eef8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8eef8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(99,120,200,0.12);box-shadow:0 22px 56px rgba(30,50,100,0.1);">
          <tr>
            <td style="padding:28px 28px 8px;background:linear-gradient(165deg,#eef0ff 0%,#ffffff 55%);">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:44px;height:44px;vertical-align:middle;">
                    ${logoImgHtml({ size: 44, radius: 12 })}
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-size:18px;font-weight:800;color:#14182a;letter-spacing:-0.02em;">ExamPrep</div>
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6366f1;">${subtitle}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px;">
              <h1 style="margin:12px 0 8px;font-size:22px;line-height:1.25;font-weight:800;color:#14182a;letter-spacing:-0.02em;">Your one-time code</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4a5168;">
                ${lead} It expires in <strong style="color:#252b42;">10 minutes</strong>.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 8px;">
                <tr>${digits}</tr>
              </table>
              <p style="margin:18px 0 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:800;letter-spacing:10px;color:#6366f1;">
                ${code}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <div style="margin-top:12px;padding:14px 16px;border-radius:14px;background:#eef2fb;border:1px solid rgba(99,120,200,0.1);">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#7a8299;">
                  If you didn’t request this code, you can safely ignore this email. Someone may have typed your address by mistake.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9aa3b8;">ExamPrep · SSC preparation</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send OTP email. Never returns the code to callers (do not put OTP in API responses).
 * Locally without SMTP: logs the code to the server console only.
 * @param {string} email
 * @param {string} code
 * @param {{ purpose?: 'email_verify' | 'password_reset' }} [options]
 * @returns {{ sent: boolean }}
 */
export async function sendOtpEmail(email, code, options = {}) {
  const purpose = options.purpose || 'email_verify';
  const isReset = purpose === 'password_reset';
  const subject = isReset
    ? 'Your ExamPrep password reset code'
    : 'Your ExamPrep verification code';
  const copy = isReset
    ? {
      title: 'ExamPrep password reset',
      subtitle: 'Password reset',
      lead: 'Enter this 6-digit code to reset your password.',
      text: `Your ExamPrep password reset code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
    }
    : {
      title: 'ExamPrep login code',
      subtitle: 'Email verification',
      lead: 'Enter this 6-digit code to verify your email.',
      text: `Your ExamPrep email verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
    };
  const html = buildOtpEmailHtml(code, copy);

  if (!smtpConfigured()) {
    if (isHostedRuntime()) {
      throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
    }
    // Local only — never expose this code over HTTP
    console.info(`[auth:otp] SMTP not configured — OTP for ${email}: ${code}`);
    return { sent: false };
  }

  try {
    const result = await sendMail({ to: email, subject, text: copy.text, html });
    if (result.sent) return { sent: true };
    console.error(`[auth:otp] Mail not sent for ${email}`);
    if (!isHostedRuntime()) {
      console.info(`[auth:otp] Local fallback code for ${email}: ${code}`);
      return { sent: false };
    }
    throw new Error('Unable to send verification email. Please try again shortly.');
  } catch (err) {
    console.error('[auth:otp] SMTP send failed:', err.message);
    if (!isHostedRuntime()) {
      console.info(`[auth:otp] Local fallback code for ${email}: ${code}`);
      return { sent: false };
    }
    throw new Error('Unable to send verification email. Please try again shortly.');
  }
}

export { logoImgHtml, LOGO_CID };
