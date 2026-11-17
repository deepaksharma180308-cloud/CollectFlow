import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { useApp } from '../context/AppContext';
import { exportRowsToCSV, formatDateIN, formatINR, getDaysOverdue } from '../utils/format';

interface ReportMeta {
  id: string;
  title: string;
  category: 'Financial Statements' | 'Ledgers & Books' | 'Operations' | 'CollectFlow';
  description: string;
}

const REPORT_CARDS: ReportMeta[] = [
  { id: 'pnl', title: 'Profit and Loss', category: 'Financial Statements', description: 'Trading revenue, cost of goods, overheads, and net surplus.' },
  { id: 'bs', title: 'Balance Sheet', category: 'Financial Statements', description: 'Assets, liabilities, and owner capital position (illustrative).' },
  { id: 'cf', title: 'Cash Flow Statement', category: 'Financial Statements', description: 'Operating inflows, supplier outflows, and net cash movement.' },
  { id: 'tb', title: 'Trial Balance', category: 'Ledgers & Books', description: 'Sample debit and credit balances across chart of accounts.' },
  { id: 'gl', title: 'General Ledger', category: 'Ledgers & Books', description: 'Account-wise journal postings and voucher lines.' },
  { id: 'cb', title: 'Cash Book', category: 'Ledgers & Books', description: 'Petty cash counter inflows and cash disbursements.' },
  { id: 'bb', title: 'Bank Book', category: 'Ledgers & Books', description: 'HDFC and ICICI bank deposits, NEFT/RTGS, and UPI entries.' },
  { id: 'sales', title: 'Sales Report', category: 'Operations', description: 'Confirmed tax invoices, GST collected, and payment status.' },
  { id: 'purchase', title: 'Purchase Report', category: 'Operations', description: 'Supplier purchase bills, input GST, and balances due.' },
  { id: 'expense', title: 'Expense Report', category: 'Operations', description: 'Category-wise operating overheads and paid status.' },
  { id: 'receivables', title: 'Receivables Report', category: 'CollectFlow', description: 'Customer overdue ageing and outstanding balances.' },
  { id: 'payables', title: 'Payables Report', category: 'CollectFlow', description: 'Vendor bills due and upcoming supplier settlements.' },
  { id: 'inventory', title: 'Inventory Report', category: 'Operations', description: 'Current SKU quantities, units, and reorder thresholds.' },
  { id: 'valuation', title: 'Stock Valuation', category: 'Operations', description: 'Inventory valuation at purchase cost vs potential sale value.' },
  { id: 'cust_pay', title: 'Customer Payment Report', category: 'CollectFlow', description: 'Receipts collected by mode, reference, and customer.' },
  { id: 'commitments', title: 'Payment Commitment Report', category: 'CollectFlow', description: 'Promised vs actual fulfilled collection performance.' },
  { id: 'emp_coll', title: 'Employee Collection Report', category: 'CollectFlow', description: 'Target vs actual recovery per executive.' },
];

