import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, PhoneCall } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { SalesInvoice } from '../types';
import { AgeingBucket, formatDateIN, formatINR, getAgeingBucket, getDaysOverdue } from '../utils/format';

const BUCKETS: AgeingBucket[] = ['Not due', '1–30 days', '31–60 days', '61–90 days', 'Above 90 days'];

export const Receivables: React.FC = () => {
  const navigate = useNavigate();
  const { salesInvoices, customers } = useApp();
  const [bucketFilter, setBucketFilter] = useState<'ALL' | AgeingBucket>('ALL');

  const openReceivables = useMemo(
    () => salesInvoices.filter((i) => i.status !== 'Draft' && i.totalAmount > i.paidAmount),
    [salesInvoices]
  );

  const ageingSummary = useMemo(() => {
    const totals: Record<AgeingBucket, number> = {
      'Not due': 0,
      '1–30 days': 0,
      '31–60 days': 0,
      '61–90 days': 0,
      'Above 90 days': 0,
    };
    openReceivables.forEach((i) => {
      const b = getAgeingBucket(i.dueDate);
      totals[b] += i.totalAmount - i.paidAmount;
    });
    return totals;
  }, [openReceivables]);

  const filtered = useMemo(() => {
    if (bucketFilter === 'ALL') return openReceivables;
    return openReceivables.filter((i) => getAgeingBucket(i.dueDate) === bucketFilter);
  }, [openReceivables, bucketFilter]);

  const columns: ColumnDef<SalesInvoice>[] = [
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      sortValue: (i) => customers.find((c) => c.id === i.customerId)?.name || '',
      render: (i) => {
        const cust = customers.find((c) => c.id === i.customerId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{cust?.name}</p>
            <p className="text-xs text-slate-500">{cust?.phone}</p>
          </div>
        );
      },
    },
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (i) => <span className="font-mono font-medium text-slate-900">{i.invoiceNumber}</span>,
    },
    {
      key: 'dates',
      header: 'Invoice / Due Date',
      render: (i) => (
        <div className="text-xs tabular-nums">
          <p className="text-slate-600">Inv: {formatDateIN(i.invoiceDate)}</p>
          <p className="text-slate-900 font-medium">Due: {formatDateIN(i.dueDate)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Invoice Amt',
      align: 'right',
      render: (i) => <span className="tabular-nums text-slate-700">{formatINR(i.totalAmount)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      render: (i) => <span className="tabular-nums text-emerald-700">{formatINR(i.paidAmount)}</span>,
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.totalAmount - i.paidAmount,
      render: (i) => (
        <span className="tabular-nums font-bold text-red-600">
          {formatINR(i.totalAmount - i.paidAmount)}
        </span>
      ),
    },
    {
      key: 'overdue',
      header: 'Days Overdue',
      align: 'right',
      sortable: true,
      sortValue: (i) => getDaysOverdue(i.dueDate),
      render: (i) => {
        const days = getDaysOverdue(i.dueDate);
        return (
          <span className={`tabular-nums text-xs font-semibold ${days > 0 ? 'text-red-600' : 'text-slate-500'}`}>
            {days > 0 ? `${days} days` : 'Not due'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'actions',
      header: 'CollectFlow',
      align: 'right',
      render: () => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate('/commitments?new=1')}
            className="p-1.5 rounded-md text-[#675BD3] hover:bg-[#675BD3]/10"
            title="Log Payment Commitment"
          >
            <CalendarCheck className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/follow-ups?new=1')}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            title="Schedule Follow-up"
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Receivables & Payables"
        subtitle="Track overdue customer receivables and supplier payables across ageing buckets."
        actions={
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => navigate('/receivables')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#675BD3] text-white"
            >
              Customer Receivables
            </button>
            <button
              type="button"
              onClick={() => navigate('/payables')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900"
            >
              Supplier Payables
            </button>
          </div>
        }
      />

      {/* Ageing Buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {BUCKETS.map((b) => (
          <StatCard
            key={b}
            title={b}
            value={formatINR(ageingSummary[b])}
            tone={b === 'Not due' ? 'default' : b === '1–30 days' ? 'warning' : 'danger'}
            onClick={() => setBucketFilter((cur) => (cur === b ? 'ALL' : b))}
            subtitle={bucketFilter === b ? 'Active filter (click to clear)' : 'Click to filter'}
          />
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(i) => i.id}
        searchPlaceholder="Search customer or invoice #..."
        searchFilter={(i, q) => {
          const cust = customers.find((c) => c.id === i.customerId);
          return (
            i.invoiceNumber.toLowerCase().includes(q) ||
            (cust?.name.toLowerCase().includes(q) ?? false)
          );
        }}
        toolbarExtra={
          bucketFilter !== 'ALL' ? (
            <button
              type="button"
              onClick={() => setBucketFilter('ALL')}
              className="px-3 py-1 text-xs font-medium text-[#675BD3] bg-[#675BD3]/10 rounded-lg"
            >
              Clear Filter: {bucketFilter}
            </button>
          ) : undefined
        }
      />
    </div>
  );
};
