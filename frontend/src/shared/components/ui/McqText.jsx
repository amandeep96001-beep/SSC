import { formatMcqHtml } from '@/shared/utils/formatMcqText';

/** Renders MCQ stem/option text with underlines and blanks. */
export function McqText({ text, className, as: Tag = 'span' }) {
  const html = formatMcqHtml(text);
  if (!html) return null;
  const cls = ['mcq-rich', className].filter(Boolean).join(' ');
  return (
    <Tag
      className={cls}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