export const Reports: React.FC = () => {
  const {
    activeBusiness,
    salesInvoices,
    purchaseBills,
    expenses,
    incomes,
    accounts,
    journals,
    bankTransactions,
    products,
    payments,
    commitments,
    employees,
    customers,
    suppliers,
    showToast,
  } = useApp();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2026-11-17');

  const activeMeta = REPORT_CARDS.find((r) => r.id === selectedReportId) || null;

  const reportData = useMemo(() => {
    const confirmedSales = salesInvoices.filter((i) => i.status !== 'Draft');
    const totalSales = confirmedSales.reduce((s, i) => s + i.totalAmount, 0);
    const totalPurchases = purchaseBills.reduce((s, b) => s + b.totalAmount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalOtherInc = incomes.reduce((s, i) => s + i.amount, 0);
    const totalReceivables = confirmedSales.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const totalPayables = purchaseBills.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);
    const invCostVal = products.reduce((s, p) => s + p.availableStock * p.purchasePrice, 0);

    switch (selectedReportId) {
      case 'pnl':
        return {
          summary: [
            { label: 'Billed Sales', value: formatINR(totalSales) },
            { label: 'Other Income', value: formatINR(totalOtherInc) },
            { label: 'Purchases + Overheads', value: formatINR(totalPurchases + totalExpenses) },
            { label: 'Illustrative Net Margin', value: formatINR(totalSales + totalOtherInc - Math.round(totalPurchases * 0.82) - totalExpenses) },
          ],
          headers: ['Particulars', 'Category', 'Amount (₹)'],
          rows: [
            ['B2B Sales Revenue', 'Direct Income', formatINR(totalSales)],
            ['Counter & Other Income', 'Indirect Income', formatINR(totalOtherInc)],
            ['Purchase of Stock-in-Trade', 'Direct Expense', formatINR(totalPurchases)],
            ['Operating Expenses (Rent, Salaries, Freight)', 'Indirect Expense', formatINR(totalExpenses)],
          ],
        };
      case 'bs':
        return {
          summary: [
            { label: 'Inventory Asset', value: formatINR(invCostVal) },
            { label: 'Trade Receivables', value: formatINR(totalReceivables) },
            { label: 'Trade Payables', value: formatINR(totalPayables) },
            { label: 'Capital Account (Demo)', value: formatINR(3000000) },
          ],
          headers: ['Balance Sheet Head', 'Classification', 'Sample Balance (₹)'],
          rows: accounts
            .filter((a) => ['Asset', 'Liability', 'Equity'].includes(a.type))
            .map((a) => [a.name, a.type, formatINR(a.openingBalance + a.debitTotal - a.creditTotal)]),
        };
      case 'cf':
        return {
          summary: [
            { label: 'Customer Cash Inflows', value: formatINR(payments.filter((p) => p.type === 'Received').reduce((s, p) => s + p.amount, 0)) },
            { label: 'Supplier & Expense Outflows', value: formatINR(payments.filter((p) => p.type === 'Paid').reduce((s, p) => s + p.amount, 0) + totalExpenses) },
          ],
          headers: ['Date', 'Description', 'Type', 'Amount (₹)'],
          rows: bankTransactions.map((t) => [formatDateIN(t.date), t.description, t.type, formatINR(t.amount)]),
        };
      case 'tb':
        return {
          summary: [
            { label: 'Sample Debit Total', value: formatINR(accounts.reduce((s, a) => s + a.debitTotal, 0)) },
            { label: 'Sample Credit Total', value: formatINR(accounts.reduce((s, a) => s + a.creditTotal, 0)) },
          ],
          headers: ['Code', 'Account', 'Type', 'Debit (₹)', 'Credit (₹)'],
          rows: accounts.map((a) => [a.code, a.name, a.type, formatINR(a.debitTotal), formatINR(a.creditTotal)]),
        };
      case 'gl':
        return {
          summary: [{ label: 'Journal Vouchers', value: String(journals.length) }],
          headers: ['Date', 'Voucher #', 'Account', 'Debit (₹)', 'Credit (₹)'],
          rows: journals.flatMap((j) =>
            j.lines.map((l) => [formatDateIN(j.date), j.entryNumber, l.accountName, formatINR(l.debit), formatINR(l.credit)])
          ),
        };
      case 'cb':
        return {
          summary: [{ label: 'Cash Book Entries', value: String(bankTransactions.filter((t) => t.accountId === 'ba-3').length) }],
          headers: ['Date', 'Reference', 'Particulars', 'Type', 'Amount (₹)'],
          rows: bankTransactions
            .filter((t) => t.accountId === 'ba-3')
            .map((t) => [formatDateIN(t.date), t.reference, t.description, t.type, formatINR(t.amount)]),
        };
      case 'bb':
        return {
          summary: [{ label: 'Bank Book Entries', value: String(bankTransactions.filter((t) => t.accountId !== 'ba-3').length) }],
          headers: ['Date', 'Reference', 'Particulars', 'Type', 'Amount (₹)'],
          rows: bankTransactions
            .filter((t) => t.accountId !== 'ba-3')
            .map((t) => [formatDateIN(t.date), t.reference, t.description, t.type, formatINR(t.amount)]),
        };
      case 'sales':
        return {
          summary: [
            { label: 'Total Sales', value: formatINR(totalSales) },
            { label: 'Invoices Count', value: String(confirmedSales.length) },
          ],
          headers: ['Invoice #', 'Customer', 'Date', 'Total (₹)', 'Paid (₹)', 'Status'],
          rows: confirmedSales.map((i) => [
            i.invoiceNumber,
            customers.find((c) => c.id === i.customerId)?.name || '',
            formatDateIN(i.invoiceDate),
            formatINR(i.totalAmount),
            formatINR(i.paidAmount),
            i.status,
          ]),
        };
      case 'purchase':
        return {
          summary: [
            { label: 'Total Purchases', value: formatINR(totalPurchases) },
            { label: 'Bills Count', value: String(purchaseBills.length) },
          ],
          headers: ['Bill #', 'Supplier', 'Date', 'Total (₹)', 'Balance (₹)', 'Status'],
          rows: purchaseBills.map((b) => [
            b.billNumber,
            suppliers.find((s) => s.id === b.supplierId)?.name || '',
            formatDateIN(b.purchaseDate),
            formatINR(b.totalAmount),
            formatINR(b.totalAmount - b.paidAmount),
            b.status,
          ]),
        };
      case 'expense':
        return {
          summary: [{ label: 'Total Expenses', value: formatINR(totalExpenses) }],
          headers: ['Date', 'Title', 'Category', 'Vendor', 'Amount (₹)', 'Status'],
          rows: expenses.map((e) => [formatDateIN(e.date), e.title, e.category, e.vendor, formatINR(e.amount), e.status]),
        };
      case 'receivables':
        return {
          summary: [{ label: 'Total Receivables', value: formatINR(totalReceivables) }],
          headers: ['Invoice #', 'Customer', 'Due Date', 'Days Overdue', 'Outstanding (₹)'],
          rows: confirmedSales
            .filter((i) => i.totalAmount > i.paidAmount)
            .map((i) => [
              i.invoiceNumber,
              customers.find((c) => c.id === i.customerId)?.name || '',
              formatDateIN(i.dueDate),
              Math.max(0, getDaysOverdue(i.dueDate)),
              formatINR(i.totalAmount - i.paidAmount),
            ]),
        };
      case 'payables':
        return {
          summary: [{ label: 'Total Payables', value: formatINR(totalPayables) }],
          headers: ['Bill #', 'Supplier', 'Due Date', 'Outstanding (₹)', 'Status'],
          rows: purchaseBills
            .filter((b) => b.totalAmount > b.paidAmount)
            .map((b) => [
              b.billNumber,
              suppliers.find((s) => s.id === b.supplierId)?.name || '',
              formatDateIN(b.dueDate),
              formatINR(b.totalAmount - b.paidAmount),
              b.status,
            ]),
        };
      case 'inventory':
        return {
          summary: [{ label: 'Total SKUs', value: String(products.length) }],
          headers: ['SKU', 'Product', 'Category', 'Available', 'Reorder Level'],
          rows: products.map((p) => [p.sku, p.name, p.category, `${p.availableStock} ${p.unit}`, p.reorderLevel]),
        };
      case 'valuation':
        return {
          summary: [
            { label: 'Total Cost Valuation', value: formatINR(invCostVal) },
            {
              label: 'Potential Retail Value',
              value: formatINR(products.reduce((s, p) => s + p.availableStock * p.sellingPrice, 0)),
            },
          ],
          headers: ['SKU', 'Product', 'Stock', 'Unit Cost (₹)', 'Cost Valuation (₹)'],
          rows: products.map((p) => [
            p.sku,
            p.name,
            `${p.availableStock} ${p.unit}`,
            formatINR(p.purchasePrice),
            formatINR(p.availableStock * p.purchasePrice),
          ]),
        };
      case 'cust_pay':
        return {
          summary: [
            {
              label: 'Total Customer Receipts',
              value: formatINR(payments.filter((p) => p.type === 'Received').reduce((s, p) => s + p.amount, 0)),
            },
          ],
          headers: ['Receipt #', 'Customer', 'Date', 'Mode', 'Reference', 'Amount (₹)'],
          rows: payments
            .filter((p) => p.type === 'Received')
            .map((p) => [p.receiptNumber, p.partyName, formatDateIN(p.date), p.method, p.referenceNumber, formatINR(p.amount)]),
        };
      case 'commitments':
        return {
          summary: [
            { label: 'Total Commitments', value: String(commitments.length) },
            { label: 'Fulfilled Receipts', value: formatINR(commitments.reduce((s, c) => s + c.fulfilledAmount, 0)) },
          ],
          headers: ['Invoice #', 'Customer', 'Promised (₹)', 'Promised Date', 'Actual Fulfilled (₹)', 'Status'],
          rows: commitments.map((c) => [
            c.invoiceNumber,
            customers.find((cu) => cu.id === c.customerId)?.name || '',
            formatINR(c.promisedAmount),
            formatDateIN(c.promisedDate),
            formatINR(c.fulfilledAmount),
            c.status,
          ]),
        };
      case 'emp_coll':
        return {
          summary: [
            {
              label: 'Team Monthly Recovery',
              value: formatINR(employees.reduce((s, e) => s + e.collectedThisMonth, 0)),
            },
          ],
          headers: ['Employee', 'Role', 'Monthly Target (₹)', 'Collected This Month (₹)', 'Achievement'],
          rows: employees.map((e) => [
            e.name,
            e.role,
            formatINR(e.monthlyTarget),
            formatINR(e.collectedThisMonth),
            `${Math.round((e.collectedThisMonth / Math.max(1, e.monthlyTarget)) * 100)}%`,
          ]),
        };
      default:
        return { summary: [], headers: [], rows: [] };
    }
  }, [
    selectedReportId,
    salesInvoices,
    purchaseBills,
    expenses,
    incomes,
    accounts,
    journals,
    bankTransactions,
    products,
    payments,
    commitments,
    employees,
    customers,
    suppliers,
  ]);

  if (activeMeta) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedReportId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 mb-3 no-print"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports Library
        </button>

        <PageHeader
          title={activeMeta.title}
          subtitle={`${activeBusiness.name} · Period ${formatDateIN(fromDate)} to ${formatDateIN(toDate)} · Demo Report`}
          actions={
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  exportRowsToCSV(`${activeMeta.id}_report.csv`, reportData.headers, reportData.rows);
                  showToast({ type: 'success', title: 'CSV Exported', description: `${activeMeta.title}.csv` });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          {reportData.summary.map((s) => (
            <StatCard key={s.label} title={s.label} value={s.value} />
          ))}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                {reportData.headers.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-slate-800 tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Financial & Collection Reports"
        subtitle="Select any financial statement, ledger book, or CollectFlow recovery report to filter, export CSV, or print."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelectedReportId(card.id)}
            className="text-left bg-white border border-slate-200/80 rounded-xl p-5 hover:border-[#675BD3]/50 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-[#675BD3] uppercase tracking-wider">
                  {card.category}
                </span>
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">{card.title}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
            </div>
            <span className="mt-4 text-xs font-semibold text-[#675BD3]">Open Report →</span>
          </button>
        ))}
      </div>
    </div>
  );
};
