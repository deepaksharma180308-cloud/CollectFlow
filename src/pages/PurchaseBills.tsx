import React, { useMemo, useState } from 'react';
import { CreditCard, Plus, RotateCcw } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { PaymentMethod, PurchaseBill } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

export const PurchaseBills: React.FC = () => {
  const { purchaseBills, setPurchaseBills, suppliers, products, recordPayment, addStockMovement, showToast } =
    useApp();

  const [createOpen, setCreateOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(DEMO_TODAY);
  const [dueDate, setDueDate] = useState('2026-12-17');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(10);
  const [unitPrice, setUnitPrice] = useState(products[0]?.purchasePrice || 0);
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState('');

  const [payBill, setPayBill] = useState<PurchaseBill | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payRef, setPayRef] = useState('');

  const summary = useMemo(() => {
    const total = purchaseBills.reduce((s, b) => s + b.totalAmount, 0);
    const paid = purchaseBills.reduce((s, b) => s + b.paidAmount, 0);
    const outstanding = total - paid;
    return { total, paid, outstanding, count: purchaseBills.length };
  }, [purchaseBills]);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === productId);
    if (!supplierId || !prod || qty <= 0) return;
    const subtotal = qty * unitPrice;
    const taxAmount = Math.round(subtotal * (gstRate / 100));
    const totalAmount = subtotal + taxAmount;
    const billNumber = `BILL-26-${406 + purchaseBills.length}`;

    const newBill: PurchaseBill = {
      id: `bill-${Date.now()}`,
      billNumber,
      supplierInvoiceNumber: supplierInvoiceNumber || `SUP-${Date.now().toString().slice(-4)}`,
      supplierId,
      purchaseDate,
      dueDate,
      items: [
        {
          id: `pli-${Date.now()}`,
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice,
          discountPercent: 0,
          gstPercent: gstRate,
          lineTotal: totalAmount,
        },
      ],
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      status: 'Unpaid',
      notes,
    };
    setPurchaseBills((prev) => [newBill, ...prev]);
    addStockMovement({
      productId: prod.id,
      type: 'Stock Received',
      quantity: qty,
      date: purchaseDate,
      reference: billNumber,
      notes: 'Stock inward from purchase bill',
    });
    showToast({ type: 'success', title: `Purchase bill ${billNumber} saved`, description: formatINR(totalAmount) });
    setCreateOpen(false);
  };

  const handleDebitNote = (bill: PurchaseBill) => {
    const debitAmt = Math.round(bill.totalAmount * 0.08);
    setPurchaseBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? {
              ...b,
              hasDebitNote: true,
              debitNoteAmount: (b.debitNoteAmount || 0) + debitAmt,
              paidAmount: Math.min(b.totalAmount, b.paidAmount + debitAmt),
              status: b.paidAmount + debitAmt >= b.totalAmount ? 'Paid' : b.status,
            }
          : b
      )
    );
    showToast({
      type: 'info',
      title: `Purchase Return / Debit Note Issued`,
      description: `${bill.billNumber} adjusted by ${formatINR(debitAmt)}`,
    });
  };

  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBill || payAmount <= 0) return;
    const sup = suppliers.find((s) => s.id === payBill.supplierId);
    recordPayment({
      type: 'Paid',
      partyId: payBill.supplierId,
      partyName: sup?.name || 'Supplier',
      invoiceOrBillId: payBill.id,
      invoiceOrBillNumber: payBill.billNumber,
      date: DEMO_TODAY,
      amount: payAmount,
      allocatedAmount: payAmount,
      unallocatedAmount: 0,
      method: payMethod,
      referenceNumber: payRef || `NEFT-${Date.now().toString().slice(-6)}`,
      isAdvance: false,
      notes: `Settlement for ${payBill.billNumber}`,
    });
    setPayBill(null);
  };

  const columns: ColumnDef<PurchaseBill>[] = [
    {
      key: 'billNumber',
      header: 'Bill #',
      sortable: true,
      sortValue: (b) => b.billNumber,
      render: (b) => (
        <div>
          <p className="font-mono font-semibold text-slate-900">{b.billNumber}</p>
          <p className="text-[11px] font-mono text-slate-500">{b.supplierInvoiceNumber}</p>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (b) => {
        const sup = suppliers.find((s) => s.id === b.supplierId);
        return <span className="font-medium text-slate-800">{sup?.name || 'Supplier'}</span>;
      },
    },
    {
      key: 'date',
      header: 'Purchase Date',
      render: (b) => <span className="tabular-nums text-xs text-slate-600">{formatDateIN(b.purchaseDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (b) => <span className="tabular-nums text-xs text-slate-600">{formatDateIN(b.dueDate)}</span>,
    },
    {
      key: 'total',
      header: 'Total Bill',
      align: 'right',
      sortable: true,
      sortValue: (b) => b.totalAmount,
      render: (b) => <span className="tabular-nums font-medium">{formatINR(b.totalAmount)}</span>,
    },
    {
      key: 'payable',
      header: 'Outstanding Payable',
      align: 'right',
      sortable: true,
      sortValue: (b) => b.totalAmount - b.paidAmount,
      render: (b) => {
        const bal = Math.max(0, b.totalAmount - b.paidAmount);
        return (
          <span className={`tabular-nums font-semibold ${bal > 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {formatINR(bal)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <div className="inline-flex items-center gap-1">
          {b.totalAmount > b.paidAmount && (
            <button
              type="button"
              onClick={() => {
                setPayBill(b);
                setPayAmount(b.totalAmount - b.paidAmount);
                setPayRef('');
              }}
              className="p-1.5 rounded-md text-[#675BD3] hover:bg-[#675BD3]/10"
              title="Pay Supplier"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
          {!b.hasDebitNote && (
            <button
              type="button"
              onClick={() => handleDebitNote(b)}
              className="p-1.5 rounded-md text-slate-500 hover:text-amber-700 hover:bg-amber-50"
              title="Purchase Return / Debit Note"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Bills"
        subtitle="Record supplier purchase invoices, inward stock, vendor settlements, and debit notes."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Record Purchase Bill
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Total Bills" value={String(summary.count)} />
        <StatCard title="Total Purchases" value={formatINR(summary.total)} />
        <StatCard title="Amount Paid" value={formatINR(summary.paid)} tone="positive" />
        <StatCard title="Payable Balance" value={formatINR(summary.outstanding)} tone="danger" />
      </div>

      <DataTable
        data={purchaseBills}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search bill #, supplier invoice #, vendor..."
        searchFilter={(b, q) => {
          const sup = suppliers.find((s) => s.id === b.supplierId);
          return (
            b.billNumber.toLowerCase().includes(q) ||
            b.supplierInvoiceNumber.toLowerCase().includes(q) ||
            (sup?.name.toLowerCase().includes(q) ?? false)
          );
        }}
      />

      {/* Create Purchase Bill Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Record Supplier Purchase Bill"
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
              form="purchase-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Purchase Bill
            </button>
          </>
        }
      >
        <form id="purchase-form" onSubmit={handleCreateBill} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Invoice #</label>
            <input
              type="text"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              placeholder="e.g. JSW/MH/26-9910"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product</label>
            <select
              value={productId}
              onChange={(e) => {
                const p = products.find((item) => item.id === e.target.value);
                setProductId(e.target.value);
                if (p) {
                  setUnitPrice(p.purchasePrice);
                  setGstRate(p.gstRate);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Rate (₹)</label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GST %</label>
            <select
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg text-xs flex justify-between font-bold text-slate-900">
            <span>Calculated Bill Total (incl. {gstRate}% GST)</span>
            <span className="tabular-nums">{formatINR(Math.round(qty * unitPrice * (1 + gstRate / 100)))}</span>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Supplier Payment Modal */}
      <Modal
        open={!!payBill}
        onClose={() => setPayBill(null)}
        title={`Pay Supplier · ${payBill?.billNumber || ''}`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPayBill(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="bill-pay-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Record Payment
            </button>
          </>
        }
      >
        {payBill && (
          <form id="bill-pay-form" onSubmit={handlePaySupplier} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-xs flex justify-between">
              <span className="text-slate-500">Outstanding Payable</span>
              <span className="font-bold text-red-600 tabular-nums">
                {formatINR(payBill.totalAmount - payBill.paidAmount)}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (₹)</label>
              <input
                type="number"
                min={1}
                max={payBill.totalAmount - payBill.paidAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Reference #</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
