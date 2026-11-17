import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Calendar,
  CreditCard,
  Landmark,
  Package,
  PhoneCall,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { MONTHLY_FINANCIAL_TREND } from '../data/mockData';
import {
  formatDateIN,
  formatINR,
  formatINRCompact,
  getAgeingBucket,
  getDaysOverdue,
} from '../utils/format';

type DateRangeOption = 'this_month' | 'last_3_months' | 'fy_ytd';

const EXPENSE_COLORS = ['#675BD3', '#0EA5E9', '#16A34A', '#D97706', '#DC2626', '#64748B'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeBusiness,
    salesInvoices,
    purchaseBills,
    incomes,
    expenses,
    bankAccounts,
    products,
    payments,
    customers,
    commitments,
    followUps,
    disputes,
  } = useApp();

  const [dateRange, setDateRange] = useState<DateRangeOption>('fy_ytd');

  const scaleFactor = dateRange === 'this_month' ? 0.34 : dateRange === 'last_3_months' ? 0.68 : 1;

  const metrics = useMemo(() => {
    const totalSalesRaw = salesInvoices
      .filter((i) => i.status !== 'Draft')
      .reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPurchasesRaw = purchaseBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const otherIncomeRaw = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpensesRaw = expenses.reduce((sum, e) => sum + e.amount, 0);

    const totalSales = Math.round(totalSalesRaw * scaleFactor);
    const totalPurchases = Math.round(totalPurchasesRaw * scaleFactor);
    const totalIncome = totalSales + Math.round(otherIncomeRaw * scaleFactor);
    const totalExpenses = Math.round(totalExpensesRaw * scaleFactor);
    const grossProfit = totalSales - Math.round(totalPurchases * 0.82);
    const netProfit = grossProfit + Math.round(otherIncomeRaw * scaleFactor) - totalExpenses;

    const receivables = salesInvoices
      .filter((i) => i.status !== 'Draft')
      .reduce((sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount), 0);

    const payables = purchaseBills.reduce(
      (sum, b) => sum + Math.max(0, b.totalAmount - b.paidAmount),
      0
    );

    const cashBalance = bankAccounts
      .filter((a) => a.kind === 'Cash')
      .reduce((sum, a) => sum + a.bookBalance, 0);

    const bankBalance = bankAccounts
      .filter((a) => a.kind === 'Bank')
      .reduce((sum, a) => sum + a.bookBalance, 0);

    const inventoryValue = products.reduce(
      (sum, p) => sum + p.availableStock * p.purchasePrice,
      0
    );

    return {
      totalSales,
      totalPurchases,
      totalIncome,
      totalExpenses,
      grossProfit,
      netProfit,
      receivables,
      payables,
      cashBalance,
      bankBalance,
      inventoryValue,
    };
  }, [salesInvoices, purchaseBills, incomes, expenses, bankAccounts, products, scaleFactor]);

  const trendData = useMemo(() => {
    if (dateRange === 'this_month') return MONTHLY_FINANCIAL_TREND.slice(-2);
    if (dateRange === 'last_3_months') return MONTHLY_FINANCIAL_TREND.slice(-3);
    return MONTHLY_FINANCIAL_TREND;
  }, [dateRange]);

  const ageingData = useMemo(() => {
    const buckets: Record<string, number> = {
      'Not due': 0,
      '1–30 days': 0,
      '31–60 days': 0,
      '61–90 days': 0,
      'Above 90 days': 0,
    };
    salesInvoices
      .filter((i) => i.status !== 'Draft' && i.totalAmount > i.paidAmount)
      .forEach((i) => {
        const bucket = getAgeingBucket(i.dueDate);
        buckets[bucket] += i.totalAmount - i.paidAmount;
      });
    return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));
  }, [salesInvoices]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const overdueInvoices = useMemo(
    () =>
      salesInvoices
        .filter((i) => i.status === 'Overdue' || (i.status !== 'Draft' && i.status !== 'Paid' && getDaysOverdue(i.dueDate) > 0))
        .slice(0, 5),
    [salesInvoices]
  );

  const upcomingPayables = useMemo(
    () =>
      purchaseBills
        .filter((b) => b.totalAmount > b.paidAmount)
        .slice(0, 4),
    [purchaseBills]
  );

  const missedCommitments = useMemo(
    () => commitments.filter((c) => c.status === 'Missed' || c.status === 'Pending').slice(0, 4),
    [commitments]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.availableStock <= p.reorderLevel),
    [products]
  );

  const actionFollowUps = useMemo(
    () => followUps.filter((f) => f.status !== 'Completed').slice(0, 4),
    [followUps]
  );

  const recentActivities = useMemo(() => {
    const items: { id: string; text: string; time: string; to: string }[] = [];
    payments.slice(0, 2).forEach((p) =>
      items.push({
        id: `act-${p.id}`,
        text: `${p.type === 'Received' ? 'Payment received' : 'Supplier paid'}: ${formatINR(p.amount)} (${p.partyName})`,
        time: formatDateIN(p.date),
        to: '/payments',
      })
    );
    disputes.slice(0, 2).forEach((d) =>
      items.push({
        id: `act-${d.id}`,
        text: `Dispute ${d.disputeNumber} (${d.category}) — ${d.status}`,
        time: formatDateIN(d.createdAt),
        to: '/disputes',
      })
    );
    commitments.slice(0, 2).forEach((c) =>
      items.push({
        id: `act-${c.id}`,
        text: `Commitment ${c.invoiceNumber}: ${formatINR(c.promisedAmount)} (${c.status})`,
        time: formatDateIN(c.promisedDate),
        to: '/commitments',
      })
    );
    return items.slice(0, 5);
  }, [payments, disputes, commitments]);

  return (
    <div>
      <PageHeader
        title="Financial & Collections Dashboard"
        subtitle={`${activeBusiness.name} · ${activeBusiness.financialYear} · Demo business snapshot as of 17/11/2026`}
        actions={
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(
              [
                { key: 'this_month', label: 'Nov 2026' },
                { key: 'last_3_months', label: 'Last 3 Months' },
                { key: 'fy_ytd', label: 'FY 2026–27 YTD' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDateRange(opt.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  dateRange === opt.key
                    ? 'bg-[#675BD3] text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Primary KPI Summary Grid (11 metrics across 2 clean rows) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-3.5">
        <StatCard
          title="Total Sales"
          value={formatINRCompact(metrics.totalSales)}
          subtitle={formatINR(metrics.totalSales)}
          trend="+11.4%"
          trendDirection="up"
          icon={<TrendingUp className="w-4 h-4" />}
          onClick={() => navigate('/sales-invoices')}
        />
        <StatCard
          title="Total Purchases"
          value={formatINRCompact(metrics.totalPurchases)}
          subtitle={formatINR(metrics.totalPurchases)}
          icon={<Receipt className="w-4 h-4" />}
          onClick={() => navigate('/purchase-bills')}
        />
        <StatCard
          title="Total Income"
          value={formatINRCompact(metrics.totalIncome)}
          subtitle="Sales + Other Income"
          tone="positive"
          icon={<Banknote className="w-4 h-4" />}
          onClick={() => navigate('/expenses?tab=income')}
        />
        <StatCard
          title="Total Expenses"
          value={formatINRCompact(metrics.totalExpenses)}
          subtitle="Operating overheads"
          icon={<Wallet className="w-4 h-4" />}
          onClick={() => navigate('/expenses')}
        />
        <StatCard
          title="Gross Profit"
          value={formatINRCompact(metrics.grossProfit)}
          subtitle="Est. trading margin"
          tone="positive"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Net Profit"
          value={formatINRCompact(metrics.netProfit)}
          subtitle="After operating costs"
          tone={metrics.netProfit >= 0 ? 'positive' : 'danger'}
          trend="+8.2%"
          trendDirection="up"
          onClick={() => navigate('/reports')}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        <StatCard
          title="Customer Receivables"
          value={formatINR(metrics.receivables)}
          subtitle={`${overdueInvoices.length} overdue invoices`}
          tone="warning"
          icon={<CreditCard className="w-4 h-4" />}
          onClick={() => navigate('/receivables')}
        />
        <StatCard
          title="Supplier Payables"
          value={formatINR(metrics.payables)}
          subtitle={`${upcomingPayables.length} open bills`}
          tone="danger"
          onClick={() => navigate('/payables')}
        />
        <StatCard
          title="Cash Balance"
          value={formatINR(metrics.cashBalance)}
          subtitle="Counter petty cash"
          icon={<Wallet className="w-4 h-4" />}
          onClick={() => navigate('/banking')}
        />
        <StatCard
          title="Bank Balance"
          value={formatINR(metrics.bankBalance)}
          subtitle="HDFC & ICICI Book Bal."
          tone="accent"
          icon={<Landmark className="w-4 h-4" />}
          onClick={() => navigate('/banking')}
        />
        <StatCard
          title="Inventory Value"
          value={formatINR(metrics.inventoryValue)}
          subtitle={`${lowStockProducts.length} low-stock SKUs`}
          icon={<Package className="w-4 h-4" />}
          onClick={() => navigate('/products')}
        />
      </div>

      {/* Visualizations: 6 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ChartCard
          title="Monthly Revenue vs Expenses"
          subtitle="B2B billed sales against operating & procurement spend (INR)"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(val) => formatINR(Number(val || 0))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#675BD3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Profit & Loss Trend"
          subtitle="Monthly net trading surplus trajectory"
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(val) => formatINR(Number(val || 0))} />
              <Area
                type="monotone"
                dataKey="profit"
                name="Net Surplus"
                stroke="#16A34A"
                strokeWidth={2}
                fill="#16A34A"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Receivables Ageing Breakdown"
          subtitle="Live unpaid customer balances grouped by overdue slab"
          action={
            <button
              type="button"
              onClick={() => navigate('/receivables')}
              className="text-xs font-medium text-[#675BD3] hover:underline inline-flex items-center gap-1"
            >
              View Ageing <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageingData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(val) => formatINR(Number(val || 0))} />
              <Bar dataKey="amount" name="Receivable" radius={[4, 4, 0, 0]}>
                {ageingData.map((entry, index) => (
                  <Cell
                    key={entry.bucket}
                    fill={
                      index === 0
                        ? '#0EA5E9'
                        : index === 1
                        ? '#D97706'
                        : index >= 2
                        ? '#DC2626'
                        : '#675BD3'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Sales Performance vs Target"
          subtitle="Monthly achieved revenue against wholesale sales target"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(val) => formatINR(Number(val || 0))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Actual Sales" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Sales Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Collection Performance"
          subtitle="Invoiced revenue vs actual collections received"
          action={
            <button
              type="button"
              onClick={() => navigate('/commitments')}
              className="text-xs font-medium text-[#675BD3] hover:underline inline-flex items-center gap-1"
            >
              Commitments <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(val) => formatINR(Number(val || 0))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Billed"
                stroke="#64748B"
                fill="#94A3B8"
                fillOpacity={0.12}
              />
              <Area
                type="monotone"
                dataKey="collected"
                name="Collected"
                stroke="#675BD3"
                strokeWidth={2}
                fill="#675BD3"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Expense Category Breakdown"
          subtitle="Operating overheads by cost head"
          action={
            <button
              type="button"
              onClick={() => navigate('/expenses')}
              className="text-xs font-medium text-[#675BD3] hover:underline inline-flex items-center gap-1"
            >
              Manage Expenses <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 h-full">
            <div className="w-full sm:w-1/2 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {expenseBreakdown.map((entry, idx) => (
                      <Cell key={entry.name} fill={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatINR(Number(val || 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2">
              {expenseBreakdown.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }}
                    />
                    <span className="text-slate-700 truncate">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900 tabular-nums shrink-0">
                    {formatINR(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Operational Action Grids: Overdue Invoices, Commitments, Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Overdue Invoices */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Overdue Invoices</h2>
            <button
              type="button"
              onClick={() => navigate('/receivables')}
              className="text-xs font-medium text-[#675BD3] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {overdueInvoices.map((inv) => {
              const cust = customers.find((c) => c.id === inv.customerId);
              const due = inv.totalAmount - inv.paidAmount;
              const days = getDaysOverdue(inv.dueDate);
              return (
                <div
                  key={inv.id}
                  onClick={() => navigate('/sales-invoices')}
                  className="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {cust?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {inv.invoiceNumber} · {days}d overdue
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-red-600 tabular-nums">{formatINR(due)}</p>
                    <p className="text-[11px] text-slate-400">Due {formatDateIN(inv.dueDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missed & Pending Payment Commitments */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Payment Commitments</h2>
            <button
              type="button"
              onClick={() => navigate('/commitments')}
              className="text-xs font-medium text-[#675BD3] hover:underline"
            >
              Workspace
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {missedCommitments.map((c) => {
              const cust = customers.find((cu) => cu.id === c.customerId);
              return (
                <div
                  key={c.id}
                  onClick={() => navigate('/commitments')}
                  className="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{cust?.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {c.invoiceNumber} · Promised {formatDateIN(c.promisedDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs font-semibold text-slate-900 tabular-nums">
                      {formatINR(c.promisedAmount)}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customers Requiring Follow-up */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Customers Requiring Follow-up</h2>
            <button
              type="button"
              onClick={() => navigate('/follow-ups')}
              className="text-xs font-medium text-[#675BD3] hover:underline"
            >
              Open queue
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {actionFollowUps.map((f) => {
              const cust = customers.find((c) => c.id === f.customerId);
              return (
                <div
                  key={f.id}
                  onClick={() => navigate('/follow-ups')}
                  className="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{cust?.name}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" />
                      <span>{f.channel}</span>
                      <span>·</span>
                      <span>{formatDateIN(f.dueDate)}</span>
                    </p>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Transactions, Upcoming Payables, Low-Stock Products & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Recent Transactions */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="text-xs font-medium text-[#675BD3] hover:underline"
            >
              All payments
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {payments.slice(0, 4).map((p) => (
              <div key={p.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{p.partyName}</p>
                  <p className="text-[11px] text-slate-500">
                    {p.receiptNumber} · {p.method}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold tabular-nums shrink-0 ${
                    p.type === 'Received' ? 'text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {p.type === 'Received' ? '+' : '-'}
                  {formatINR(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Supplier Payments */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming Supplier Payments</h2>
            <button
              type="button"
              onClick={() => navigate('/payables')}
              className="text-xs font-medium text-[#675BD3] hover:underline"
            >
              Payables
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingPayables.map((b) => (
              <div key={b.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{b.billNumber}</p>
                  <p className="text-[11px] text-slate-500">Due {formatDateIN(b.dueDate)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 tabular-nums">
                    {formatINR(b.totalAmount - b.paidAmount)}
                  </p>
                  <StatusBadge status={b.status} showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low-Stock Products */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Low-Stock Products</h2>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="text-xs font-medium text-[#675BD3] hover:underline"
            >
              Inventory
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-500">
                    SKU {p.sku} · Reorder at {p.reorderLevel}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 tabular-nums shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {p.availableStock} {p.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Business Activities */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent Business Activities</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => navigate(act.to)}
                className="w-full py-2 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <p className="text-xs text-slate-800 line-clamp-2">{act.text}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{act.time}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
