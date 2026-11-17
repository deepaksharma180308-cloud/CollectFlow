import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Info, Plus, Upload } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { BankTransaction } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

export const Banking: React.FC = () => {
  const { bankAccounts, setBankAccounts, bankTransactions, setBankTransactions, showToast } = useApp();

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [txType, setTxType] = useState<'Deposit' | 'Withdrawal' | 'Transfer'>('Deposit');
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(bankAccounts[1]?.id || '');
  const [amount, setAmount] = useState(15000);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    if (txType === 'Transfer') {
      if (accountId === toAccountId) {
        showToast({ type: 'error', title: 'Select two different accounts for transfer' });
        return;
      }
      setBankAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, bookBalance: a.bookBalance - amount }
            : a.id === toAccountId
            ? { ...a, bookBalance: a.bookBalance + amount }
            : a
        )
      );
      setBankTransactions((prev) => [
        {
          id: `bt-${Date.now()}`,
          accountId,
          date: DEMO_TODAY,
          type: 'Transfer',
          description: description || 'Internal Bank/Cash Contra Transfer',
          reference: reference || `TRF-${Date.now().toString().slice(-4)}`,
          amount,
          reconciled: false,
        },
        ...prev,
      ]);
    } else {
      const delta = txType === 'Deposit' ? amount : -amount;
      setBankAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, bookBalance: a.bookBalance + delta } : a))
      );
      setBankTransactions((prev) => [
        {
          id: `bt-${Date.now()}`,
          accountId,
          date: DEMO_TODAY,
          type: txType,
          description: description || `${txType} Entry`,
          reference: reference || `TX-${Date.now().toString().slice(-4)}`,
          amount,
          reconciled: false,
        },
        ...prev,
      ]);
    }
    showToast({ type: 'success', title: `${txType} recorded`, description: formatINR(amount) });
    setTxModalOpen(false);
    setDescription('');
    setReference('');
  };

  const toggleReconcile = (tx: BankTransaction) => {
    setBankTransactions((prev) =>
      prev.map((item) => (item.id === tx.id ? { ...item, reconciled: !item.reconciled } : item))
    );
    showToast({
      type: 'info',
      title: tx.reconciled ? 'Marked Unreconciled' : 'Transaction Reconciled',
      description: tx.reference,
    });
  };

  const columns: ColumnDef<BankTransaction>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (t) => t.date,
      render: (t) => <span className="tabular-nums text-xs">{formatDateIN(t.date)}</span>,
    },
    {
      key: 'account',
      header: 'Account',
      render: (t) => {
        const acc = bankAccounts.find((a) => a.id === t.accountId);
        return <span className="text-xs font-semibold text-slate-800">{acc?.name || t.accountId}</span>;
      },
    },
    {
      key: 'desc',
      header: 'Description & Ref',
      render: (t) => (
        <div>
          <p className="text-xs font-medium text-slate-900">{t.description}</p>
          <p className="text-[11px] font-mono text-slate-500">{t.reference}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (t) => (
        <StatusBadge
          status={t.type}
          tone={t.type === 'Deposit' ? 'success' : t.type === 'Withdrawal' ? 'danger' : 'info'}
          showIcon={false}
        />
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (t) => <span className="tabular-nums font-semibold text-slate-900">{formatINR(t.amount)}</span>,
    },
    {
      key: 'reconciled',
      header: 'Reconciliation',
      render: (t) => <StatusBadge status={t.reconciled ? 'Reconciled' : 'Unreconciled'} />,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (t) => (
        <button
          type="button"
          onClick={() => toggleReconcile(t)}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#675BD3] hover:underline"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t.reconciled ? 'Unmatch' : 'Reconcile'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bank & Cash Management"
        subtitle="Track bank & petty cash accounts, deposits, withdrawals, contra transfers, and statement reconciliation."
        actions={
          <>
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              <Upload className="w-4 h-4" /> Import Statement
            </button>
            <button
              type="button"
              onClick={() => setTxModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
            >
              <Plus className="w-4 h-4" /> New Bank / Cash Entry
            </button>
          </>
        }
      />

      <div className="mb-5 p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 flex items-start gap-2.5 text-xs text-sky-900">
        <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <p>
          <strong>Balance Distinction (Demo Data):</strong> <em>Book Balance</em> reflects vouchers recorded inside CollectFlow, whereas <em>Externally Confirmed Bank Balance</em> reflects the last manually imported sample bank statement. Live bank feed sync is not active in this prototype.
        </p>
      </div>

      {/* Bank & Cash Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {bankAccounts.map((acc) => {
          const diff = acc.confirmedBankBalance - acc.bookBalance;
          return (
            <div key={acc.id} className="bg-white border border-slate-200/80 rounded-xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{acc.name}</h2>
                  <p className="text-xs text-slate-500">
                    {acc.kind === 'Bank' ? `${acc.bankName} · A/c ${acc.accountNumber}` : 'Physical Cash Drawer'}
                  </p>
                </div>
                <StatusBadge status={acc.kind} tone={acc.kind === 'Bank' ? 'purple' : 'neutral'} showIcon={false} />
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">CollectFlow Book Balance</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatINR(acc.bookBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confirmed Bank Statement</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {formatINR(acc.confirmedBankBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unreconciled Variance</span>
                  <span className={`font-semibold tabular-nums ${diff !== 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                    {formatINR(diff)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Last reconciled: {formatDateIN(acc.lastReconciledDate)}
              </p>
            </div>
          );
        })}
      </div>

      <DataTable
        data={bankTransactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search bank transactions or UTR..."
        searchFilter={(t, q) =>
          t.description.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q)
        }
      />

      {/* New Transaction / Transfer Modal */}
      <Modal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        title="Record Bank / Cash Transaction"
        footer={
          <>
            <button
              type="button"
              onClick={() => setTxModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="bank-tx-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Entry
            </button>
          </>
        }
      >
        <form id="bank-tx-form" onSubmit={handleSaveTx} className="space-y-4">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(['Deposit', 'Withdrawal', 'Transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={`py-1.5 text-xs font-semibold rounded-md ${
                  txType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {txType === 'Transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            {txType === 'Transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To Account</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / UTR</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cash deposited to HDFC Kalamboli"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Bank Statement Import UI Modal */}
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Bank Statement (Prototype UI)"
        subtitle="Upload CSV / Excel bank statement for manual reconciliation."
        size="md"
        footer={
          <button
            type="button"
            onClick={() => {
              showToast({ type: 'info', title: 'Sample statement parsed (Demo)', description: 'Ready for manual row matching.' });
              setImportModalOpen(false);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
          >
            Simulate Statement Import
          </button>
        }
      >
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <ArrowLeftRight className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">Select HDFC / ICICI CSV Statement</p>
          <p className="text-xs text-slate-500 mt-1">
            Prototype interface only — live bank API integration will connect via backend.
          </p>
        </div>
      </Modal>
    </div>
  );
};
