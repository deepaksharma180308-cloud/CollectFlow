/**
 * Format numeric amount in Indian Rupee (INR) notation: ₹12,45,000
 */
export function formatINR(amount: number, showDecimals = false): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(Math.abs(safe));
  return safe < 0 ? `-${formatted}` : formatted;
}

/**
 * Format compact Indian currency (e.g. ₹14.2L, ₹1.8Cr)
 */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return formatINR(amount);
}

/**
 * Format ISO YYYY-MM-DD date string to Indian DD/MM/YYYY format
 */
export function formatDateIN(isoDate?: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Compute days overdue relative to reference "today" (2026-11-17)
 */
export const DEMO_TODAY = '2026-11-17';

export function getDaysOverdue(dueDateIso: string, referenceDateIso = DEMO_TODAY): number {
  const due = new Date(`${dueDateIso}T00:00:00`);
  const ref = new Date(`${referenceDateIso}T00:00:00`);
  const diffMs = ref.getTime() - due.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export type AgeingBucket = 'Not due' | '1–30 days' | '31–60 days' | '61–90 days' | 'Above 90 days';

export function getAgeingBucket(dueDateIso: string): AgeingBucket {
  const days = getDaysOverdue(dueDateIso);
  if (days <= 0) return 'Not due';
  if (days <= 30) return '1–30 days';
  if (days <= 60) return '31–60 days';
  if (days <= 90) return '61–90 days';
  return 'Above 90 days';
}

export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return true; // optional for unregistered dealers
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase());
}

export function exportRowsToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
