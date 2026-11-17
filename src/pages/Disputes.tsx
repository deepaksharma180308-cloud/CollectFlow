import React, { useMemo, useState } from 'react';
import { Eye, Paperclip, Plus } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { DisputeCategory, DisputePriority, DisputeStatus, InvoiceDispute } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

const CATEGORIES: DisputeCategory[] = [
  'Incorrect Amount',
  'Incorrect Quantity',
  'Damaged Goods',
  'Missing Delivery',
  'Pricing Issue',
  'Quality Issue',
  'Missing Documents',
  'Other',
];

export const Disputes: React.FC = () => {
  const { disputes, setDisputes, customers, salesInvoices, employees, showToast } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | DisputeStatus>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailDispute, setDetailDispute] = useState<InvoiceDispute | null>(null);
  const [newNote, setNewNote] = useState('');

  // Create form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [invoiceId, setInvoiceId] = useState(salesInvoices[0]?.id || '');
  const [category, setCategory] = useState<DisputeCategory>('Incorrect Quantity');
  const [disputedAmount, setDisputedAmount] = useState(5000);
  const [priority, setPriority] = useState<DisputePriority>('High');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('emp-6');
  const [deadline, setDeadline] = useState('2026-11-24');
  const [description, setDescription] = useState('');

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return disputes;
    return disputes.filter((d) => d.status === statusFilter);
  }, [disputes, statusFilter]);

  const stats = useMemo(() => {
    const open = disputes.filter((d) => d.status === 'Open').length;
    const review = disputes.filter((d) => d.status === 'Under Review').length;
    const resolved = disputes.filter((d) => d.status === 'Resolved').length;
    const blockedAmt = disputes
      .filter((d) => d.status !== 'Resolved')
      .reduce((s, d) => s + d.disputedAmount, 0);
    return { open, review, resolved, blockedAmt };
  }, [disputes]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = salesInvoices.find((i) => i.id === invoiceId);
    if (!description.trim()) {
      showToast({ type: 'error', title: 'Description required' });
      return;
    }
    const dispNum = `DISP-26-0${17 + disputes.length}`;
    const newDisp: InvoiceDispute = {
      id: `disp-${Date.now()}`,
      disputeNumber: dispNum,
      customerId,
      invoiceId,
      invoiceNumber: inv?.invoiceNumber || 'INV',
      category,
      description,
      disputedAmount,
      assignedEmployeeId,
      priority,
      resolutionDeadline: deadline,
      status: 'Open',
      attachments: [],
      createdAt: DEMO_TODAY,
      history: [
        {
          id: `dh-${Date.now()}`,
          date: DEMO_TODAY,
          action: 'Opened',
          note: description,
          byEmployee: 'Rajesh Kulkarni',
        },
      ],
    };
    setDisputes((prev) => [newDisp, ...prev]);
    showToast({ type: 'success', title: `Dispute ${dispNum} created` });
    setCreateOpen(false);
    setDescription('');
  };

  const updateDisputeStatus = (disp: InvoiceDispute, nextStatus: DisputeStatus) => {
    const entry = {
      id: `dh-${Date.now()}`,
      date: DEMO_TODAY,
      action: nextStatus,
      note: newNote.trim() || `Status changed to ${nextStatus}`,
      byEmployee: 'Rajesh Kulkarni',
    };
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disp.id ? { ...d, status: nextStatus, history: [...d.history, entry] } : d
      )
    );
    setDetailDispute((prev) =>
      prev ? { ...prev, status: nextStatus, history: [...prev.history, entry] } : null
    );
    setNewNote('');
    showToast({ type: 'success', title: `${disp.disputeNumber} marked ${nextStatus}` });
  };

  const columns: ColumnDef<InvoiceDispute>[] = [
    {
      key: 'number',
      header: 'Dispute # & Invoice',
      render: (d) => (
        <div>
          <p className="font-mono font-semibold text-slate-900">{d.disputeNumber}</p>
          <p className="text-xs font-mono text-slate-500">{d.invoiceNumber}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (d) => {
        const cust = customers.find((c) => c.id === d.customerId);
        return <span className="font-medium text-slate-800">{cust?.name}</span>;
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (d) => <span className="text-xs text-slate-700">{d.category}</span>,
    },
    {
      key: 'amount',
      header: 'Disputed Amt',
      align: 'right',
      render: (d) => <span className="tabular-nums font-semibold">{formatINR(d.disputedAmount)}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (d) => <StatusBadge status={d.priority} showIcon={false} />,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (d) => <span className="tabular-nums text-xs">{formatDateIN(d.resolutionDeadline)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      render: (d) => (
        <button
          type="button"
          onClick={() => setDetailDispute(d)}
          className="p-1.5 rounded-md text-slate-500 hover:text-[#675BD3] hover:bg-slate-100"
          title="Open Dispute Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoice Disputes"
        subtitle="Track quantity mismatches, transit damage, pricing claims, and resolution deadlines blocking collections."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Log Dispute
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Open Disputes" value={String(stats.open)} tone="danger" />
        <StatCard title="Under Review" value={String(stats.review)} tone="accent" />
        <StatCard title="Resolved" value={String(stats.resolved)} tone="positive" />
        <StatCard title="Amount in Dispute" value={formatINR(stats.blockedAmt)} tone="warning" />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search dispute #, invoice #, category..."
        searchFilter={(d, q) =>
          d.disputeNumber.toLowerCase().includes(q) ||
          d.invoiceNumber.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
        }
        onRowClick={(d) => setDetailDispute(d)}
        toolbarExtra={
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'Open', 'Under Review', 'Resolved'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {s === 'ALL' ? 'All' : s}
              </button>
            ))}
          </div>
        }
      />

      {/* Create Dispute Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Log Invoice Dispute"
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
              form="disp-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Submit Dispute
            </button>
          </>
        }
      >
        <form id="disp-form" onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice #</label>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {salesInvoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DisputeCategory)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Disputed Amount (₹)</label>
            <input
              type="number"
              value={disputedAmount}
              onChange={(e) => setDisputedAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DisputePriority)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Owner</label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Dispute Details Modal */}
      <Modal
        open={!!detailDispute}
        onClose={() => setDetailDispute(null)}
        title={`Dispute Details · ${detailDispute?.disputeNumber || ''}`}
        subtitle={detailDispute ? `${detailDispute.invoiceNumber} · ${detailDispute.category}` : ''}
        size="lg"
      >
        {detailDispute && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-slate-500">Status</p>
                <div className="mt-1"><StatusBadge status={detailDispute.status} /></div>
              </div>
              <div>
                <p className="text-slate-500">Priority</p>
                <div className="mt-1"><StatusBadge status={detailDispute.priority} showIcon={false} /></div>
              </div>
              <div>
                <p className="text-slate-500">Disputed Amount</p>
                <p className="font-bold text-slate-900 mt-1 tabular-nums">{formatINR(detailDispute.disputedAmount)}</p>
              </div>
              <div>
                <p className="text-slate-500">Deadline</p>
                <p className="font-semibold text-slate-900 mt-1 tabular-nums">{formatDateIN(detailDispute.resolutionDeadline)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-1">Issue Description</h3>
              <p className="text-slate-700 leading-relaxed">{detailDispute.description}</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-1.5">Evidence & Attachments (UI)</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {detailDispute.attachments.map((att) => (
                  <span key={att} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 font-mono">
                    <Paperclip className="w-3 h-3" /> {att}
                  </span>
                ))}
                <label className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-slate-300 rounded-md text-[#675BD3] cursor-pointer hover:bg-slate-50">
                  + Attach File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const fname = e.target.files?.[0]?.name;
                      if (!fname) return;
                      setDisputes((prev) =>
                        prev.map((d) =>
                          d.id === detailDispute.id ? { ...d, attachments: [...d.attachments, fname] } : d
                        )
                      );
                      setDetailDispute((prev) =>
                        prev ? { ...prev, attachments: [...prev.attachments, fname] } : null
                      );
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <h3 className="font-bold text-slate-800">Update Resolution Status</h3>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add resolution note or credit note reference..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {(['Open', 'Under Review', 'Resolved'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateDisputeStatus(detailDispute, st)}
                    className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                      detailDispute.status === st
                        ? 'bg-[#675BD3] text-white border-[#675BD3]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Mark {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-2">Resolution History</h3>
              <div className="space-y-2">
                {detailDispute.history.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{h.action}</span>
                      <span className="tabular-nums text-slate-500">{formatDateIN(h.date)}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{h.note}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">By {h.byEmployee}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
