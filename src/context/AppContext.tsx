import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  DEMO_BUSINESSES,
  INITIAL_ACCOUNTS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_COMMITMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_DISPUTES,
  INITIAL_EMPLOYEES,
  INITIAL_EXPENSES,
  INITIAL_FOLLOWUPS,
  INITIAL_INCOMES,
  INITIAL_JOURNALS,
  INITIAL_PAYMENTS,
  INITIAL_PERIODS,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASE_BILLS,
  INITIAL_SALES_INVOICES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SUPPLIERS,
} from '../data/mockData';
import {
  AccountingPeriod,
  BankCashAccount,
  BankTransaction,
  BusinessProfile,
  ChartOfAccount,
  Customer,
  Employee,
  ExpenseRecord,
  FollowUpTask,
  IncomeRecord,
  InvoiceDispute,
  JournalEntry,
  PaymentCommitment,
  PaymentRecord,
  Product,
  PurchaseBill,
  SalesInvoice,
  StockMovement,
  Supplier,
  ToastMessage,
} from '../types';
import { DEMO_TODAY } from '../utils/format';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
}

interface AppContextValue {
  businesses: BusinessProfile[];
  activeBusiness: BusinessProfile;
  setActiveBusinessId: (id: string) => void;
  updateBusinessProfile: (updated: BusinessProfile) => void;

  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  stockMovements: StockMovement[];
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => void;

  salesInvoices: SalesInvoice[];
  setSalesInvoices: React.Dispatch<React.SetStateAction<SalesInvoice[]>>;
  purchaseBills: PurchaseBill[];
  setPurchaseBills: React.Dispatch<React.SetStateAction<PurchaseBill[]>>;

