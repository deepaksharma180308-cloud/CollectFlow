import React, { useMemo, useState } from 'react';
import { Info, Lock, Plus, Unlock } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { AccountType, JournalEntry } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

type AccountingTab =
  | 'coa'
  | 'journals'
  | 'ledger'
  | 'cashbook'
  | 'bankbook'
  | 'customer_ledger'
  | 'supplier_ledger'
  | 'trial_balance'
  | 'opening'
  | 'periods';

export const Accounting: React.FC = () => {
  const {
    accounts,
    journals,
    setJournals,
    periods,
    setPeriods,
    bankTransactions,
    salesInvoices,
    purchaseBills,
    payments,
    customers,
    suppliers,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<AccountingTab>('coa');
  const [catFilter, setCatFilter] = useState<'ALL' | AccountType>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');

  const [jeOpen, setJeOpen] = useState(false);
  const [jeDate, setJeDate] = useState(DEMO_TODAY);
  const [jeNarration, setJeNarration] = useState('');
  const [jeDebitAcc, setJeDebitAcc] = useState(accounts[0]?.id || '');
  const [jeCreditAcc, setJeCreditAcc] = useState(accounts[1]?.id || '');
  const [jeAmount, setJeAmount] = useState(10000);

  const filteredAccounts = useMemo(() => {
    if (catFilter === 'ALL') return accounts;
    return accounts.filter((a) => a.type === catFilter);
  }, [accounts, catFilter]);

  const totals = useMemo(() => {
    const debitSum = accounts.reduce((s, a) => s + a.debitTotal, 0);
    const creditSum = accounts.reduce((s, a) => s + a.creditTotal, 0);
    return { debitSum, creditSum };
  }, [accounts]);

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jeNarration.trim() || jeAmount <= 0 || jeDebitAcc === jeCreditAcc) {
      showToast({
        type: 'error',
        title: 'Invalid journal entry',
        description: 'Select distinct debit/credit accounts, enter narration and amount > 0.',
      });
      return;
    }
    const dAcc = accounts.find((a) => a.id === jeDebitAcc);
    const cAcc = accounts.find((a) => a.id === jeCreditAcc);
    const entryNumber = `JV-26-00${44 + journals.length}`;
    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber,
      date: jeDate,
      narration: jeNarration,
      reference: 'MANUAL-UI',
      status: 'Posted',
      lines: [
        { accountId: jeDebitAcc, accountName: dAcc?.name || '', debit: jeAmount, credit: 0 },
        { accountId: jeCreditAcc, accountName: cAcc?.name || '', debit: 0, credit: jeAmount },
      ],
    };
    setJournals((prev) => [newEntry, ...prev]);
    showToast({ type: 'success', title: `Journal ${entryNumber} added`, description: 'Prototype sample entry added.' });
    setJeOpen(false);
    setJeNarration('');
  };

  const togglePeriod = (id: string) => {
    setPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'Open' ? 'Closed' : 'Open' } : p))
    );
    showToast({ type: 'info', title: 'Accounting period status updated' });
  };

  const cashBookEntries = bankTransactions.filter((t) => t.accountId === 'ba-3');
  const bankBookEntries = bankTransactions.filter((t) => t.accountId !== 'ba-3');

  const TABS: { key: AccountingTab; label: string }[] = [
    { key: 'coa', label: 'Chart of Accounts' },
    { key: 'journals', label: 'Journal Entries' },
    { key: 'ledger', label: 'General Ledger' },
    { key: 'cashbook', label: 'Cash Book' },
    { key: 'bankbook', label: 'Bank Book' },
    { key: 'customer_ledger', label: 'Customer Ledger' },
    { key: 'supplier_ledger', label: 'Supplier Ledger' },
    { key: 'trial_balance', label: 'Trial Balance' },
    { key: 'opening', label: 'Opening Balances' },
    { key: 'periods', label: 'Accounting Periods' },
  ];

  return (
    <div>
      <PageHeader
        title="Accounting & Bookkeeping"
        subtitle="Chart of accounts, journal vouchers, ledgers, cash/bank books, trial balance, and accounting periods."
        actions={
          <button
            type="button"
            onClick={() => setJeOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Journal Entry
          </button>
        }
      />

      {/* Explicit Frontend Prototype Notice */}
      <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          <strong>Frontend Prototype Notice:</strong> Figures displayed below are illustrative sample data for UI demonstration. Actual double-entry accounting rules, ledger postings, and GST compliance calculations will execute in the Python FastAPI + PostgreSQL backend.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Ledger Accounts" value={String(accounts.length)} />
        <StatCard title="Sample Debit Total" value={formatINR(totals.debitSum)} />
        <StatCard title="Sample Credit Total" value={formatINR(totals.creditSum)} />
        <StatCard title="Journal Vouchers" value={String(journals.length)} />
      </div>

      {/* Sub-navigation Tabs */}
      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-[#675BD3] text-white border-[#675BD3]'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart of Accounts */}
      {tab === 'coa' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-800">Account List</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['ALL', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                    catFilter === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Account Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-right">Opening (₹)</th>
                  <th className="px-4 py-2.5 text-right">Debit (₹)</th>
                  <th className="px-4 py-2.5 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">{acc.code}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{acc.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {acc.type} · <span className="text-slate-400">{acc.subType}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(acc.openingBalance)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">{formatINR(acc.debitTotal)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">{formatINR(acc.creditTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Journal Entries */}
      {tab === 'journals' && (
        <div className="space-y-3">
          {journals.map((je) => (
            <div key={je.id} className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="text-xs">
                  <span className="font-mono font-bold text-slate-900">{je.entryNumber}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="tabular-nums text-slate-600">{formatDateIN(je.date)}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-700">{je.narration}</span>
                </div>
                <StatusBadge status={je.status} />
              </div>
              <table className="w-full text-left text-xs mt-2">
                <tbody className="divide-y divide-slate-50">
                  {je.lines.map((line, i) => (
                    <tr key={i}>
                      <td className="py-1.5 text-slate-800 font-medium">{line.accountName}</td>
                      <td className="py-1.5 text-right tabular-nums w-32">
                        {line.debit > 0 ? formatINR(line.debit) : '—'}
                      </td>
                      <td className="py-1.5 text-right tabular-nums w-32">
                        {line.credit > 0 ? formatINR(line.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* General Ledger */}
      {tab === 'ledger' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Voucher #</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Narration</th>
                <th className="px-4 py-2.5 text-right">Debit</th>
                <th className="px-4 py-2.5 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {journals.flatMap((je) =>
                je.lines.map((line, idx) => (
                  <tr key={`${je.id}-${idx}`}>
                    <td className="px-4 py-2.5 tabular-nums">{formatDateIN(je.date)}</td>
                    <td className="px-4 py-2.5 font-mono font-medium">{je.entryNumber}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{line.accountName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{je.narration}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{line.debit ? formatINR(line.debit) : '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{line.credit ? formatINR(line.credit) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cash Book & Bank Book */}
      {(tab === 'cashbook' || tab === 'bankbook') && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5">Particulars</th>
                <th className="px-4 py-2.5 text-right">Receipt (Debit)</th>
                <th className="px-4 py-2.5 text-right">Payment (Credit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(tab === 'cashbook' ? cashBookEntries : bankBookEntries).map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-2.5 tabular-nums">{formatDateIN(tx.date)}</td>
                  <td className="px-4 py-2.5 font-mono">{tx.reference}</td>
                  <td className="px-4 py-2.5 text-slate-800">{tx.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">
                    {tx.type === 'Deposit' ? formatINR(tx.amount) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-600">
                    {tx.type === 'Withdrawal' ? formatINR(tx.amount) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Ledger */}
      {tab === 'customer_ledger' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-800">Select Customer Account</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Document #</th>
                <th className="px-4 py-2.5">Particulars</th>
                <th className="px-4 py-2.5 text-right">Debit</th>
                <th className="px-4 py-2.5 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesInvoices
                .filter((i) => i.customerId === selectedCustomerId && i.status !== 'Draft')
                .map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2.5 tabular-nums">{formatDateIN(i.invoiceDate)}</td>
                    <td className="px-4 py-2.5 font-mono">{i.invoiceNumber}</td>
                    <td className="px-4 py-2.5">Sales Invoice Billed</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(i.totalAmount)}</td>
                    <td className="px-4 py-2.5 text-right">—</td>
                  </tr>
                ))}
              {payments
                .filter((p) => p.type === 'Received' && p.partyId === selectedCustomerId)
                .map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 tabular-nums">{formatDateIN(p.date)}</td>
                    <td className="px-4 py-2.5 font-mono">{p.receiptNumber}</td>
                    <td className="px-4 py-2.5">Payment Received ({p.method})</td>
                    <td className="px-4 py-2.5 text-right">—</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{formatINR(p.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Ledger */}
      {tab === 'supplier_ledger' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-800">Select Supplier Account</span>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Document #</th>
                <th className="px-4 py-2.5">Particulars</th>
                <th className="px-4 py-2.5 text-right">Debit</th>
                <th className="px-4 py-2.5 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseBills
                .filter((b) => b.supplierId === selectedSupplierId)
                .map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-2.5 tabular-nums">{formatDateIN(b.purchaseDate)}</td>
                    <td className="px-4 py-2.5 font-mono">{b.billNumber}</td>
                    <td className="px-4 py-2.5">Supplier Purchase Bill</td>
                    <td className="px-4 py-2.5 text-right">—</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(b.totalAmount)}</td>
                  </tr>
                ))}
              {payments
                .filter((p) => p.type === 'Paid' && p.partyId === selectedSupplierId)
                .map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 tabular-nums">{formatDateIN(p.date)}</td>
                    <td className="px-4 py-2.5 font-mono">{p.receiptNumber}</td>
                    <td className="px-4 py-2.5">Payment Made ({p.method})</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{formatINR(p.amount)}</td>
                    <td className="px-4 py-2.5 text-right">—</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trial Balance */}
      {tab === 'trial_balance' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Sample Debit (₹)</th>
                <th className="px-4 py-2.5 text-right">Sample Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5 font-mono">{a.code}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{a.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.type}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(a.debitTotal)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(a.creditTotal)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td colSpan={3} className="px-4 py-3">Sample Trial Balance Totals (Illustrative Demo)</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(totals.debitSum)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(totals.creditSum)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Opening Balances */}
      {tab === 'opening' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Account Name</th>
                <th className="px-4 py-2.5">Classification</th>
                <th className="px-4 py-2.5 text-right">FY Opening Balance (01/04/2026)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5 font-mono">{a.code}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{a.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.type} · {a.subType}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatINR(a.openingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Accounting Periods */}
      {tab === 'periods' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {periods.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{p.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDateIN(p.startDate)} – {formatDateIN(p.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusBadge status={p.status} tone={p.status === 'Open' ? 'success' : 'neutral'} />
                <button
                  type="button"
                  onClick={() => togglePeriod(p.id)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title={p.status === 'Open' ? 'Close Period' : 'Reopen Period'}
                >
                  {p.status === 'Open' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Journal Entry Modal */}
      <Modal
        open={jeOpen}
        onClose={() => setJeOpen(false)}
        title="New Journal Voucher (Prototype UI)"
        footer={
          <>
            <button
              type="button"
              onClick={() => setJeOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="je-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Post Sample Voucher
            </button>
          </>
        }
      >
        <form id="je-form" onSubmit={handleCreateJournal} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Date</label>
              <input
                type="date"
                value={jeDate}
                onChange={(e) => setJeDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={jeAmount}
                onChange={(e) => setJeAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Debit Account</label>
            <select
              value={jeDebitAcc}
              onChange={(e) => setJeDebitAcc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Account</label>
            <select
              value={jeCreditAcc}
              onChange={(e) => setJeCreditAcc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Narration *</label>
            <textarea
              rows={2}
              value={jeNarration}
              onChange={(e) => setJeNarration(e.target.value)}
              placeholder="Explain journal adjustment..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
