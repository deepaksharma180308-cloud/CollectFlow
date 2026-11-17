import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Accounting } from './pages/Accounting';
import { Banking } from './pages/Banking';
import { BusinessInsights } from './pages/BusinessInsights';
import { Commitments } from './pages/Commitments';
import { CustomerDetail } from './pages/CustomerDetail';
import { Customers } from './pages/Customers';
import { Dashboard } from './pages/Dashboard';
import { Disputes } from './pages/Disputes';
import { Employees } from './pages/Employees';
import { Expenses } from './pages/Expenses';
import { FollowUps } from './pages/FollowUps';
import { Payables } from './pages/Payables';
import { Payments } from './pages/Payments';
import { Products } from './pages/Products';
import { PurchaseBills } from './pages/PurchaseBills';
import { Receivables } from './pages/Receivables';
import { Reports } from './pages/Reports';
import { SalesInvoices } from './pages/SalesInvoices';
import { Settings } from './pages/Settings';
import { Suppliers } from './pages/Suppliers';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales-invoices" element={<SalesInvoices />} />
            <Route path="/purchase-bills" element={<PurchaseBills />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/banking" element={<Banking />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/payables" element={<Payables />} />
            <Route path="/commitments" element={<Commitments />} />
            <Route path="/follow-ups" element={<FollowUps />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/insights" element={<BusinessInsights />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </AppProvider>
  );
}