  payments: PaymentRecord[];
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'receiptNumber'>, commitmentId?: string) => void;

  incomes: IncomeRecord[];
  setIncomes: React.Dispatch<React.SetStateAction<IncomeRecord[]>>;
  expenses: ExpenseRecord[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;

  accounts: ChartOfAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<ChartOfAccount[]>>;
  journals: JournalEntry[];
  setJournals: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  periods: AccountingPeriod[];
  setPeriods: React.Dispatch<React.SetStateAction<AccountingPeriod[]>>;

  bankAccounts: BankCashAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankCashAccount[]>>;
  bankTransactions: BankTransaction[];
  setBankTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;

  commitments: PaymentCommitment[];
  setCommitments: React.Dispatch<React.SetStateAction<PaymentCommitment[]>>;

  followUps: FollowUpTask[];
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUpTask[]>>;

  disputes: InvoiceDispute[];
  setDisputes: React.Dispatch<React.SetStateAction<InvoiceDispute[]>>;

  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;

  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  confirmState: ConfirmOptions | null;
  requestConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>(DEMO_BUSINESSES);
  const [activeBusinessId, setActiveBusinessId] = useState<string>(DEMO_BUSINESSES[0].id);

  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(INITIAL_SALES_INVOICES);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>(INITIAL_PURCHASE_BILLS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [incomes, setIncomes] = useState<IncomeRecord[]>(INITIAL_INCOMES);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(INITIAL_ACCOUNTS);
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
  const [periods, setPeriods] = useState<AccountingPeriod[]>(INITIAL_PERIODS);
  const [bankAccounts, setBankAccounts] = useState<BankCashAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(INITIAL_BANK_TRANSACTIONS);
  const [commitments, setCommitments] = useState<PaymentCommitment[]>(INITIAL_COMMITMENTS);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(INITIAL_FOLLOWUPS);
  const [disputes, setDisputes] = useState<InvoiceDispute[]>(INITIAL_DISPUTES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || businesses[0];

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requestConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  const updateBusinessProfile = useCallback(
    (updated: BusinessProfile) => {
      setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showToast({ type: 'success', title: 'Business settings saved', description: `${updated.name} preferences updated in demo session.` });
    },
    [showToast]
  );

  const addStockMovement = useCallback(
    (movement: Omit<StockMovement, 'id'>) => {
      const id = `sm-${Date.now()}`;
      setStockMovements((prev) => [{ ...movement, id }, ...prev]);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === movement.productId
            ? { ...p, availableStock: Math.max(0, p.availableStock + movement.quantity) }
            : p
        )
      );
    },
    []
  );

  const recordPayment = useCallback(
    (payment: Omit<PaymentRecord, 'id' | 'receiptNumber'>, commitmentId?: string) => {
      const prefix = payment.type === 'Received' ? 'RCPT-26-' : 'PYMT-26-';
      const nextNum = 310 + payments.length;
      const receiptNumber = `${prefix}${nextNum}`;
      const newPayment: PaymentRecord = {
        ...payment,
        id: `pay-${Date.now()}`,
        receiptNumber,
      };
      setPayments((prev) => [newPayment, ...prev]);

      // Update Sales Invoice or Purchase Bill if linked
      if (payment.type === 'Received' && payment.invoiceOrBillId) {
        setSalesInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id !== payment.invoiceOrBillId) return inv;
            const newPaid = Math.min(inv.totalAmount, inv.paidAmount + payment.allocatedAmount);
            const newStatus = newPaid >= inv.totalAmount ? 'Paid' : newPaid > 0 ? 'Partial' : inv.status;
            return { ...inv, paidAmount: newPaid, status: newStatus };
          })
        );
      } else if (payment.type === 'Paid' && payment.invoiceOrBillId) {
        setPurchaseBills((prev) =>
          prev.map((bill) => {
            if (bill.id !== payment.invoiceOrBillId) return bill;
            const newPaid = Math.min(bill.totalAmount, bill.paidAmount + payment.allocatedAmount);
            const newStatus = newPaid >= bill.totalAmount ? 'Paid' : newPaid > 0 ? 'Partial' : bill.status;
            return { ...bill, paidAmount: newPaid, status: newStatus };
          })
        );
      }

      // Update Cash or Primary Bank book balance
      const targetAccountId = payment.method === 'Cash' ? 'ba-3' : 'ba-1';
      const delta = payment.type === 'Received' ? payment.amount : -payment.amount;
      setBankAccounts((prev) =>
        prev.map((acc) =>
          acc.id === targetAccountId ? { ...acc, bookBalance: acc.bookBalance + delta } : acc
        )
      );
      setBankTransactions((prev) => [
        {
          id: `bt-${Date.now()}`,
          accountId: targetAccountId,
          date: payment.date || DEMO_TODAY,
          type: payment.type === 'Received' ? 'Deposit' : 'Withdrawal',
          description: `${payment.type === 'Received' ? 'Payment Received' : 'Supplier Payment'} — ${payment.partyName}`,
          reference: payment.referenceNumber || receiptNumber,
          amount: payment.amount,
          reconciled: false,
        },
        ...prev,
      ]);

      // Optionally update linked Payment Commitment
      if (commitmentId) {
        setCommitments((prev) =>
          prev.map((c) => {
            if (c.id !== commitmentId) return c;
            const totalFulfilled = c.fulfilledAmount + payment.amount;
            const nextStatus = totalFulfilled >= c.promisedAmount ? 'Fulfilled' : 'Partially Fulfilled';
            return {
              ...c,
              fulfilledAmount: totalFulfilled,
              status: nextStatus,
              history: [
                ...c.history,
                {
                  id: `ch-${Date.now()}`,
                  date: payment.date || DEMO_TODAY,
                  action: nextStatus,
                  note: `Actual payment ${receiptNumber} recorded (₹${payment.amount.toLocaleString('en-IN')}).`,
                  byEmployee: 'Rajesh Kulkarni',
                },
              ],
            };
          })
        );
      }

      showToast({
        type: 'success',
        title: `${payment.type === 'Received' ? 'Receipt' : 'Payment'} ${receiptNumber} recorded`,
        description: `${payment.partyName} · ₹${payment.amount.toLocaleString('en-IN')}`,
      });
    },
    [payments.length, showToast]
  );

  return (
    <AppContext.Provider
      value={{
        businesses,
        activeBusiness,
        setActiveBusinessId: (id: string) => {
          setActiveBusinessId(id);
          const found = businesses.find((b) => b.id === id);
          if (found) {
            showToast({ type: 'info', title: `Switched business context`, description: found.name });
          }
        },
        updateBusinessProfile,
        customers,
        setCustomers,
        suppliers,
        setSuppliers,
        products,
        setProducts,
        stockMovements,
        addStockMovement,
        salesInvoices,
        setSalesInvoices,
        purchaseBills,
        setPurchaseBills,
        payments,
        recordPayment,
        incomes,
        setIncomes,
        expenses,
        setExpenses,
        accounts,
        setAccounts,
        journals,
        setJournals,
        periods,
        setPeriods,
        bankAccounts,
        setBankAccounts,
        bankTransactions,
        setBankTransactions,
        commitments,
        setCommitments,
        followUps,
        setFollowUps,
        disputes,
        setDisputes,
        employees,
        setEmployees,
        toasts,
        showToast,
        dismissToast,
        confirmState,
        requestConfirm,
        closeConfirm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
