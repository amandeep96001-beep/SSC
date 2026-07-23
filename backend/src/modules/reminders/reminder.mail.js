import { sendMail } from '../../modules/auth/mail.util.js';

export async function sendReminderEmail({ email, title, message, time }) {
  if (!email) return { sent: false, reason: 'no_email' };

  const subject = `📚 Study reminder: ${title}`;
  const bodyText = [
    title,
    message || 'Time to study — open ExamPrep and start your session.',
    '',
    `Scheduled for ${time}`,
    '',
    '— ExamPrep',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#e8eef8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8eef8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(99,120,200,0.12);">
        <tr><td style="padding:28px 28px 8px;background:linear-gradient(165deg,#eef0ff 0%,#ffffff 55%);">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6366f1;">Study reminder</div>
          <h1 style="margin:10px 0 8px;font-size:22px;line-height:1.25;font-weight:800;color:#14182a;">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#4a5168;">${escapeHtml(message || 'Time to study — open ExamPrep and start your session.')}</p>
        </td></tr>
        <tr><td style="padding:16px 28px 28px;">
          <div style="padding:12px 14px;border-radius:12px;background:#eef2fb;font-size:13px;color:#4a5168;">
            Scheduled for <strong style="color:#252b42;">${escapeHtml(time)}</strong>
          </div>
          <p style="margin:16px 0 0;font-size:12px;color:#9aa3b8;">ExamPrep · Keep your streak going</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({
    to: email,
    subject,
    text: bodyText,
    html,
  });
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
