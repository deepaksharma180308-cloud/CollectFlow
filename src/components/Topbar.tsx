import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  Menu,
  PhoneCall,
  Plus,
  Search,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/format';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const {
    businesses,
    activeBusiness,
    setActiveBusinessId,
    customers,
    suppliers,
    salesInvoices,
    products,
    commitments,
  } = useApp();

  const [bizMenuOpen, setBizMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setBizMenuOpen(false);
        setQuickOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { id: string; label: string; meta: string; to: string }[] = [];
    customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) =>
        results.push({ id: c.id, label: c.name, meta: `Customer · ${c.city}`, to: `/customers/${c.id}` })
      );
    suppliers
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((s) =>
        results.push({ id: s.id, label: s.name, meta: `Supplier · ${s.city}`, to: '/suppliers' })
      );
    salesInvoices
      .filter((i) => i.invoiceNumber.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((i) =>
        results.push({
          id: i.id,
          label: i.invoiceNumber,
          meta: `Invoice · ${formatINR(i.totalAmount)} · ${i.status}`,
          to: '/sales-invoices',
        })
      );
    products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((p) =>
        results.push({
          id: p.id,
          label: p.name,
          meta: `SKU ${p.sku} · Stock: ${p.availableStock} ${p.unit}`,
          to: '/products',
        })
      );
    return results;
  }, [searchQuery, customers, suppliers, salesInvoices, products]);

  const notifications = useMemo(() => {
    const items: { id: string; title: string; detail: string; to: string }[] = [];
    salesInvoices
      .filter((i) => i.status === 'Overdue')
      .forEach((i) => {
        const cust = customers.find((c) => c.id === i.customerId);
        items.push({
          id: `n-inv-${i.id}`,
          title: `Overdue: ${i.invoiceNumber}`,
          detail: `${cust?.name || 'Customer'} · ${formatINR(i.totalAmount - i.paidAmount)} due`,
          to: '/receivables',
        });
      });
    commitments
      .filter((c) => c.status === 'Missed')
      .forEach((c) => {
        const cust = customers.find((cu) => cu.id === c.customerId);
        items.push({
          id: `n-com-${c.id}`,
          title: `Missed Commitment: ${c.invoiceNumber}`,
          detail: `${cust?.name || 'Customer'} · Promised ${formatINR(c.promisedAmount)}`,
          to: '/commitments',
        });
      });
    products
      .filter((p) => p.availableStock <= p.reorderLevel)
      .forEach((p) => {
        items.push({
          id: `n-stk-${p.id}`,
          title: `Low Stock: ${p.name}`,
          detail: `${p.availableStock} ${p.unit} left (Reorder at ${p.reorderLevel})`,
          to: '/products',
        });
      });
    return items;
  }, [salesInvoices, commitments, products, customers]);

  return (
    <header
      ref={containerRef}
      className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 no-print"
    >
      {/* Left: Mobile trigger + Business Switcher */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBizMenuOpen((v) => !v);
              setQuickOpen(false);
              setNotifOpen(false);
              setProfileOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-left transition-colors max-w-[230px] sm:max-w-[280px]"
          >
            <Building2 className="w-4 h-4 text-[#675BD3] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
              {activeBusiness.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {bizMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Business Entity
              </div>
              {businesses.map((biz) => {
                const active = biz.id === activeBusiness.id;
                return (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => {
                      setActiveBusinessId(biz.id);
                      setBizMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{biz.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {biz.city} · GSTIN {biz.gstin}
                      </p>
                    </div>
                    {active && <Check className="w-4 h-4 text-[#675BD3] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:block relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchFocused(true);
          }}
          placeholder="Search customers, invoices, SKUs, suppliers..."
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#675BD3] transition-colors"
        />
        {searchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500">
                No records matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => {
                    navigate(res.to);
                    setSearchQuery('');
                    setSearchFocused(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 flex flex-col"
                >
                  <span className="text-xs font-semibold text-slate-900">{res.label}</span>
                  <span className="text-[11px] text-slate-500">{res.meta}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Quick Create, Notifications, User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Create */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setQuickOpen((v) => !v);
              setNotifOpen(false);
              setProfileOpen(false);
              setBizMenuOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Create</span>
          </button>

          {quickOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Create New
              </div>
              {[
                { label: 'Sales Invoice', to: '/sales-invoices?new=1', icon: <FileText className="w-3.5 h-3.5" /> },
                { label: 'Record Payment', to: '/payments?new=1', icon: <CreditCard className="w-3.5 h-3.5" /> },
                { label: 'Payment Commitment', to: '/commitments?new=1', icon: <CalendarCheck className="w-3.5 h-3.5" /> },
                { label: 'Collection Follow-up', to: '/follow-ups?new=1', icon: <PhoneCall className="w-3.5 h-3.5" /> },
                { label: 'Add Expense', to: '/expenses?new=1', icon: <Wallet className="w-3.5 h-3.5" /> },
                { label: 'New Customer', to: '/customers?new=1', icon: <Users className="w-3.5 h-3.5" /> },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    navigate(item.to);
                    setQuickOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#675BD3] flex items-center gap-2.5"
                >
                  <span className="text-slate-400">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setQuickOpen(false);
              setProfileOpen(false);
              setBizMenuOpen(false);
            }}
            aria-label="Open notifications"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Action Alerts</span>
                <span className="text-[11px] text-slate-500 tabular-nums">{notifications.length} items</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    All caught up. No pending alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        navigate(n.to);
                        setNotifOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.detail}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setQuickOpen(false);
              setNotifOpen(false);
              setBizMenuOpen(false);
            }}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-[#675BD3]/15 text-[#675BD3] font-bold text-xs flex items-center justify-center shrink-0">
              RK
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">Rajesh Kulkarni</p>
              <p className="text-[11px] text-slate-500 leading-tight">Business Owner</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">Rajesh Kulkarni</p>
                <p className="text-[11px] text-slate-500">rajesh@shreeganeshtrading.in</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate('/settings');
                  setProfileOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Business & Profile Settings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/employees');
                  setProfileOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Manage Team & Roles</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
