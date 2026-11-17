import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Paperclip, Plus, Repeat } from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { ExpenseCategory, ExpenseRecord, IncomeRecord, PaymentMethod } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Salaries',
  'Electricity',
  'Transport',
  'Maintenance',
  'Marketing',
  'Office Expenses',
  'Utilities',
  'Other Expenses',
];

export const Expenses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { expenses, setExpenses, incomes, setIncomes, showToast } = useApp();

  const [view, setView] = useState<'expenses' | 'income'>(
    searchParams.get('tab') === 'income' ? 'income' : 'expenses'
  );
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [incModalOpen, setIncModalOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<'ALL' | ExpenseCategory>('ALL');

  const [expForm, setExpForm] = useState({
    title: '',
    category: 'Rent' as ExpenseCategory,
    vendor: '',
    date: DEMO_TODAY,
    amount: 0,
    method: 'Bank Transfer' as PaymentMethod,
    status: 'Paid' as 'Paid' | 'Unpaid',
    isRecurring: false,
    attachmentName: '',
    notes: '',
  });

  const [incForm, setIncForm] = useState({
    title: '',
    category: 'Sales Revenue' as IncomeRecord['category'],
    date: DEMO_TODAY,
    amount: 0,
    method: 'Bank Transfer' as PaymentMethod,
    reference: '',
    status: 'Received' as 'Received' | 'Pending',
    notes: '',
  });

  useEffect(() => {
    if (searchParams.get('tab') === 'income') {
      setView('income');
    }
    if (searchParams.get('new') === '1') {
      setExpModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredExpenses = useMemo(() => {
    if (catFilter === 'ALL') return expenses;
    return expenses.filter((e) => e.category === catFilter);
  }, [expenses, catFilter]);

  const stats = useMemo(() => {
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const unpaidExp = expenses.filter((e) => e.status === 'Unpaid').reduce((s, e) => s + e.amount, 0);
    const recurringExp = expenses.filter((e) => e.isRecurring).reduce((s, e) => s + e.amount, 0);
    const totalInc = incomes.reduce((s, i) => s + i.amount, 0);
    return { totalExp, unpaidExp, recurringExp, totalInc };
  }, [expenses, incomes]);

  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
  }, [expenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.title.trim() || expForm.amount <= 0) {
      showToast({ type: 'error', title: 'Invalid expense', description: 'Enter title and amount > 0.' });
      return;
    }
    const newExp: ExpenseRecord = { id: `exp-${Date.now()}`, ...expForm };
    setExpenses((prev) => [newExp, ...prev]);
    showToast({ type: 'success', title: 'Expense recorded', description: `${expForm.title} · ${formatINR(expForm.amount)}` });
    setExpModalOpen(false);
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incForm.title.trim() || incForm.amount <= 0) {
      showToast({ type: 'error', title: 'Invalid income', description: 'Enter title and amount > 0.' });
      return;
    }
    const newInc: IncomeRecord = { id: `inc-${Date.now()}`, ...incForm };
    setIncomes((prev) => [newInc, ...prev]);
    showToast({ type: 'success', title: 'Income recorded', description: `${incForm.title} · ${formatINR(incForm.amount)}` });
    setIncModalOpen(false);
  };

  const toggleExpensePaid = (exp: ExpenseRecord) => {
    const nextStatus = exp.status === 'Paid' ? 'Unpaid' : 'Paid';
    setExpenses((prev) => prev.map((e) => (e.id === exp.id ? { ...e, status: nextStatus } : e)));
    showToast({ type: 'info', title: `Marked as ${nextStatus}`, description: exp.title });
  };

  const expenseColumns: ColumnDef<ExpenseRecord>[] = [
    {
      key: 'title',
      header: 'Expense Title & Vendor',
      sortable: true,
      sortValue: (e) => e.title,
      render: (e) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">{e.title}</span>
            {e.isRecurring && (
              <span title="Recurring Monthly Expense" className="text-[#675BD3]">
                <Repeat className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {e.vendor || 'General Vendor'} · {e.category}
            {e.attachmentName && ` · ${e.attachmentName}`}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (e) => e.date,
      render: (e) => <span className="tabular-nums text-xs">{formatDateIN(e.date)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      render: (e) => <span className="text-xs text-slate-600">{e.method}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      sortValue: (e) => e.amount,
      render: (e) => <span className="tabular-nums font-semibold text-slate-900">{formatINR(e.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (e) => (
        <button
          type="button"
          onClick={() => toggleExpensePaid(e)}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#675BD3] hover:underline"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Mark {e.status === 'Paid' ? 'Unpaid' : 'Paid'}
        </button>
      ),
    },
  ];

  const incomeColumns: ColumnDef<IncomeRecord>[] = [
    {
      key: 'title',
      header: 'Income Description',
      render: (i) => (
        <div>
          <p className="font-semibold text-slate-900">{i.title}</p>
          <p className="text-xs text-slate-500">{i.category} · Ref {i.reference}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (i) => <span className="tabular-nums text-xs">{formatDateIN(i.date)}</span>,
    },
    {
      key: 'method',
      header: 'Mode',
      render: (i) => <span className="text-xs text-slate-600">{i.method}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (i) => <span className="tabular-nums font-bold text-emerald-700">{formatINR(i.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <StatusBadge status={i.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Income & Expenses"
        subtitle="Manage operating expenses, recurring overheads, receipt attachments, and non-invoice business income."
        actions={
          <>
            <button
              type="button"
              onClick={() => setIncModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Income
            </button>
            <button
              type="button"
              onClick={() => setExpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Total Expenses" value={formatINR(stats.totalExp)} />
        <StatCard title="Unpaid Expenses" value={formatINR(stats.unpaidExp)} tone="warning" />
        <StatCard title="Recurring Monthly" value={formatINR(stats.recurringExp)} />
        <StatCard title="Other / Counter Income" value={formatINR(stats.totalInc)} tone="positive" />
      </div>

      {/* Separate Income & Expenses Switcher */}
      <div className="mb-5 flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setView('expenses')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            view === 'expenses' ? 'bg-[#675BD3] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Expenses ({expenses.length})
        </button>
        <button
          type="button"
          onClick={() => setView('income')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            view === 'income' ? 'bg-[#675BD3] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Income ({incomes.length})
        </button>
      </div>

      {view === 'expenses' ? (
        <div className="space-y-5">
          <DataTable
            data={filteredExpenses}
            columns={expenseColumns}
            keyExtractor={(e) => e.id}
            searchPlaceholder="Search expenses or vendors..."
            searchFilter={(e, q) =>
              e.title.toLowerCase().includes(q) ||
              e.vendor.toLowerCase().includes(q) ||
              e.category.toLowerCase().includes(q)
            }
            toolbarExtra={
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value as 'ALL' | ExpenseCategory)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="ALL">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            }
          />

          <ChartCard title="Monthly Expense Report by Category" subtitle="Breakdown across operational heads">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(val) => formatINR(Number(val || 0))} />
                <Bar dataKey="amount" name="Expense" fill="#675BD3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : (
        <DataTable
          data={incomes}
          columns={incomeColumns}
          keyExtractor={(i) => i.id}
          searchPlaceholder="Search income entries..."
          searchFilter={(i, q) =>
            i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
          }
        />
      )}

      {/* Add Expense Modal */}
      <Modal
        open={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title="Add Business Expense"
        footer={
          <>
            <button
              type="button"
              onClick={() => setExpModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="expense-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Expense
            </button>
          </>
        }
      >
        <form id="expense-form" onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title *</label>
            <input
              type="text"
              value={expForm.title}
              onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
              placeholder="e.g. Office Broadband & Telecom"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={expForm.category}
              onChange={(e) => setExpForm({ ...expForm, category: e.target.value as ExpenseCategory })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee</label>
            <input
              type="text"
              value={expForm.vendor}
              onChange={(e) => setExpForm({ ...expForm, vendor: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              min={1}
              value={expForm.amount}
              onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={expForm.date}
              onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={expForm.method}
              onChange={(e) => setExpForm({ ...expForm, method: e.target.value as PaymentMethod })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
            <select
              value={expForm.status}
              onChange={(e) => setExpForm({ ...expForm, status: e.target.value as 'Paid' | 'Unpaid' })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={expForm.isRecurring}
                onChange={(e) => setExpForm({ ...expForm, isRecurring: e.target.checked })}
                className="rounded border-slate-300 text-[#675BD3]"
              />
              Recurring monthly expense
            </label>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{expForm.attachmentName || 'Attach Receipt (UI)'}</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  setExpForm({ ...expForm, attachmentName: e.target.files?.[0]?.name || '' })
                }
              />
            </label>
          </div>
        </form>
      </Modal>

      {/* Add Income Modal */}
      <Modal
        open={incModalOpen}
        onClose={() => setIncModalOpen(false)}
        title="Add Direct / Other Income"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIncModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="income-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Income
            </button>
          </>
        }
      >
        <form id="income-form" onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Income Title *</label>
            <input
              type="text"
              value={incForm.title}
              onChange={(e) => setIncForm({ ...incForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={incForm.category}
              onChange={(e) => setIncForm({ ...incForm, category: e.target.value as IncomeRecord['category'] })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="Sales Revenue">Sales Revenue</option>
              <option value="Commission">Commission</option>
              <option value="Scrap & Misc">Scrap & Misc</option>
              <option value="Interest Income">Interest Income</option>
              <option value="Discount Received">Discount Received</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              min={1}
              value={incForm.amount}
              onChange={(e) => setIncForm({ ...incForm, amount: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={incForm.date}
              onChange={(e) => setIncForm({ ...incForm, date: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference</label>
            <input
              type="text"
              value={incForm.reference}
              onChange={(e) => setIncForm({ ...incForm, reference: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
