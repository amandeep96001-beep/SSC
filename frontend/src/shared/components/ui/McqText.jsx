import { formatMcqHtml } from '@/shared/utils/formatMcqText';
import 'katex/dist/katex.min.css';

/** Renders MCQ stem/option text with underlines, blanks, and TeX math via KaTeX. */
export function McqText({ text, className, as: Tag = 'span' }) {
  const html = formatMcqHtml(text);
  if (!html) return null;
  const cls = ['mcq-rich', className].filter(Boolean).join(' ');

  return (
    <Tag
      className={cls}
      // KaTeX has already rendered math to HTML inside formatMcqHtml
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
