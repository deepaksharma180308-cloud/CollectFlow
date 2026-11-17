import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, Edit2, Eye, Plus } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { Customer, CustomerStatus } from '../types';
import { DEMO_TODAY, formatINR, isValidGSTIN } from '../utils/format';

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  gstin: '',
  address: '',
  city: '',
  state: 'Maharashtra',
  creditLimit: 500000,
  paymentTermsDays: 30,
  assignedEmployeeId: 'emp-3',
  status: 'Active' as CustomerStatus,
  notes: '',
};

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, setCustomers, salesInvoices, employees, showToast, requestConfirm } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerStatus>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingCustomer(null);
      setForm(EMPTY_FORM);
      setErrors({});
      setModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const getOutstanding = (customerId: string) =>
    salesInvoices
      .filter((i) => i.customerId === customerId && i.status !== 'Draft')
      .reduce((sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount), 0);

  const filteredCustomers = useMemo(() => {
    if (statusFilter === 'ALL') return customers;
    return customers.filter((c) => c.status === statusFilter);
  }, [customers, statusFilter]);

  const summary = useMemo(() => {
    const activeCount = customers.filter((c) => c.status === 'Active').length;
    const onHoldCount = customers.filter((c) => c.status === 'On Hold').length;
    const totalReceivables = customers.reduce((sum, c) => sum + getOutstanding(c.id), 0);
    return { total: customers.length, activeCount, onHoldCount, totalReceivables };
  }, [customers, salesInvoices]);

  const openAdd = () => {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(c);
    setForm({
      name: c.name,
      contactPerson: c.contactPerson,
      phone: c.phone,
      email: c.email,
      gstin: c.gstin,
      address: c.address,
      city: c.city,
      state: c.state,
      creditLimit: c.creditLimit,
      paymentTermsDays: c.paymentTermsDays,
      assignedEmployeeId: c.assignedEmployeeId,
      status: c.status,
      notes: c.notes,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleArchive = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm({
      title: `Archive ${c.name}?`,
      message: 'Archived customers remain visible in historical ledgers and reports but are hidden from active billing.',
      confirmLabel: 'Archive Customer',
      tone: 'danger',
      onConfirm: () => {
        setCustomers((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, status: 'Archived' } : item))
        );
        showToast({ type: 'info', title: 'Customer archived', description: c.name });
      },
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Business / customer name is required.';
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';
    if (form.gstin.trim() && !isValidGSTIN(form.gstin)) {
      nextErrors.gstin = 'Enter a valid 15-character GSTIN (e.g. 27AABFM4521K1Z8).';
    }
    if (form.creditLimit < 0) nextErrors.creditLimit = 'Credit limit cannot be negative.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...form, gstin: form.gstin.toUpperCase() } : c))
      );
      showToast({ type: 'success', title: 'Customer updated', description: form.name });
    } else {
      const nextCode = `CUST-${1001 + customers.length}`;
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        code: nextCode,
        ...form,
        gstin: form.gstin.toUpperCase(),
        createdAt: DEMO_TODAY,
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      showToast({ type: 'success', title: 'Customer added', description: `${nextCode} · ${form.name}` });
    }
    setModalOpen(false);
  };

  const columns: ColumnDef<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.name}</p>
          <p className="text-xs text-slate-500">
            <span className="font-mono">{c.code}</span> · {c.city}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (c) => (
        <div className="text-xs">
          <p className="text-slate-800">{c.phone}</p>
          <p className="text-slate-500">{c.email}</p>
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      render: (c) => (
        <span className="font-mono text-xs text-slate-700">{c.gstin || 'Unregistered'}</span>
      ),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      sortable: true,
      sortValue: (c) => getOutstanding(c.id),
      render: (c) => {
        const out = getOutstanding(c.id);
        return (
          <span className={`font-semibold tabular-nums ${out > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
            {formatINR(out)}
          </span>
        );
      },
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.creditLimit,
      render: (c) => <span className="tabular-nums text-slate-700">{formatINR(c.creditLimit)}</span>,
    },
    {
      key: 'terms',
      header: 'Terms',
      render: (c) => <span className="text-xs text-slate-600">Net {c.paymentTermsDays}d</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/${c.id}`);
            }}
            title="View Customer Profile"
            className="p-1.5 rounded-md text-slate-500 hover:text-[#675BD3] hover:bg-slate-100"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => openEdit(c, e)}
            title="Edit Customer"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {c.status !== 'Archived' && (
            <button
              type="button"
              onClick={(e) => handleArchive(c, e)}
              title="Archive Customer"
              className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage B2B buyers, GSTIN records, credit limits, payment terms, and assigned collection owners."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Total Customers" value={String(summary.total)} subtitle="Registered B2B accounts" />
        <StatCard title="Active Accounts" value={String(summary.activeCount)} tone="positive" />
        <StatCard title="On Credit Hold" value={String(summary.onHoldCount)} tone="warning" />
        <StatCard title="Total Outstanding" value={formatINR(summary.totalReceivables)} tone="accent" />
      </div>

      <DataTable
        data={filteredCustomers}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search name, ID, GSTIN, city, phone..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.gstin.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
        }
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        toolbarExtra={
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'Active', 'On Hold', 'Archived'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All' : status}
              </button>
            ))}
          </div>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? `Edit Customer · ${editingCustomer.code}` : 'Add New Customer'}
        subtitle="Demo customer directory entry with Indian GSTIN and credit control fields."
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="customer-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
            >
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business / Customer Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Shree Sai Traders Pvt. Ltd."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              placeholder="Primary contact name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98200 00000"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="accounts@company.in"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              placeholder="27AABFM4521K1Z8"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
            {errors.gstin && <p className="text-xs text-red-600 mt-1">{errors.gstin}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Mumbai"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              value={form.creditLimit}
              onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
            {errors.creditLimit && <p className="text-xs text-red-600 mt-1">{errors.creditLimit}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
            <select
              value={form.paymentTermsDays}
              onChange={(e) => setForm({ ...form, paymentTermsDays: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            >
              <option value={0}>Due on Receipt (0 Days)</option>
              <option value={15}>Net 15 Days</option>
              <option value={30}>Net 30 Days</option>
              <option value={45}>Net 45 Days</option>
              <option value={60}>Net 60 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
            <select
              value={form.assignedEmployeeId}
              onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            >
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, market, industrial estate"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Collection preferences, billing remarks..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#675BD3]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
