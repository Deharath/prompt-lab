import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon?: ReactNode;
  className?: string;
}

const StatCard = ({
  title,
  value,
  delta,
  icon,
  className = '',
}: StatCardProps) => {
  const deltaColors = {
    positive: 'text-success',
    negative: 'text-error',
    neutral: 'text-muted',
  };

  const deltaPrefix = {
    positive: '+',
    negative: '',
    neutral: '',
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg p-4 shadow-sm transition-colors duration-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted uppercase tracking-wide">
          {title}
        </h4>
        {icon && <div className="text-muted">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? value.toFixed(3) : value}
        </div>

        {delta && (
          <div className={`text-sm font-medium ${deltaColors[delta.type]}`}>
            {deltaPrefix[delta.type]}
            {delta.value.toFixed(3)}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
