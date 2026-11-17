import React, { useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Sidebar } from '../components/Sidebar';
import { ToastContainer } from '../components/ToastContainer';
import { Topbar } from '../components/Topbar';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F7F8FC] text-slate-900">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
};
