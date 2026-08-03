/**
 * Circular progress ring for overall / subject completion.
 */
export function ProgressRing({
  percent = 0,
  size = 88,
  stroke = 8,
  label,
  tone = 'primary',
  className = '',
}) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={`roadmap-ring roadmap-ring--${tone} ${className}`.trim()}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label || 'Progress'}: ${pct}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="roadmap-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="roadmap-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="roadmap-ring__label">
        <strong>{pct}%</strong>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
}
