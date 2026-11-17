import React, { useEffect, useState } from 'react';
import { Save, Shield } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import { BusinessProfile, PaymentMethod } from '../types';

const METHODS: PaymentMethod[] = ['Bank Transfer', 'UPI', 'Cheque', 'Cash'];

export const Settings: React.FC = () => {
  const { activeBusiness, updateBusinessProfile, showToast } = useApp();
  const [form, setForm] = useState<BusinessProfile>(activeBusiness);
  const [section, setSection] = useState<'business' | 'billing' | 'notifications' | 'security'>('business');

  useEffect(() => {
    setForm(activeBusiness);
  }, [activeBusiness]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(form);
  };

  const toggleMethod = (m: PaymentMethod) => {
    const exists = form.acceptedMethods.includes(m);
    const next = exists
      ? form.acceptedMethods.filter((x) => x !== m)
      : [...form.acceptedMethods, m];
    setForm({ ...form, acceptedMethods: next });
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure business profile, GSTIN details, financial year, invoice numbering, payment methods, and security preferences."
      />

      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto">
        {(
          [
            { key: 'business', label: 'Business & GSTIN Profile' },
            { key: 'billing', label: 'Invoice, Tax & Payment Methods' },
            { key: 'notifications', label: 'Notification Preferences' },
            { key: 'security', label: 'User Profile & Security' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSection(t.key)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border whitespace-nowrap ${
              section === t.key
                ? 'bg-[#675BD3] text-white border-[#675BD3]'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-xl p-6 max-w-4xl">
        {section === 'business' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Business Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Entity Name</label>
              <input
                type="text"
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">State & PIN</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {section === 'billing' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Year</label>
                <input
                  type="text"
                  value={form.financialYear}
                  onChange={(e) => setForm({ ...form, financialYear: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={form.currency}
                  readOnly
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Invoice Sequence</label>
                <input
                  type="number"
                  value={form.nextInvoiceNumber}
                  onChange={(e) => setForm({ ...form, nextInvoiceNumber: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
                <select
                  value={form.defaultGstRate}
                  onChange={(e) => setForm({ ...form, defaultGstRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Credit Terms (Days)</label>
                <input
                  type="number"
                  value={form.defaultPaymentTerms}
                  onChange={(e) => setForm({ ...form, defaultPaymentTerms: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Accepted Payment Methods</label>
              <div className="flex items-center gap-3 flex-wrap">
                {METHODS.map((m) => (
                  <label
                    key={m}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.acceptedMethods.includes(m)}
                      onChange={() => toggleMethod(m)}
                      className="rounded border-slate-300 text-[#675BD3]"
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'notifications' && (
          <div className="space-y-3">
            {(
              [
                { key: 'overdueReminders', label: 'Overdue invoice alerts in header & dashboard' },
                { key: 'missedCommitments', label: 'Missed payment commitment escalation alerts' },
                { key: 'lowStockAlerts', label: 'Inventory low-stock reorder threshold warnings' },
                { key: 'dailySummaryEmail', label: 'Daily evening collection summary digest (UI preference)' },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 text-sm cursor-pointer"
              >
                <span className="text-slate-800">{item.label}</span>
                <input
                  type="checkbox"
                  checked={form.notifications[item.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notifications: { ...form.notifications, [item.key]: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 text-[#675BD3]"
                />
              </label>
            ))}
          </div>
        )}

        {section === 'security' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#675BD3] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <p className="font-bold text-slate-900">Signed in as Rajesh Kulkarni (Business Owner)</p>
                <p className="mt-0.5">rajesh@shreeganeshtrading.in · Prototype Demo Session</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Two-Factor Auth (UI Setting)</label>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                  <option>Authenticator App (Recommended)</option>
                  <option>SMS OTP (+91 98201 •••10)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Timeout</label>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                  <option>30 Minutes</option>
                  <option>2 Hours</option>
                  <option>8 Hours</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                showToast({
                  type: 'info',
                  title: 'Password reset UI triggered',
                  description: 'Authentication will connect to FastAPI backend in Phase 2.',
                })
              }
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Change Password (UI Preview)
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
