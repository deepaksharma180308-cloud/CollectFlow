import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone, Save } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { formatDateIN, formatINR } from '../utils/format';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    customers,
    setCustomers,
    salesInvoices,
    payments,
    commitments,
    followUps,
    employees,
    showToast,
  } = useApp();

  const customer = customers.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<'ledger' | 'sales' | 'payments' | 'commitments'>('ledger');
  const [notesDraft, setNotesDraft] = useState(customer?.notes || '');

  const custInvoices = useMemo(
    () => salesInvoices.filter((i) => i.customerId === id),
    [salesInvoices, id]
  );

  const custPayments = useMemo(
    () => payments.filter((p) => p.type === 'Received' && p.partyId === id),
    [payments, id]
  );

  const custCommitments = useMemo(
    () => commitments.filter((c) => c.customerId === id),
    [commitments, id]
  );

  const custFollowUps = useMemo(
    () => followUps.filter((f) => f.customerId === id),
    [followUps, id]
  );

  if (!customer) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Customer not found</p>
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 text-xs font-medium text-white bg-[#675BD3] rounded-lg"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const assignedEmployee = employees.find((e) => e.id === customer.assignedEmployeeId);
  const totalSales = custInvoices
    .filter((i) => i.status !== 'Draft')
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = custInvoices
    .filter((i) => i.status !== 'Draft')
    .reduce((sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount), 0);
  const creditUtil = customer.creditLimit > 0 ? Math.min(100, Math.round((outstanding / customer.creditLimit) * 100)) : 0;

  const ledgerRows = [
    ...custInvoices
      .filter((i) => i.status !== 'Draft')
      .map((i) => ({
        id: `inv-${i.id}`,
        date: i.invoiceDate,
        ref: i.invoiceNumber,
        desc: 'Sales Tax Invoice',
        debit: i.totalAmount,
        credit: 0,
      })),
    ...custPayments.map((p) => ({
      id: `pay-${p.id}`,
      date: p.date,
      ref: p.receiptNumber,
      desc: `Payment Received (${p.method})`,
      debit: 0,
      credit: p.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const saveNotes = () => {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, notes: notesDraft } : c)));
    showToast({ type: 'success', title: 'Internal notes saved', description: customer.name });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/customers')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
      </button>

      <PageHeader
        title={customer.name}
        badgeText={`${customer.code} · GSTIN ${customer.gstin || 'Unregistered'}`}
        subtitle={`${customer.contactPerson} · Net ${customer.paymentTermsDays} Days · Assigned to ${assignedEmployee?.name || 'Unassigned'}`}
        actions={<StatusBadge status={customer.status} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard title="Total Billed Sales" value={formatINR(totalSales)} subtitle={`${custInvoices.length} invoices`} />
        <StatCard title="Total Payments Received" value={formatINR(totalPaid)} tone="positive" subtitle={`${custPayments.length} receipts`} />
        <StatCard
          title="Outstanding Balance"
          value={formatINR(outstanding)}
          tone={outstanding > 0 ? 'warning' : 'positive'}
          subtitle={`${creditUtil}% of credit limit`}
        />
        <StatCard title="Credit Limit" value={formatINR(customer.creditLimit)} subtitle={`Terms: Net ${customer.paymentTermsDays}d`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Left info + notes */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Contact & Account Details</h2>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                {customer.address}, {customer.city}, {customer.state}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">Credit Utilization</span>
              <span className="font-semibold text-slate-800 tabular-nums">{creditUtil}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  creditUtil > 85 ? 'bg-red-500' : creditUtil > 60 ? 'bg-amber-500' : 'bg-[#675BD3]'
                }`}
                style={{ width: `${creditUtil}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">Internal Notes</label>
            <textarea
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
            <button
              type="button"
              onClick={saveNotes}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
            >
              <Save className="w-3.5 h-3.5" /> Save Notes
            </button>
          </div>
        </div>

        {/* Right: Tabs for Ledger, Sales, Payments, Commitments */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 pt-3 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto">
            {(
              [
                { key: 'ledger', label: 'Transaction Ledger' },
                { key: 'sales', label: `Sales History (${custInvoices.length})` },
                { key: 'payments', label: `Payment History (${custPayments.length})` },
                { key: 'commitments', label: `Commitments & Follow-ups (${custCommitments.length + custFollowUps.length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.key
                    ? 'border-[#675BD3] text-[#675BD3]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5 overflow-x-auto flex-1">
            {activeTab === 'ledger' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Ref #</th>
                    <th className="py-2 pr-3 font-semibold">Particulars</th>
                    <th className="py-2 pr-3 font-semibold text-right">Debit (₹)</th>
                    <th className="py-2 font-semibold text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerRows.map((row) => (
                    <tr key={row.id} className="text-slate-700">
                      <td className="py-2.5 pr-3 tabular-nums">{formatDateIN(row.date)}</td>
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-900">{row.ref}</td>
                      <td className="py-2.5 pr-3">{row.desc}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {row.debit ? formatINR(row.debit) : '—'}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-emerald-700">
                        {row.credit ? formatINR(row.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'sales' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Invoice #</th>
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Due Date</th>
                    <th className="py-2 pr-3 font-semibold text-right">Total</th>
                    <th className="py-2 pr-3 font-semibold text-right">Balance</th>
                    <th className="py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {custInvoices.map((inv) => (
                    <tr key={inv.id} className="text-slate-700">
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatDateIN(inv.invoiceDate)}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatDateIN(inv.dueDate)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatINR(inv.totalAmount)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">
                        {formatINR(inv.totalAmount - inv.paidAmount)}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'payments' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Receipt #</th>
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Mode & Reference</th>
                    <th className="py-2 pr-3 font-semibold">Invoice</th>
                    <th className="py-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {custPayments.map((p) => (
                    <tr key={p.id} className="text-slate-700">
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-900">{p.receiptNumber}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatDateIN(p.date)}</td>
                      <td className="py-2.5 pr-3">
                        {p.method} · <span className="font-mono text-slate-500">{p.referenceNumber}</span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono">{p.invoiceOrBillNumber || 'Advance'}</td>
                      <td className="py-2.5 text-right tabular-nums font-semibold text-emerald-700">
                        {formatINR(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'commitments' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-2">Payment Commitments</h3>
                  {custCommitments.length === 0 ? (
                    <p className="text-xs text-slate-500">No commitments recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {custCommitments.map((c) => (
                        <div key={c.id} className="p-3 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {c.invoiceNumber} · Promised {formatINR(c.promisedAmount)} by {formatDateIN(c.promisedDate)}
                            </p>
                            <p className="text-slate-500 mt-0.5">{c.notes}</p>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-2">Follow-up Tasks</h3>
                  {custFollowUps.length === 0 ? (
                    <p className="text-xs text-slate-500">No follow-ups logged.</p>
                  ) : (
                    <div className="space-y-2">
                      {custFollowUps.map((f) => (
                        <div key={f.id} className="p-3 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {f.channel} · {formatDateIN(f.dueDate)}
                            </p>
                            <p className="text-slate-500 mt-0.5">{f.notes}</p>
                          </div>
                          <StatusBadge status={f.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
