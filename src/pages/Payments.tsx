import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Plus, Printer } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { PaymentMethod, PaymentRecord, PaymentType } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

export const Payments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { payments, customers, suppliers, salesInvoices, purchaseBills, recordPayment } = useApp();

  const [tab, setTab] = useState<'ALL' | 'Received' | 'Paid' | 'Unallocated'>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [receiptView, setReceiptView] = useState<PaymentRecord | null>(null);

  const [type, setType] = useState<PaymentType>('Received');
  const [partyId, setPartyId] = useState(customers[0]?.id || '');
  const [linkedDocId, setLinkedDocId] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);
  const [amount, setAmount] = useState(25000);
  const [method, setMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(DEMO_TODAY);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreateOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const openInvoicesForParty = useMemo(
    () =>
      salesInvoices.filter(
        (i) => i.customerId === partyId && i.status !== 'Draft' && i.totalAmount > i.paidAmount
      ),
    [salesInvoices, partyId]
  );

  const openBillsForParty = useMemo(
    () => purchaseBills.filter((b) => b.supplierId === partyId && b.totalAmount > b.paidAmount),
    [purchaseBills, partyId]
  );

  const filteredPayments = useMemo(() => {
    if (tab === 'Received') return payments.filter((p) => p.type === 'Received');
    if (tab === 'Paid') return payments.filter((p) => p.type === 'Paid');
    if (tab === 'Unallocated') return payments.filter((p) => p.unallocatedAmount > 0);
    return payments;
  }, [payments, tab]);

  const stats = useMemo(() => {
    const received = payments.filter((p) => p.type === 'Received').reduce((s, p) => s + p.amount, 0);
    const paid = payments.filter((p) => p.type === 'Paid').reduce((s, p) => s + p.amount, 0);
    const unallocated = payments.reduce((s, p) => s + p.unallocatedAmount, 0);
    return { received, paid, unallocated, count: payments.length };
  }, [payments]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const partyList = type === 'Received' ? customers : suppliers;
    const party = partyList.find((p) => p.id === partyId);
    if (!party || amount <= 0) return;

    const doc =
      type === 'Received'
        ? salesInvoices.find((i) => i.id === linkedDocId)
        : purchaseBills.find((b) => b.id === linkedDocId);

    const docNumber = doc
      ? 'invoiceNumber' in doc
        ? doc.invoiceNumber
        : doc.billNumber
      : undefined;

    recordPayment({
      type,
      partyId,
      partyName: party.name,
      invoiceOrBillId: isAdvance ? undefined : linkedDocId || undefined,
      invoiceOrBillNumber: isAdvance ? undefined : docNumber,
      date,
      amount,
      allocatedAmount: isAdvance || !linkedDocId ? 0 : amount,
      unallocatedAmount: isAdvance || !linkedDocId ? amount : 0,
      method,
      referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      isAdvance,
      notes,
    });
    setCreateOpen(false);
  };

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt / Voucher #',
      sortable: true,
      sortValue: (p) => p.receiptNumber,
      render: (p) => (
        <div>
          <p className="font-mono font-semibold text-slate-900">{p.receiptNumber}</p>
          <p className="text-[11px] font-mono text-slate-500">{p.referenceNumber}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Flow',
      render: (p) => (
        <StatusBadge
          status={p.type === 'Received' ? 'Receipt (In)' : 'Payment (Out)'}
          tone={p.type === 'Received' ? 'success' : 'neutral'}
          showIcon={false}
        />
      ),
    },
    {
      key: 'party',
      header: 'Customer / Supplier',
      render: (p) => (
        <div>
          <p className="font-medium text-slate-800">{p.partyName}</p>
          <p className="text-xs text-slate-500">
            {p.invoiceOrBillNumber ? `Allocated: ${p.invoiceOrBillNumber}` : 'Advance / Unallocated'}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (p) => p.date,
      render: (p) => <span className="tabular-nums text-xs">{formatDateIN(p.date)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      render: (p) => <span className="text-xs text-slate-700">{p.method}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.amount,
      render: (p) => (
        <span
          className={`tabular-nums font-bold ${
            p.type === 'Received' ? 'text-emerald-700' : 'text-slate-900'
          }`}
        >
          {formatINR(p.amount)}
        </span>
      ),
    },
    {
      key: 'unallocated',
      header: 'Unallocated',
      align: 'right',
      render: (p) =>
        p.unallocatedAmount > 0 ? (
          <span className="tabular-nums text-xs font-semibold text-amber-700">
            {formatINR(p.unallocatedAmount)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Receipt',
      align: 'right',
      render: (p) => (
        <button
          type="button"
          onClick={() => setReceiptView(p)}
          className="p-1.5 rounded-md text-slate-500 hover:text-[#675BD3] hover:bg-slate-100"
          title="View Payment Receipt"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Manage customer receipts, supplier payouts, advance payments, invoice allocation, and payment modes."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Customer Receipts" value={formatINR(stats.received)} tone="positive" />
        <StatCard title="Supplier Payments" value={formatINR(stats.paid)} />
        <StatCard title="Unallocated Advances" value={formatINR(stats.unallocated)} tone="warning" />
        <StatCard title="Total Vouchers" value={String(stats.count)} />
      </div>

      <DataTable
        data={filteredPayments}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search receipt #, reference, party..."
        searchFilter={(p, q) =>
          p.receiptNumber.toLowerCase().includes(q) ||
          p.partyName.toLowerCase().includes(q) ||
          p.referenceNumber.toLowerCase().includes(q)
        }
        toolbarExtra={
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'Received', 'Paid', 'Unallocated'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'Received' ? 'Receipts' : t === 'Paid' ? 'Payouts' : 'Unallocated'}
              </button>
            ))}
          </div>
        }
      />

      {/* Record Payment Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Record Payment / Receipt"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="payment-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Payment
            </button>
          </>
        }
      >
        <form id="payment-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            {(['Received', 'Paid'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setPartyId(t === 'Received' ? customers[0]?.id || '' : suppliers[0]?.id || '');
                  setLinkedDocId('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-md ${
                  type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t === 'Received' ? 'Customer Payment Received' : 'Supplier Payment Made'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'Received' ? 'Customer' : 'Supplier'}
              </label>
              <select
                value={partyId}
                onChange={(e) => {
                  setPartyId(e.target.value);
                  setLinkedDocId('');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {(type === 'Received' ? customers : suppliers).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isAdvance}
              onChange={(e) => setIsAdvance(e.target.checked)}
              className="rounded border-slate-300 text-[#675BD3]"
            />
            Record as Advance / Unallocated Payment
          </label>

          {!isAdvance && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Allocate to {type === 'Received' ? 'Sales Invoice' : 'Purchase Bill'}
              </label>
              <select
                value={linkedDocId}
                onChange={(e) => setLinkedDocId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="">-- Unallocated / On Account --</option>
                {type === 'Received'
                  ? openInvoicesForParty.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.invoiceNumber} — Bal: {formatINR(i.totalAmount - i.paidAmount)}
                      </option>
                    ))
                  : openBillsForParty.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.billNumber} — Bal: {formatINR(b.totalAmount - b.paidAmount)}
                      </option>
                    ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Cheque #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="UTR / Ref"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        open={!!receiptView}
        onClose={() => setReceiptView(null)}
        title={`Payment Voucher · ${receiptView?.receiptNumber || ''}`}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={() => setReceiptView(null)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Done
            </button>
          </>
        }
      >
        {receiptView && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-slate-500">{receiptView.type === 'Received' ? 'Received From' : 'Paid To'}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{receiptView.partyName}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Amount</p>
                <p className="text-lg font-bold text-emerald-700 tabular-nums">{formatINR(receiptView.amount)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500">Voucher Date</p>
                <p className="font-semibold text-slate-900">{formatDateIN(receiptView.date)}</p>
              </div>
              <div>
                <p className="text-slate-500">Payment Mode</p>
                <p className="font-semibold text-slate-900">{receiptView.method}</p>
              </div>
              <div>
                <p className="text-slate-500">Reference Number</p>
                <p className="font-mono font-semibold text-slate-900">{receiptView.referenceNumber}</p>
              </div>
              <div>
                <p className="text-slate-500">Linked Document</p>
                <p className="font-mono font-semibold text-slate-900">
                  {receiptView.invoiceOrBillNumber || 'Advance / Unallocated'}
                </p>
              </div>
            </div>
            {receiptView.notes && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-slate-500">Remarks</p>
                <p className="text-slate-800 mt-0.5">{receiptView.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
