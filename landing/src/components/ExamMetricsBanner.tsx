const TICKER = [
  'CGL',
  'CHSL',
  'GD',
  'CPO',
  'MTS',
  'Notes',
  'Drills',
  'Mocks',
  'Topic tests',
  'Wrong-question list',
];

export function ExamMetricsBanner() {
  const loop = [...TICKER, ...TICKER];
  return (
    <div className="lp-ticker" aria-label="What you can practise">
      <div className="lp-ticker-track">
        {loop.map((item, i) => (
          <span className="lp-ticker-item" key={`${item}-${i}`}>
            <span aria-hidden="true">▸</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
