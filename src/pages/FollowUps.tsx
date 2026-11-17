import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, MessageSquare, PhoneCall, Plus } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { FollowUpChannel, FollowUpTask } from '../types';
import { DEMO_TODAY, formatDateIN } from '../utils/format';

export const FollowUps: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { followUps, setFollowUps, customers, salesInvoices, employees, showToast } = useApp();

  const [bucketTab, setBucketTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [createOpen, setCreateOpen] = useState(false);
  const [commTarget, setCommTarget] = useState<FollowUpTask | null>(null);
  const [reschedTarget, setReschedTarget] = useState<FollowUpTask | null>(null);

  // Create form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [invoiceId, setInvoiceId] = useState(salesInvoices[0]?.id || '');
  const [employeeId, setEmployeeId] = useState('emp-3');
  const [dueDate, setDueDate] = useState(DEMO_TODAY);
  const [channel, setChannel] = useState<FollowUpChannel>('Phone Call');
  const [notes, setNotes] = useState('');

  // Log communication form
  const [commChannel, setCommChannel] = useState<FollowUpChannel>('Phone Call');
  const [commSummary, setCommSummary] = useState('');
  const [newDueDate, setNewDueDate] = useState(DEMO_TODAY);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreateOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const counts = useMemo(() => {
    const today = followUps.filter((f) => f.status !== 'Completed' && f.dueDate === DEMO_TODAY).length;
    const overdue = followUps.filter(
      (f) => f.status !== 'Completed' && (f.status === 'Overdue' || f.dueDate < DEMO_TODAY)
    ).length;
    const upcoming = followUps.filter((f) => f.status !== 'Completed' && f.dueDate > DEMO_TODAY).length;
    const completed = followUps.filter((f) => f.status === 'Completed').length;
    return { today, overdue, upcoming, completed };
  }, [followUps]);

  const displayed = useMemo(() => {
    if (bucketTab === 'today') {
      return followUps.filter((f) => f.status !== 'Completed' && f.dueDate === DEMO_TODAY);
    }
    if (bucketTab === 'overdue') {
      return followUps.filter(
        (f) => f.status !== 'Completed' && (f.status === 'Overdue' || f.dueDate < DEMO_TODAY)
      );
    }
    if (bucketTab === 'upcoming') {
      return followUps.filter((f) => f.status !== 'Completed' && f.dueDate > DEMO_TODAY);
    }
    return followUps.filter((f) => f.status === 'Completed');
  }, [followUps, bucketTab]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = salesInvoices.find((i) => i.id === invoiceId);
    const task: FollowUpTask = {
      id: `fu-${Date.now()}`,
      customerId,
      invoiceId,
      invoiceNumber: inv?.invoiceNumber || 'General',
      assignedEmployeeId: employeeId,
      dueDate,
      channel,
      status: dueDate < DEMO_TODAY ? 'Overdue' : 'Pending',
      notes,
      communications: [],
    };
    setFollowUps((prev) => [task, ...prev]);
    showToast({ type: 'success', title: 'Follow-up scheduled', description: `${channel} on ${formatDateIN(dueDate)}` });
    setCreateOpen(false);
    setNotes('');
  };

  const handleMarkCompleted = (task: FollowUpTask) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === task.id ? { ...f, status: 'Completed' } : f))
    );
    showToast({ type: 'success', title: 'Follow-up marked completed', description: task.invoiceNumber });
  };

  const handleLogCommunication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTarget || !commSummary.trim()) return;
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === commTarget.id
          ? {
              ...f,
              communications: [
                {
                  id: `fc-${Date.now()}`,
                  date: DEMO_TODAY,
                  channel: commChannel,
                  summary: commSummary,
                  byEmployee: 'Rajesh Kulkarni',
                },
                ...f.communications,
              ],
            }
          : f
      )
    );
    setCommTarget((prev) =>
      prev
        ? {
            ...prev,
            communications: [
              {
                id: `fc-${Date.now()}`,
                date: DEMO_TODAY,
                channel: commChannel,
                summary: commSummary,
                byEmployee: 'Rajesh Kulkarni',
              },
              ...prev.communications,
            ],
          }
        : null
    );
    setCommSummary('');
    showToast({ type: 'success', title: 'Communication note logged' });
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedTarget || !newDueDate) return;
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === reschedTarget.id ? { ...f, dueDate: newDueDate, status: 'Rescheduled' } : f
      )
    );
    showToast({ type: 'info', title: 'Follow-up rescheduled', description: formatDateIN(newDueDate) });
    setReschedTarget(null);
  };

  const columns: ColumnDef<FollowUpTask>[] = [
    {
      key: 'customer',
      header: 'Customer & Invoice',
      render: (f) => {
        const cust = customers.find((c) => c.id === f.customerId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{cust?.name}</p>
            <p className="text-xs text-slate-500">
              <span className="font-mono">{f.invoiceNumber}</span> · {cust?.phone}
            </p>
          </div>
        );
      },
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (f) => <span className="text-xs font-medium text-slate-700">{f.channel}</span>,
    },
    {
      key: 'date',
      header: 'Follow-up Date',
      render: (f) => <span className="tabular-nums text-xs">{formatDateIN(f.dueDate)}</span>,
    },
    {
      key: 'employee',
      header: 'Assigned To',
      render: (f) => {
        const emp = employees.find((e) => e.id === f.assignedEmployeeId);
        return <span className="text-xs text-slate-700">{emp?.name}</span>;
      },
    },
    {
      key: 'notes',
      header: 'Task Notes',
      render: (f) => <p className="text-xs text-slate-600 max-w-xs truncate">{f.notes}</p>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => <StatusBadge status={f.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (f) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCommTarget(f)}
            className="p-1.5 rounded-md text-[#675BD3] hover:bg-[#675BD3]/10"
            title="Call / WhatsApp Notes & History"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {f.status !== 'Completed' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setReschedTarget(f);
                  setNewDueDate(f.dueDate);
                }}
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
                title="Reschedule"
              >
                <CalendarClock className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleMarkCompleted(f)}
                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50"
                title="Mark Completed"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Follow-up Management"
        subtitle="Coordinate collection calls, manual WhatsApp notes, and overdue payment reminders."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Create Follow-up
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard
          title="Today's Follow-ups"
          value={String(counts.today)}
          tone="accent"
          onClick={() => setBucketTab('today')}
        />
        <StatCard
          title="Overdue Follow-ups"
          value={String(counts.overdue)}
          tone="danger"
          onClick={() => setBucketTab('overdue')}
        />
        <StatCard
          title="Upcoming Follow-ups"
          value={String(counts.upcoming)}
          onClick={() => setBucketTab('upcoming')}
        />
        <StatCard
          title="Completed"
          value={String(counts.completed)}
          tone="positive"
          onClick={() => setBucketTab('completed')}
        />
      </div>

      <div className="mb-4 flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg w-fit overflow-x-auto">
        {(
          [
            { key: 'today', label: `Today (${counts.today})` },
            { key: 'overdue', label: `Overdue (${counts.overdue})` },
            { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
            { key: 'completed', label: `Completed (${counts.completed})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setBucketTab(t.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              bucketTab === t.key ? 'bg-[#675BD3] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        data={displayed}
        columns={columns}
        keyExtractor={(f) => f.id}
        searchPlaceholder="Search invoice or notes..."
        searchFilter={(f, q) =>
          f.invoiceNumber.toLowerCase().includes(q) || f.notes.toLowerCase().includes(q)
        }
      />

      {/* Create Follow-up Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Schedule Follow-up Task"
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
              form="fu-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Create Task
            </button>
          </>
        }
      >
        <form id="fu-form" onSubmit={handleCreate} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Related Invoice</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as FollowUpChannel)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Phone Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp (Manual Note)</option>
                <option value="Email">Email</option>
                <option value="In-Person Visit">In-Person Visit</option>
              </select>
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

      {/* Communication Log & History Modal */}
      <Modal
        open={!!commTarget}
        onClose={() => setCommTarget(null)}
        title={`Communication Log · ${commTarget?.invoiceNumber || ''}`}
        subtitle="Record phone call outcome or manual WhatsApp communication notes."
        size="lg"
      >
        {commTarget && (
          <div className="space-y-5">
            <form onSubmit={handleLogCommunication} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={commChannel}
                  onChange={(e) => setCommChannel(e.target.value as FollowUpChannel)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp">Manual WhatsApp Note</option>
                  <option value="Email">Email</option>
                  <option value="In-Person Visit">In-Person Visit</option>
                </select>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> Date: {formatDateIN(DEMO_TODAY)}
                </span>
              </div>
              <textarea
                rows={2}
                value={commSummary}
                onChange={(e) => setCommSummary(e.target.value)}
                placeholder="Enter call summary or manual WhatsApp reply details..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
                >
                  Log Communication
                </button>
              </div>
            </form>

            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">Communication History</h3>
              <div className="space-y-2">
                {commTarget.communications.length === 0 ? (
                  <p className="text-xs text-slate-500">No interactions logged yet.</p>
                ) : (
                  commTarget.communications.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>{c.channel}</span>
                        <span className="tabular-nums text-slate-500">{formatDateIN(c.date)}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{c.summary}</p>
                      <p className="text-[11px] text-slate-400 mt-1">By {c.byEmployee}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Follow-up Modal */}
      <Modal
        open={!!reschedTarget}
        onClose={() => setReschedTarget(null)}
        title="Reschedule Follow-up"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setReschedTarget(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="resched-fu-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Update Date
            </button>
          </>
        }
      >
        <form id="resched-fu-form" onSubmit={handleReschedule} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">New Follow-up Date</label>
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </form>
      </Modal>
    </div>
  );
};
