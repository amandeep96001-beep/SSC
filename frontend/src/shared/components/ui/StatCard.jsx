export function StatCard({ icon: Icon, label, value, variant = 'blue', className = '' }) {
  return (
    <div className={`stat-card-premium stat-card-premium--${variant} ${className}`.trim()}>
      <div className="stat-card-premium__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="stat-card-premium__content">
        <span className="stat-card-premium__label">{label}</span>
        <span className="stat-card-premium__value">{value}</span>
      </div>
    </div>
  );
}
