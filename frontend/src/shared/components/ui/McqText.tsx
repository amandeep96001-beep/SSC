import type { ElementType } from 'react';
import { formatMcqHtml } from '@/shared/utils/formatMcqText';
import 'katex/dist/katex.min.css';

interface McqTextProps {
  text?: string | null;
  className?: string;
  as?: ElementType;
}

/** Renders MCQ stem/option text with underlines, blanks, and TeX math via KaTeX. */
export function McqText({ text, className, as: Tag = 'span' }: McqTextProps) {
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
