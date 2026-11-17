import React, { useMemo, useState } from 'react';
import { Edit2, Eye, Plus } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { Supplier } from '../types';
import { formatDateIN, formatINR, isValidGSTIN } from '../utils/format';

const EMPTY_SUPPLIER = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  gstin: '',
  address: '',
  city: '',
  paymentTermsDays: 30,
  status: 'Active' as 'Active' | 'Archived',
  notes: '',
};

export const Suppliers: React.FC = () => {
  const { suppliers, setSuppliers, purchaseBills, payments, showToast } = useApp();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [error, setError] = useState('');

  const getPayable = (supId: string) =>
    purchaseBills
      .filter((b) => b.supplierId === supId)
      .reduce((sum, b) => sum + Math.max(0, b.totalAmount - b.paidAmount), 0);

  const summary = useMemo(() => {
    const totalPayable = suppliers.reduce((sum, s) => sum + getPayable(s.id), 0);
    return {
      count: suppliers.length,
      active: suppliers.filter((s) => s.status === 'Active').length,
      totalPayable,
    };
  }, [suppliers, purchaseBills]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_SUPPLIER);
    setError('');
    setFormOpen(true);
  };

  const openEdit = (s: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      gstin: s.gstin,
      address: s.address,
      city: s.city,
      paymentTermsDays: s.paymentTermsDays,
      status: s.status,
      notes: s.notes,
    });
    setError('');
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Supplier name and phone number are required.');
      return;
    }
    if (form.gstin.trim() && !isValidGSTIN(form.gstin)) {
      setError('Enter a valid 15-character GSTIN.');
      return;
    }
    if (editing) {
      setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
      showToast({ type: 'success', title: 'Supplier updated', description: form.name });
    } else {
      const code = `SUP-${2001 + suppliers.length}`;
      setSuppliers((prev) => [{ id: `sup-${Date.now()}`, code, ...form }, ...prev]);
      showToast({ type: 'success', title: 'Supplier added', description: `${code} · ${form.name}` });
    }
    setFormOpen(false);
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      key: 'name',
      header: 'Supplier',
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.name}</p>
          <p className="text-xs text-slate-500">
            <span className="font-mono">{s.code}</span> · {s.city}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (s) => (
        <div className="text-xs">
          <p className="text-slate-800">{s.contactPerson} · {s.phone}</p>
          <p className="text-slate-500">{s.email}</p>
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      render: (s) => <span className="font-mono text-xs text-slate-700">{s.gstin || '—'}</span>,
    },
    {
      key: 'payable',
      header: 'Outstanding Payable',
      align: 'right',
      sortable: true,
      sortValue: (s) => getPayable(s.id),
      render: (s) => {
        const amt = getPayable(s.id);
        return (
          <span className={`font-semibold tabular-nums ${amt > 0 ? 'text-red-600' : 'text-slate-700'}`}>
            {formatINR(amt)}
          </span>
        );
      },
    },
    {
      key: 'terms',
      header: 'Terms',
      render: (s) => <span className="text-xs text-slate-600">Net {s.paymentTermsDays}d</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDetailSupplier(s);
            }}
            className="p-1.5 rounded-md text-slate-500 hover:text-[#675BD3] hover:bg-slate-100"
            title="Supplier Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => openEdit(s, e)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Edit Supplier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const supBills = detailSupplier ? purchaseBills.filter((b) => b.supplierId === detailSupplier.id) : [];
  const supPayments = detailSupplier
    ? payments.filter((p) => p.type === 'Paid' && p.partyId === detailSupplier.id)
    : [];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage wholesale vendors, GSTINs, purchase history, bills, and outstanding payables."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
        <StatCard title="Total Suppliers" value={String(summary.count)} subtitle={`${summary.active} active vendors`} />
        <StatCard title="Total Supplier Bills" value={String(purchaseBills.length)} />
        <StatCard title="Total Payables" value={formatINR(summary.totalPayable)} tone="danger" />
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search supplier, GSTIN, city..."
        searchFilter={(s, q) =>
          s.name.toLowerCase().includes(q) ||
          s.gstin.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
        }
        onRowClick={(s) => setDetailSupplier(s)}
      />

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Supplier · ${editing.code}` : 'Add New Supplier'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="supplier-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Supplier
            </button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {error && (
            <div className="sm:col-span-2 p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
            <input
              type="number"
              value={form.paymentTermsDays}
              onChange={(e) => setForm({ ...form, paymentTermsDays: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Supplier Details Modal */}
      <Modal
        open={!!detailSupplier}
        onClose={() => setDetailSupplier(null)}
        title={detailSupplier?.name || ''}
        subtitle={
          detailSupplier
            ? `${detailSupplier.code} · GSTIN ${detailSupplier.gstin} · ${detailSupplier.city}`
            : ''
        }
        size="xl"
      >
        {detailSupplier && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Contact Person</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{detailSupplier.contactPerson}</p>
                <p className="text-xs text-slate-600 mt-0.5">{detailSupplier.phone}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Outstanding Payable</p>
                <p className="text-lg font-bold text-red-600 tabular-nums mt-0.5">
                  {formatINR(getPayable(detailSupplier.id))}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Payment Terms</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  Net {detailSupplier.paymentTermsDays} Days
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{detailSupplier.notes}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">Supplier Bills & Due Dates</h3>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Bill #</th>
                    <th className="px-3 py-2">Supplier Inv #</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supBills.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2 font-mono font-medium">{b.billNumber}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{b.supplierInvoiceNumber}</td>
                      <td className="px-3 py-2 tabular-nums">{formatDateIN(b.dueDate)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatINR(b.totalAmount)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">
                        {formatINR(b.totalAmount - b.paidAmount)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                  {supBills.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                        No purchase bills recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">Payment History</h3>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Payment #</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Method & Ref</th>
                    <th className="px-3 py-2 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-mono font-medium">{p.receiptNumber}</td>
                      <td className="px-3 py-2 tabular-nums">{formatDateIN(p.date)}</td>
                      <td className="px-3 py-2">{p.method} · {p.referenceNumber}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatINR(p.amount)}</td>
                    </tr>
                  ))}
                  {supPayments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
