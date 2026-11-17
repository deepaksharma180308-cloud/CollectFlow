export type CustomerStatus = 'Active' | 'On Hold' | 'Archived';
export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
export type BillStatus = 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
export type PaymentType = 'Received' | 'Paid';
export type PaymentMethod = 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash';
export type CommitmentStatus = 'Pending' | 'Fulfilled' | 'Missed' | 'Rescheduled' | 'Partially Fulfilled';
export type FollowUpStatus = 'Pending' | 'Completed' | 'Overdue' | 'Rescheduled';
export type FollowUpChannel = 'Phone Call' | 'WhatsApp' | 'Email' | 'In-Person Visit';
export type DisputeStatus = 'Open' | 'Under Review' | 'Resolved';
export type DisputePriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type EmployeeRole =
  | 'Business Owner'
  | 'Administrator'
  | 'Accountant'
  | 'Sales Executive'
  | 'Collection Executive'
  | 'Viewer';

export type ExpenseCategory =
  | 'Rent'
  | 'Salaries'
  | 'Electricity'
  | 'Transport'
  | 'Maintenance'
  | 'Marketing'
  | 'Office Expenses'
  | 'Utilities'
  | 'Other Expenses';

export type DisputeCategory =
  | 'Incorrect Amount'
  | 'Incorrect Quantity'
  | 'Damaged Goods'
  | 'Missing Delivery'
  | 'Pricing Issue'
  | 'Quality Issue'
  | 'Missing Documents'
  | 'Other';

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface BusinessProfile {
  id: string;
  name: string;
  legalName: string;
  tradeType: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  financialYear: string;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultPaymentTerms: number;
  defaultGstRate: number;
  acceptedMethods: PaymentMethod[];
  notifications: {
    overdueReminders: boolean;
    missedCommitments: boolean;
    lowStockAlerts: boolean;
    dailySummaryEmail: boolean;
  };
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  creditLimit: number;
  paymentTermsDays: number;
  assignedEmployeeId: string;
  status: CustomerStatus;
  notes: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  paymentTermsDays: number;
  status: 'Active' | 'Archived';
  notes: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  hsnCode: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number;
  openingStock: number;
  availableStock: number;
  reorderLevel: number;
}

export type StockMovementType =
  | 'Stock Received'
  | 'Stock Sold'
  | 'Sales Return'
  | 'Purchase Return'
  | 'Damaged Stock'
  | 'Stock Adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  date: string;
  reference: string;
  notes: string;
}

export interface InvoiceLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
  lineTotal: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  paymentTermsDays: number;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes: string;
  hasCreditNote?: boolean;
  creditNoteAmount?: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  purchaseDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  notes: string;
  hasDebitNote?: boolean;
  debitNoteAmount?: number;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  type: PaymentType;
  partyId: string; // customerId or supplierId
  partyName: string;
  invoiceOrBillId?: string;
  invoiceOrBillNumber?: string;
  date: string;
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  method: PaymentMethod;
  referenceNumber: string;
  isAdvance: boolean;
  notes: string;
}

export interface IncomeRecord {
  id: string;
  title: string;
  category: 'Sales Revenue' | 'Commission' | 'Scrap & Misc' | 'Interest Income' | 'Discount Received';
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: 'Received' | 'Pending';
  notes: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  vendor: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  status: 'Paid' | 'Unpaid';
  isRecurring: boolean;
  attachmentName?: string;
  notes: string;
}

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subType: string;
  openingBalance: number;
  debitTotal: number;
  creditTotal: number;
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  narration: string;
  reference: string;
  lines: JournalLine[];
  status: 'Posted' | 'Draft';
}

export interface AccountingPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: 'Open' | 'Closed';
}

export interface BankCashAccount {
  id: string;
  name: string;
  kind: 'Bank' | 'Cash';
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  bookBalance: number;
  confirmedBankBalance: number;
  lastReconciledDate: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer';
  description: string;
  reference: string;
  amount: number;
  reconciled: boolean;
}

export interface CommitmentHistoryItem {
  id: string;
  date: string;
  action: string;
  note: string;
  byEmployee: string;
}

export interface PaymentCommitment {
  id: string;
  customerId: string;
  invoiceId: string;
  invoiceNumber: string;
  promisedAmount: number;
  fulfilledAmount: number;
  promisedDate: string;
  assignedEmployeeId: string;
  status: CommitmentStatus;
  notes: string;
  history: CommitmentHistoryItem[];
}

export interface FollowUpCommunication {
  id: string;
  date: string;
  channel: FollowUpChannel;
  summary: string;
  byEmployee: string;
}

export interface FollowUpTask {
  id: string;
  customerId: string;
  invoiceId: string;
  invoiceNumber: string;
  assignedEmployeeId: string;
  dueDate: string;
  channel: FollowUpChannel;
  status: FollowUpStatus;
  notes: string;
  communications: FollowUpCommunication[];
}

export interface DisputeHistoryItem {
  id: string;
  date: string;
  action: string;
  note: string;
  byEmployee: string;
}

export interface InvoiceDispute {
  id: string;
  disputeNumber: string;
  customerId: string;
  invoiceId: string;
  invoiceNumber: string;
  category: DisputeCategory;
  description: string;
  disputedAmount: number;
  assignedEmployeeId: string;
  priority: DisputePriority;
  resolutionDeadline: string;
  status: DisputeStatus;
  attachments: string[];
  history: DisputeHistoryItem[];
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  status: 'Active' | 'Inactive';
  joinedDate: string;
  monthlyTarget: number;
  collectedThisMonth: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}
