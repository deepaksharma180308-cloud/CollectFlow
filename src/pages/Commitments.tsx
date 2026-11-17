import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CalendarClock, CreditCard, History, Info, Plus } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { CommitmentStatus, PaymentCommitment, PaymentMethod } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

export const Commitments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    commitments,
    setCommitments,
    customers,
    salesInvoices,
    employees,
    recordPayment,
    showToast,
  } = useApp();

  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CommitmentStatus>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<PaymentCommitment | null>(null);
  const [historyTarget, setHistoryTarget] = useState<PaymentCommitment | null>(null);
  const [payTarget, setPayTarget] = useState<PaymentCommitment | null>(null);

  // Create form state
  const [custId, setCustId] = useState(customers[0]?.id || '');
  const [invId, setInvId] = useState('');
  const [promisedAmount, setPromisedAmount] = useState(50000);
  const [promisedDate, setPromisedDate] = useState('2026-11-24');
  const [assignedEmpId, setAssignedEmpId] = useState('emp-3');
  const [notes, setNotes] = useState('');

  // Reschedule form
  const [reschedDate, setReschedDate] = useState('');
  const [reschedAmount, setReschedAmount] = useState(0);
  const [reschedNote, setReschedNote] = useState('');

  // Record actual payment form
  const [actualAmount, setActualAmount] = useState(0);
  const [actualMethod, setActualMethod] = useState<PaymentMethod>('Bank Transfer');
  const [actualRef, setActualRef] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreateOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const openInvoicesForCust = useMemo(
    () =>
      salesInvoices.filter(
        (i) => i.customerId === custId && i.status !== 'Draft' && i.totalAmount > i.paidAmount
      ),
    [salesInvoices, custId]
  );

  useEffect(() => {
    if (openInvoicesForCust.length > 0 && !openInvoicesForCust.some((i) => i.id === invId)) {
      setInvId(openInvoicesForCust[0].id);
      setPromisedAmount(openInvoicesForCust[0].totalAmount - openInvoicesForCust[0].paidAmount);
    }
  }, [custId, openInvoicesForCust, invId]);

  const summary = useMemo(() => {
    const missed = commitments.filter((c) => c.status === 'Missed');
    const pendingTotal = commitments
      .filter((c) => c.status === 'Pending' || c.status === 'Rescheduled')
      .reduce((s, c) => s + (c.promisedAmount - c.fulfilledAmount), 0);
    const fulfilledTotal = commitments.reduce((s, c) => s + c.fulfilledAmount, 0);
    const totalCount = commitments.length;
    const fulfilledCount = commitments.filter((c) => c.status === 'Fulfilled').length;
    const rate = totalCount > 0 ? Math.round((fulfilledCount / totalCount) * 100) : 0;
    return { missedCount: missed.length, pendingTotal, fulfilledTotal, rate };
  }, [commitments]);

  const filtered = useMemo(() => {
    return commitments.filter((c) => {
      if (customerFilter !== 'ALL' && c.customerId !== customerFilter) return false;
      if (employeeFilter !== 'ALL' && c.assignedEmployeeId !== employeeFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (dateFilter && c.promisedDate !== dateFilter) return false;
      return true;
    });
  }, [commitments, customerFilter, employeeFilter, statusFilter, dateFilter]);

  const handleCreateCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = salesInvoices.find((i) => i.id === invId);
    const emp = employees.find((em) => em.id === assignedEmpId);
    if (!custId || !inv || promisedAmount <= 0) {
      showToast({ type: 'error', title: 'Missing details', description: 'Select customer, open invoice, and promised amount.' });
      return;
    }
    const newCom: PaymentCommitment = {
      id: `com-${Date.now()}`,
      customerId: custId,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      promisedAmount,
      fulfilledAmount: 0,
      promisedDate,
      assignedEmployeeId: assignedEmpId,
      status: 'Pending',
      notes,
      history: [
        {
          id: `ch-${Date.now()}`,
          date: DEMO_TODAY,
          action: 'Created',
          note: notes || `Promised ${formatINR(promisedAmount)} by ${formatDateIN(promisedDate)}.`,
          byEmployee: emp?.name || 'Collection Team',
        },
      ],
    };
    setCommitments((prev) => [newCom, ...prev]);
    showToast({ type: 'success', title: 'Payment commitment logged', description: `${inv.invoiceNumber} · ${formatINR(promisedAmount)}` });
    setCreateOpen(false);
    setNotes('');
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !reschedDate) return;
    setCommitments((prev) =>
      prev.map((c) =>
        c.id === rescheduleTarget.id
          ? {
              ...c,
              promisedDate: reschedDate,
              promisedAmount: reschedAmount,
              status: 'Rescheduled',
              notes: reschedNote || c.notes,
              history: [
                ...c.history,
                {
                  id: `ch-${Date.now()}`,
                  date: DEMO_TODAY,
                  action: 'Rescheduled',
                  note: `Moved to ${formatDateIN(reschedDate)} (${formatINR(reschedAmount)}). ${reschedNote}`,
                  byEmployee: 'Rajesh Kulkarni',
                },
              ],
            }
          : c
      )
    );
    showToast({ type: 'info', title: 'Commitment rescheduled', description: `New date: ${formatDateIN(reschedDate)}` });
    setRescheduleTarget(null);
  };

  const handleRecordActualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget || actualAmount <= 0) return;
    const cust = customers.find((c) => c.id === payTarget.customerId);
    recordPayment(
      {
        type: 'Received',
        partyId: payTarget.customerId,
        partyName: cust?.name || 'Customer',
        invoiceOrBillId: payTarget.invoiceId,
        invoiceOrBillNumber: payTarget.invoiceNumber,
        date: DEMO_TODAY,
        amount: actualAmount,
        allocatedAmount: actualAmount,
        unallocatedAmount: 0,
        method: actualMethod,
        referenceNumber: actualRef || `UTR-${Date.now().toString().slice(-6)}`,
        isAdvance: false,
        notes: `Fulfilled commitment on ${payTarget.invoiceNumber}`,
      },
      payTarget.id
    );
    setPayTarget(null);
  };

  const columns: ColumnDef<PaymentCommitment>[] = [
    {
      key: 'customer',
      header: 'Customer & Invoice',
      render: (c) => {
        const cust = customers.find((cu) => cu.id === c.customerId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{cust?.name}</p>
            <p className="text-xs font-mono text-slate-500">{c.invoiceNumber}</p>
          </div>
        );
      },
    },
    {
      key: 'promised',
      header: 'Promised (Not Received)',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.promisedAmount,
      render: (c) => (
        <div>
          <p className="tabular-nums font-semibold text-slate-900">{formatINR(c.promisedAmount)}</p>
          {c.fulfilledAmount > 0 && (
            <p className="text-[11px] text-emerald-700 tabular-nums">
              Actual Received: {formatINR(c.fulfilledAmount)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Promised Date',
      sortable: true,
      sortValue: (c) => c.promisedDate,
      render: (c) => <span className="tabular-nums text-xs font-medium">{formatDateIN(c.promisedDate)}</span>,
    },
    {
      key: 'employee',
      header: 'Assigned To',
      render: (c) => {
        const emp = employees.find((e) => e.id === c.assignedEmployeeId);
        return <span className="text-xs text-slate-700">{emp?.name || '—'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Commitment Status',
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="inline-flex items-center gap-1">
          {c.status !== 'Fulfilled' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPayTarget(c);
                  setActualAmount(Math.max(0, c.promisedAmount - c.fulfilledAmount));
                  setActualMethod('Bank Transfer');
                  setActualRef('');
                }}
                className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50"
                title="Record Actual Payment"
              >
                <CreditCard className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRescheduleTarget(c);
                  setReschedDate(c.promisedDate);
                  setReschedAmount(c.promisedAmount);
                  setReschedNote('');
                }}
                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
                title="Edit / Reschedule Commitment"
              >
                <CalendarClock className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setHistoryTarget(c)}
            className="p-1.5 rounded-md text-slate-500 hover:text-[#675BD3] hover:bg-slate-100"
            title="Commitment History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payment Commitments"
        subtitle="Track customer payment promises separately from actual cash & bank receipts."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Create Commitment
          </button>
        }
      />

      {/* Explicit Promise vs Actual Payment Safeguard Notice */}
      <div className="mb-4 p-3.5 rounded-xl bg-[#675BD3]/8 border border-[#675BD3]/25 flex items-start gap-2.5 text-xs text-slate-800">
        <Info className="w-4 h-4 text-[#675BD3] shrink-0 mt-0.5" />
        <p>
          <strong>CollectFlow Safeguard:</strong> Promised payment commitments are tracked strictly as collection targets and are <strong>never</strong> counted as actual payments received until cash, UPI, cheque, or bank credit is verified via <em>Record Actual Payment</em>.
        </p>
      </div>

      {/* Missed Commitment Alert */}
      {summary.missedCount > 0 && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>{summary.missedCount} Missed Payment Commitment(s)</strong> require immediate follow-up or rescheduling.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('Missed')}
            className="px-2.5 py-1 font-semibold bg-white border border-red-200 rounded-md hover:bg-red-100/50 shrink-0"
          >
            Filter Missed
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard
          title="Promised (Pending / Resched.)"
          value={formatINR(summary.pendingTotal)}
          tone="warning"
          subtitle="Expected, not yet received"
        />
        <StatCard
          title="Actual Fulfilled Receipts"
          value={formatINR(summary.fulfilledTotal)}
          tone="positive"
          subtitle="Verified cash/bank inflows"
        />
        <StatCard
          title="Missed Commitments"
          value={String(summary.missedCount)}
          tone="danger"
          subtitle="Past promised date"
        />
        <StatCard
          title="Commitment Fulfillment Rate"
          value={`${summary.rate}%`}
          tone="accent"
          subtitle="Collection reliability"
        />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search invoice # or notes..."
        searchFilter={(c, q) =>
          c.invoiceNumber.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q)
        }
        toolbarExtra={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CommitmentStatus)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Missed">Missed</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Partially Fulfilled">Partially Fulfilled</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>
        }
      />

      {/* Create Commitment Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Payment Commitment"
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
              form="com-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Commitment
            </button>
          </>
        }
      >
        <form id="com-form" onSubmit={handleCreateCommitment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
            <select
              value={custId}
              onChange={(e) => setCustId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Related Open Invoice</label>
            <select
              value={invId}
              onChange={(e) => {
                setInvId(e.target.value);
                const found = openInvoicesForCust.find((i) => i.id === e.target.value);
                if (found) setPromisedAmount(found.totalAmount - found.paidAmount);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {openInvoicesForCust.length === 0 ? (
                <option value="">No unpaid invoices for this customer</option>
              ) : (
                openInvoicesForCust.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNumber} — Due: {formatINR(i.totalAmount - i.paidAmount)}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Promised Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={promisedAmount}
                onChange={(e) => setPromisedAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Promised Date</label>
              <input
                type="date"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
            <select
              value={assignedEmpId}
              onChange={(e) => setAssignedEmpId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Commitment Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Who confirmed the promise and payment mode..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Reschedule Commitment Modal */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title={`Reschedule Commitment · ${rescheduleTarget?.invoiceNumber || ''}`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRescheduleTarget(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="resched-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Schedule
            </button>
          </>
        }
      >
        <form id="resched-form" onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Promised Date</label>
            <input
              type="date"
              value={reschedDate}
              onChange={(e) => setReschedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Promised Amount (₹)</label>
            <input
              type="number"
              value={reschedAmount}
              onChange={(e) => setReschedAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Rescheduling</label>
            <textarea
              rows={2}
              value={reschedNote}
              onChange={(e) => setReschedNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Record Actual Payment Modal */}
      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title={`Record Actual Payment · ${payTarget?.invoiceNumber || ''}`}
        subtitle="Converts promise into verified receipt and updates invoice balance."
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPayTarget(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="actual-pay-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Confirm Actual Payment
            </button>
          </>
        }
      >
        <form id="actual-pay-form" onSubmit={handleRecordActualPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Amount Received (₹)</label>
            <input
              type="number"
              min={1}
              value={actualAmount}
              onChange={(e) => setActualAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={actualMethod}
              onChange={(e) => setActualMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Reference #</label>
            <input
              type="text"
              value={actualRef}
              onChange={(e) => setActualRef(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Commitment History Modal */}
      <Modal
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        title={`Commitment Audit History · ${historyTarget?.invoiceNumber || ''}`}
      >
        {historyTarget && (
          <div className="space-y-3">
            {historyTarget.history.map((h) => (
              <div key={h.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>{h.action}</span>
                  <span className="tabular-nums text-slate-500">{formatDateIN(h.date)}</span>
                </div>
                <p className="text-slate-600 mt-1">{h.note}</p>
                <p className="text-[11px] text-slate-400 mt-1">Logged by {h.byEmployee}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
