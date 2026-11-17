import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badgeText?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, badgeText }) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight text-balance">
            {title}
          </h1>
          {badgeText && (
            <span className="text-xs font-medium text-slate-500">
              · {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 max-w-3xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 no-print">
          {actions}
        </div>
      )}
    </div>
  );
};
