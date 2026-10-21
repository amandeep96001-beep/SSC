interface BrandWordmarkProps {
  className?: string;
}

export function BrandWordmark({ className = '' }: BrandWordmarkProps) {
  return (
    <span className={`lp-brand-wordmark${className ? ` ${className}` : ''}`} aria-label="CrackuEx">
      <span className="lp-brand-cracku">Cracku</span>
      <span className="lp-brand-ex">Ex</span>
    </span>
  );
}
