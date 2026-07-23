import { sendMail } from '../../modules/auth/mail.util.js';

export async function sendReminderEmail({ email, title, message, time }) {
  if (!email) return { sent: false, reason: 'no_email' };

  const reminderTitle = String(title || 'Study session').trim() || 'Study session';
  const note = String(message || '').trim();
  const timeLabel = String(time || '').trim();

  const subject = `ExamPrep — ${reminderTitle}`;
  const lead = note || 'Your study time is here. Open ExamPrep and start your session.';

  const bodyText = [
    'ExamPrep',
    '',
    reminderTitle,
    lead,
    ...(timeLabel ? [`Scheduled for ${timeLabel}`, ''] : ['']),
    'Open the app and stay on track.',
    '',
    '— Team ExamPrep',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#edf1f8;font-family:Arial,Helvetica,sans-serif;color:#1a1f2e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf1f8;padding:36px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #d8deea;">
        <tr>
          <td style="padding:22px 28px 18px;background:#4f46e5;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;height:40px;border-radius:12px;background:#ffffff;text-align:center;vertical-align:middle;font-size:14px;font-weight:800;letter-spacing:-0.02em;color:#4f46e5;line-height:40px;">EP</td>
                <td style="padding-left:12px;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;vertical-align:middle;">ExamPrep</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Study reminder</p>
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:800;color:#14182a;">${escapeHtml(reminderTitle)}</h1>
            <p style="margin:0;font-size:15px;line-height:1.55;color:#3f4658;">${escapeHtml(lead)}</p>
          </td>
        </tr>
        ${timeLabel ? `<tr>
          <td style="padding:16px 28px 8px;">
            <div style="padding:12px 14px;border-radius:12px;background:#f3f5fb;font-size:13px;color:#4a5168;">
              Scheduled for <strong style="color:#1a1f2e;">${escapeHtml(timeLabel)}</strong>
            </div>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:20px 28px 28px;">
            <p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:#6b7280;">Open ExamPrep when you are ready and keep your streak going.</p>
            <p style="margin:0;font-size:12px;color:#9aa3b8;">— Team ExamPrep</p>
          </td>
        </tr>
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
