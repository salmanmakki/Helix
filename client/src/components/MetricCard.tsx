import React from 'react';
import Card from './Card';

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  className?: string;
  icon?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  trendLabel = '',
  className = '',
  icon
}) => {
  return (
    <Card className={`flex flex-col gap-2 p-6 ${className}`}>
      <div className="flex justify-between items-center">
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{title}</p>
        {icon && <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>}
      </div>
      <p className="font-display-lg text-4xl font-black leading-tight text-primary mt-2">{value}</p>
      
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs font-data-mono">
          {trendDirection === 'up' && (
            <span className="text-green-600 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm font-bold">arrow_upward</span>
              {trend}
            </span>
          )}
          {trendDirection === 'down' && (
            <span className="text-error flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm font-bold">arrow_downward</span>
              {trend}
            </span>
          )}
          {trendDirection === 'neutral' && (
            <span className="text-secondary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm font-bold">local_fire_department</span>
              {trend}
            </span>
          )}
          {trendLabel && <span className="text-on-surface-variant opacity-75 ml-1">{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
