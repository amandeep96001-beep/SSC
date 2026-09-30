import { STATS_HIGHLIGHTS } from '../data/landingData';

export function ExamMetricsBanner() {
  return (
    <div className="lp-metrics-strip" aria-label="Platform Highlights">
      <div className="lp-metrics-container">
        {STATS_HIGHLIGHTS.map((stat, i) => (
          <div key={i} className="lp-metric-item">
            <span className="lp-metric-val">{stat.value}</span>
            <span className="lp-metric-lbl">{stat.label}</span>
            <span className="lp-metric-cap">{stat.caption}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
