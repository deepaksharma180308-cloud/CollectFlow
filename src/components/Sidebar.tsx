import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  PhoneCall,
  Receipt,
  Scale,
  Settings,
  Sparkles,
  Truck,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Business Management',
    items: [
      { label: 'Customers', to: '/customers', icon: <Users className="w-4 h-4" /> },
      { label: 'Suppliers', to: '/suppliers', icon: <Truck className="w-4 h-4" /> },
      { label: 'Products & Inventory', to: '/products', icon: <Package className="w-4 h-4" /> },
      { label: 'Sales Invoices', to: '/sales-invoices', icon: <FileText className="w-4 h-4" /> },
      { label: 'Purchase Bills', to: '/purchase-bills', icon: <Receipt className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Financial Management',
    items: [
      { label: 'Payments', to: '/payments', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Income & Expenses', to: '/expenses', icon: <Wallet className="w-4 h-4" /> },
      { label: 'Accounting', to: '/accounting', icon: <BookOpen className="w-4 h-4" /> },
      { label: 'Bank & Cash', to: '/banking', icon: <Landmark className="w-4 h-4" /> },
    ],
  },
  {
    title: 'CollectFlow',
    items: [
      { label: 'Receivables & Payables', to: '/receivables', icon: <Scale className="w-4 h-4" /> },
      { label: 'Payment Commitments', to: '/commitments', icon: <CalendarCheck className="w-4 h-4" /> },
      { label: 'Follow-ups', to: '/follow-ups', icon: <PhoneCall className="w-4 h-4" /> },
      { label: 'Invoice Disputes', to: '/disputes', icon: <AlertTriangle className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Reports', to: '/reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
      { label: 'Business Insights', to: '/insights', icon: <Sparkles className="w-4 h-4" /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Employees & Roles', to: '/employees', icon: <UserCog className="w-4 h-4" /> },
      { label: 'Settings', to: '/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827] text-slate-300 select-none">
      {/* Brand header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#675BD3] text-white flex items-center justify-center font-bold text-sm shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white font-[family-name:var(--font-heading)] whitespace-nowrap">
            CollectFlow
          </span>
        </NavLink>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#675BD3] text-white'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                      }`
                    }
                  >
                    <span className="shrink-0 opacity-90">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Prototype / Demo notice */}
      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-slate-400 shrink-0">
        <p className="font-medium text-slate-300">Demo Prototype Workspace</p>
        <p className="mt-0.5 leading-snug text-slate-400">
          Local sample Indian SME data. Session edits are non-persistent.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800/40 bg-[#111827] h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-68 max-w-[82vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
