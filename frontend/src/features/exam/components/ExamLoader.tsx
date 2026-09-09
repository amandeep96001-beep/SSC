interface ExamLoaderProps {
  title?: string;
  subtitle?: string;
}

export function ExamLoader({
  title = 'Preparing your exam',
  subtitle = 'Questions are loading. The timer starts when the paper is ready.',
}: ExamLoaderProps) {
  return (
    <div className="exam-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="app-loader-spinner exam-loader__spinner" />
      <p className="exam-loader__title">{title}</p>
      {subtitle ? <p className="exam-loader__sub">{subtitle}</p> : null}
    </div>
  );
}
