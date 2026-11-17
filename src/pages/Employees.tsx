import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { Employee, EmployeeRole } from '../types';
import { DEMO_TODAY, formatINR } from '../utils/format';

const ROLES: EmployeeRole[] = [
  'Business Owner',
  'Administrator',
  'Accountant',
  'Sales Executive',
  'Collection Executive',
  'Viewer',
];

export const Employees: React.FC = () => {
  const { employees, setEmployees, customers, followUps, showToast } = useApp();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<EmployeeRole>('Collection Executive');
  const [department, setDepartment] = useState('Receivables & Recovery');
  const [monthlyTarget, setMonthlyTarget] = useState(800000);

  const handleRoleChange = (empId: string, nextRole: EmployeeRole) => {
    setEmployees((prev) => prev.map((e) => (e.id === empId ? { ...e, role: nextRole } : e)));
    showToast({ type: 'success', title: 'Role updated', description: `Assigned ${nextRole}` });
  };

  const handleToggleStatus = (emp: Employee) => {
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: nextStatus } : e)));
    showToast({ type: 'info', title: `${emp.name} marked ${nextStatus}` });
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast({ type: 'error', title: 'Name and email required' });
      return;
    }
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name,
      email,
      phone: phone || '+91 98200 00000',
      role,
      department,
      status: 'Active',
      joinedDate: DEMO_TODAY,
      monthlyTarget,
      collectedThisMonth: 0,
    };
    setEmployees((prev) => [newEmp, ...prev]);
    showToast({ type: 'success', title: 'Employee added', description: `${name} (${role})` });
    setCreateOpen(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  const totalCollected = employees.reduce((s, e) => s + e.collectedThisMonth, 0);
  const totalTarget = employees.reduce((s, e) => s + e.monthlyTarget, 0);

  const columns: ColumnDef<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (e) => (
        <div>
          <p className="font-semibold text-slate-900">{e.name}</p>
          <p className="text-xs text-slate-500">
            {e.email} · {e.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role Assignment',
      render: (e) => (
        <select
          value={e.role}
          onChange={(ev) => handleRoleChange(e.id, ev.target.value as EmployeeRole)}
          className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-md bg-white text-slate-800"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'assigned',
      header: 'Customers / Follow-ups',
      render: (e) => {
        const custCount = customers.filter((c) => c.assignedEmployeeId === e.id).length;
        const fuCount = followUps.filter((f) => f.assignedEmployeeId === e.id && f.status !== 'Completed').length;
        return (
          <span className="text-xs text-slate-700 tabular-nums">
            {custCount} customers · {fuCount} open tasks
          </span>
        );
      },
    },
    {
      key: 'performance',
      header: 'Collection Performance',
      align: 'right',
      render: (e) => {
        const pct = e.monthlyTarget > 0 ? Math.round((e.collectedThisMonth / e.monthlyTarget) * 100) : 0;
        return (
          <div className="text-xs tabular-nums">
            <p className="font-semibold text-slate-900">{formatINR(e.collectedThisMonth)}</p>
            <p className="text-slate-500">
              {pct}% of {formatINR(e.monthlyTarget)}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (e) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(e)}
          className="text-xs font-medium text-[#675BD3] hover:underline"
        >
          {e.status === 'Active' ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees & Roles"
        subtitle="Manage team members, role-based access levels, customer assignments, and collection recovery targets."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Team Members" value={String(employees.length)} />
        <StatCard title="Active Users" value={String(employees.filter((e) => e.status === 'Active').length)} tone="positive" />
        <StatCard title="Team Monthly Target" value={formatINR(totalTarget)} />
        <StatCard title="Collected This Month" value={formatINR(totalCollected)} tone="accent" />
      </div>

      <DataTable
        data={employees}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Search name, email, role..."
        searchFilter={(e, q) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q)
        }
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Employee"
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
              form="emp-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Add Member
            </button>
          </>
        }
      >
        <form id="emp-form" onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as EmployeeRole)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Collection Target (₹)</label>
              <input
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
