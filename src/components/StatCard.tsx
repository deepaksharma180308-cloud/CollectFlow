import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  tone?: 'default' | 'positive' | 'warning' | 'danger' | 'accent';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'neutral',
  tone = 'default',
  icon,
  onClick,
}) => {
  const valueToneClass =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'warning'
      ? 'text-amber-700'
      : tone === 'danger'
      ? 'text-red-700'
      : tone === 'accent'
      ? 'text-[#675BD3]'
      : 'text-slate-900';

  const trendClass =
    trendDirection === 'up'
      ? 'text-emerald-700'
      : trendDirection === 'down'
      ? 'text-red-600'
      : 'text-slate-500';

  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors ${
        onClick ? 'hover:border-[#675BD3]/40 hover:bg-slate-50/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#675BD3]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 truncate">{title}</span>
        {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
      </div>
      <div className={`text-xl font-bold tracking-tight tabular-nums font-[family-name:var(--font-heading)] ${valueToneClass}`}>
        {value}
      </div>
      {(subtitle || trend) && (
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {trend && (
            <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums shrink-0 ${trendClass}`}>
              {trendDirection === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trendDirection === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend}
            </span>
          )}
        </div>
      )}
    </Container>
  );
};
