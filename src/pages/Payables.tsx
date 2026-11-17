import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef, DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { PurchaseBill } from '../types';
import { AgeingBucket, formatDateIN, formatINR, getAgeingBucket } from '../utils/format';

const BUCKETS: AgeingBucket[] = ['Not due', '1–30 days', '31–60 days', '61–90 days', 'Above 90 days'];

export const Payables: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseBills, suppliers } = useApp();
  const [bucketFilter, setBucketFilter] = useState<'ALL' | AgeingBucket>('ALL');

  const openPayables = useMemo(
    () => purchaseBills.filter((b) => b.totalAmount > b.paidAmount),
    [purchaseBills]
  );

  const ageingSummary = useMemo(() => {
    const totals: Record<AgeingBucket, number> = {
      'Not due': 0,
      '1–30 days': 0,
      '31–60 days': 0,
      '61–90 days': 0,
      'Above 90 days': 0,
    };
    openPayables.forEach((b) => {
      const bucket = getAgeingBucket(b.dueDate);
      totals[bucket] += b.totalAmount - b.paidAmount;
    });
    return totals;
  }, [openPayables]);

  const filtered = useMemo(() => {
    if (bucketFilter === 'ALL') return openPayables;
    return openPayables.filter((b) => getAgeingBucket(b.dueDate) === bucketFilter);
  }, [openPayables, bucketFilter]);

  const columns: ColumnDef<PurchaseBill>[] = [
    {
      key: 'supplier',
      header: 'Supplier',
      render: (b) => {
        const sup = suppliers.find((s) => s.id === b.supplierId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{sup?.name}</p>
            <p className="text-xs text-slate-500">{sup?.phone}</p>
          </div>
        );
      },
    },
    {
      key: 'billNumber',
      header: 'Bill #',
      render: (b) => <span className="font-mono font-medium text-slate-900">{b.billNumber}</span>,
    },
    {
      key: 'dates',
      header: 'Bill / Due Date',
      render: (b) => (
        <div className="text-xs tabular-nums">
          <p className="text-slate-600">Bill: {formatDateIN(b.purchaseDate)}</p>
          <p className="text-slate-900 font-medium">Due: {formatDateIN(b.dueDate)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Bill Amount',
      align: 'right',
      render: (b) => <span className="tabular-nums">{formatINR(b.totalAmount)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      render: (b) => <span className="tabular-nums text-emerald-700">{formatINR(b.paidAmount)}</span>,
    },
    {
      key: 'outstanding',
      header: 'Outstanding Payable',
      align: 'right',
      render: (b) => (
        <span className="tabular-nums font-bold text-red-600">
          {formatINR(b.totalAmount - b.paidAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <StatusBadge status={b.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Receivables & Payables"
        subtitle="Track supplier bills due and payable ageing schedule."
        actions={
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => navigate('/receivables')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900"
            >
              Customer Receivables
            </button>
            <button
              type="button"
              onClick={() => navigate('/payables')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#675BD3] text-white"
            >
              Supplier Payables
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {BUCKETS.map((b) => (
          <StatCard
            key={b}
            title={b}
            value={formatINR(ageingSummary[b])}
            tone={b === 'Not due' ? 'default' : 'danger'}
            onClick={() => setBucketFilter((cur) => (cur === b ? 'ALL' : b))}
            subtitle={bucketFilter === b ? 'Active filter' : 'Click to filter'}
          />
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search supplier or bill #..."
        searchFilter={(b, q) => {
          const sup = suppliers.find((s) => s.id === b.supplierId);
          return (
            b.billNumber.toLowerCase().includes(q) ||
            (sup?.name.toLowerCase().includes(q) ?? false)
          );
        }}
      />
    </div>
  );
};
