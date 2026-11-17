import React from 'react';
import { AlertCircle, CheckCircle2, Clock, PauseCircle, RefreshCw, XCircle } from 'lucide-react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const STATUS_MAP: Record<string, { tone: Tone; icon?: React.ReactNode }> = {
  Active: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Paid: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Fulfilled: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Completed: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Resolved: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Posted: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Received: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Reconciled: { tone: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Open: { tone: 'info', icon: <Clock className="w-3.5 h-3.5" /> },

  Partial: { tone: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
  'Partially Fulfilled': { tone: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
  Pending: { tone: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
  Unpaid: { tone: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
  'On Hold': { tone: 'warning', icon: <PauseCircle className="w-3.5 h-3.5" /> },
  'Under Review': { tone: 'purple', icon: <RefreshCw className="w-3.5 h-3.5" /> },
  Rescheduled: { tone: 'purple', icon: <RefreshCw className="w-3.5 h-3.5" /> },
  'Low Stock': { tone: 'warning', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  Medium: { tone: 'warning' },
  High: { tone: 'danger' },

  Overdue: { tone: 'danger', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  Missed: { tone: 'danger', icon: <XCircle className="w-3.5 h-3.5" /> },
  Urgent: { tone: 'danger', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  'Out of Stock': { tone: 'danger', icon: <XCircle className="w-3.5 h-3.5" /> },

  Draft: { tone: 'neutral' },
  Archived: { tone: 'neutral' },
  Closed: { tone: 'neutral' },
  Inactive: { tone: 'neutral' },
  Low: { tone: 'neutral' },
  Unreconciled: { tone: 'warning' },
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-red-50 text-red-700 border-red-200/80',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  purple: 'bg-[#675BD3]/10 text-[#5447C4] border-[#675BD3]/25',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface StatusBadgeProps {
  status: string;
  tone?: Tone;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, tone, showIcon = true }) => {
  const mapped = STATUS_MAP[status] || { tone: 'neutral' as Tone };
  const resolvedTone = tone || mapped.tone;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${TONE_CLASSES[resolvedTone]}`}
    >
      {showIcon && mapped.icon}
      <span>{status}</span>
    </span>
  );
};
