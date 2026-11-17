import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, CreditCard, Edit2, Eye, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { InvoiceLineItem, InvoiceStatus, PaymentMethod, SalesInvoice } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

export const SalesInvoices: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    activeBusiness,
    salesInvoices,
    setSalesInvoices,
    customers,
    products,
    recordPayment,
    addStockMovement,
    showToast,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<SalesInvoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<SalesInvoice | null>(null);

  // Payment modal state
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payRef, setPayRef] = useState('');

  // Invoice form state
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(DEMO_TODAY);
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);
  const [dueDate, setDueDate] = useState('2026-12-17');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: 'item-1',
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 2,
      unitPrice: products[0]?.sellingPrice || 0,
      discountPercent: 0,
      gstPercent: products[0]?.gstRate || 18,
      lineTotal: (products[0]?.sellingPrice || 0) * 2 * 1.18,
    },
  ]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreateModal();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const computeDueDate = (startIso: string, days: number) => {
    const d = new Date(`${startIso}T00:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const recalcLine = (li: InvoiceLineItem): InvoiceLineItem => {
    const base = li.quantity * li.unitPrice;
    const afterDisc = base * (1 - li.discountPercent / 100);
    const total = Math.round(afterDisc * (1 + li.gstPercent / 100));
    return { ...li, lineTotal: total };
  };

  const formTotals = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    items.forEach((li) => {
      const gross = li.quantity * li.unitPrice;
      const disc = gross * (li.discountPercent / 100);
      const taxable = gross - disc;
      const tax = taxable * (li.gstPercent / 100);
      subtotal += gross;
      discountAmount += disc;
      taxAmount += tax;
    });
    const grandTotal = Math.round(subtotal - discountAmount + taxAmount);
    return {
      subtotal: Math.round(subtotal),
      discountAmount: Math.round(discountAmount),
      taxAmount: Math.round(taxAmount),
      grandTotal,
    };
  }, [items]);

  const openCreateModal = () => {
    const firstProd = products[0];
    setEditingId(null);
    setCustomerId(customers[0]?.id || '');
    setInvoiceDate(DEMO_TODAY);
    setPaymentTermsDays(30);
    setDueDate(computeDueDate(DEMO_TODAY, 30));
    setNotes('');
    setItems(
      firstProd
        ? [
            recalcLine({
              id: `li-${Date.now()}`,
              productId: firstProd.id,
              productName: firstProd.name,
              quantity: 1,
              unitPrice: firstProd.sellingPrice,
              discountPercent: 0,
              gstPercent: firstProd.gstRate,
              lineTotal: 0,
            }),
          ]
        : []
    );
    setEditorOpen(true);
  };

  const openEditDraft = (inv: SalesInvoice) => {
    setEditingId(inv.id);
    setCustomerId(inv.customerId);
    setInvoiceDate(inv.invoiceDate);
    setPaymentTermsDays(inv.paymentTermsDays);
    setDueDate(inv.dueDate);
    setNotes(inv.notes);
    setItems(inv.items);
    setEditorOpen(true);
  };

  const handleSaveInvoice = (saveAs: 'Draft' | 'Unpaid') => {
    if (!customerId || items.length === 0) {
      showToast({ type: 'error', title: 'Incomplete invoice', description: 'Select a customer and add at least one product.' });
      return;
    }

    if (editingId) {
      setSalesInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editingId
            ? {
                ...inv,
                customerId,
                invoiceDate,
                dueDate,
                paymentTermsDays,
                items,
                subtotal: formTotals.subtotal,
                discountAmount: formTotals.discountAmount,
                taxAmount: formTotals.taxAmount,
                totalAmount: formTotals.grandTotal,
                status: saveAs,
                notes,
              }
            : inv
        )
      );
      showToast({
        type: 'success',
        title: saveAs === 'Draft' ? 'Draft invoice updated' : 'Invoice confirmed',
      });
    } else {
      const nextNum = `${activeBusiness.invoicePrefix}${activeBusiness.nextInvoiceNumber + salesInvoices.length}`;
      const newInv: SalesInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: nextNum,
        customerId,
        invoiceDate,
        dueDate,
        paymentTermsDays,
        items,
        subtotal: formTotals.subtotal,
        discountAmount: formTotals.discountAmount,
        taxAmount: formTotals.taxAmount,
        totalAmount: formTotals.grandTotal,
        paidAmount: 0,
        status: saveAs,
        notes,
      };
      setSalesInvoices((prev) => [newInv, ...prev]);
      if (saveAs === 'Unpaid') {
        items.forEach((li) => {
          addStockMovement({
            productId: li.productId,
            type: 'Stock Sold',
            quantity: -li.quantity,
            date: invoiceDate,
            reference: nextNum,
            notes: 'Sold via Sales Invoice',
          });
        });
      }
      showToast({
        type: 'success',
        title: `${saveAs === 'Draft' ? 'Draft' : 'Invoice'} ${nextNum} created`,
        description: `Total ${formatINR(formTotals.grandTotal)}`,
      });
    }
    setEditorOpen(false);
  };

  const handleConfirmDraft = (inv: SalesInvoice) => {
    setSalesInvoices((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: 'Unpaid' } : i))
    );
    showToast({ type: 'success', title: `Confirmed ${inv.invoiceNumber}`, description: 'Moved from Draft to Unpaid.' });
  };

  const handleIssueCreditNote = (inv: SalesInvoice) => {
    const balance = Math.max(0, inv.totalAmount - inv.paidAmount);
    const creditAmt = Math.min(balance || inv.totalAmount, Math.round(inv.totalAmount * 0.1));
    setSalesInvoices((prev) =>
      prev.map((i) =>
        i.id === inv.id
          ? {
              ...i,
              hasCreditNote: true,
              creditNoteAmount: (i.creditNoteAmount || 0) + creditAmt,
              paidAmount: Math.min(i.totalAmount, i.paidAmount + creditAmt),
              status: i.paidAmount + creditAmt >= i.totalAmount ? 'Paid' : i.status,
            }
          : i
      )
    );
    showToast({
      type: 'info',
      title: `Sales Return / Credit Note Issued`,
      description: `${inv.invoiceNumber} credited by ${formatINR(creditAmt)}`,
    });
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoice || payAmount <= 0) return;
    const cust = customers.find((c) => c.id === payInvoice.customerId);
    recordPayment({
      type: 'Received',
      partyId: payInvoice.customerId,
      partyName: cust?.name || 'Customer',
      invoiceOrBillId: payInvoice.id,
      invoiceOrBillNumber: payInvoice.invoiceNumber,
      date: DEMO_TODAY,
      amount: payAmount,
      allocatedAmount: payAmount,
      unallocatedAmount: 0,
      method: payMethod,
      referenceNumber: payRef || `REF-${Date.now().toString().slice(-6)}`,
      isAdvance: false,
      notes: `Payment against ${payInvoice.invoiceNumber}`,
    });
    setPayInvoice(null);
  };

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'ALL') return salesInvoices;
    return salesInvoices.filter((i) => i.status === statusFilter);
  }, [salesInvoices, statusFilter]);

  const summary = useMemo(() => {
    const active = salesInvoices.filter((i) => i.status !== 'Draft');
    const totalBilled = active.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = active.reduce((s, i) => s + i.paidAmount, 0);
    const totalOutstanding = totalBilled - totalPaid;
    const overdueCount = active.filter((i) => i.status === 'Overdue').length;
    return { totalBilled, totalPaid, totalOutstanding, overdueCount };
  }, [salesInvoices]);

  const columns: ColumnDef<SalesInvoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      sortValue: (i) => i.invoiceNumber,
      render: (i) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{i.invoiceNumber}</span>
          {i.hasCreditNote && (
            <p className="text-[11px] text-[#675BD3]">Credit Note: {formatINR(i.creditNoteAmount || 0)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (i) => {
        const cust = customers.find((c) => c.id === i.customerId);
        return <span className="font-medium text-slate-800">{cust?.name || 'Customer'}</span>;
      },
    },
    {
      key: 'date',
      header: 'Invoice Date',
      sortable: true,
      sortValue: (i) => i.invoiceDate,
      render: (i) => <span className="tabular-nums text-xs text-slate-600">{formatDateIN(i.invoiceDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      sortValue: (i) => i.dueDate,
      render: (i) => <span className="tabular-nums text-xs text-slate-600">{formatDateIN(i.dueDate)}</span>,
    },
    {
      key: 'total',
      header: 'Total Amount',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.totalAmount,
      render: (i) => <span className="tabular-nums font-medium text-slate-900">{formatINR(i.totalAmount)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      render: (i) => <span className="tabular-nums text-emerald-700">{formatINR(i.paidAmount)}</span>,
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.totalAmount - i.paidAmount,
      render: (i) => {
        const bal = Math.max(0, i.totalAmount - i.paidAmount);
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
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (i) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewInvoice(i)}
            className="p-1.5 rounded-md text-slate-500 hover:text-[#675BD3] hover:bg-slate-100"
            title="View & Print Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
          {i.status === 'Draft' && (
            <>
              <button
                type="button"
                onClick={() => openEditDraft(i)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                title="Edit Draft"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDraft(i)}
                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50"
                title="Confirm Invoice"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {i.status !== 'Draft' && i.totalAmount > i.paidAmount && (
            <button
              type="button"
              onClick={() => {
                setPayInvoice(i);
                setPayAmount(i.totalAmount - i.paidAmount);
                setPayMethod('Bank Transfer');
                setPayRef('');
              }}
              className="p-1.5 rounded-md text-[#675BD3] hover:bg-[#675BD3]/10"
              title="Record Payment"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
          {i.status !== 'Draft' && !i.hasCreditNote && (
            <button
              type="button"
              onClick={() => handleIssueCreditNote(i)}
              className="p-1.5 rounded-md text-slate-500 hover:text-amber-700 hover:bg-amber-50"
              title="Sales Return / Credit Note"
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
        title="Sales Invoices"
        subtitle="Create GST tax invoices, confirm drafts, record partial or full payments, and issue credit notes."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
          >
            <Plus className="w-4 h-4" /> Create Sales Invoice
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Confirmed Sales" value={formatINR(summary.totalBilled)} />
        <StatCard title="Collected" value={formatINR(summary.totalPaid)} tone="positive" />
        <StatCard title="Outstanding" value={formatINR(summary.totalOutstanding)} tone="warning" />
        <StatCard title="Overdue Invoices" value={String(summary.overdueCount)} tone="danger" />
      </div>

      <DataTable
        data={filteredInvoices}
        columns={columns}
        keyExtractor={(i) => i.id}
        searchPlaceholder="Search invoice # or customer..."
        searchFilter={(i, q) => {
          const cust = customers.find((c) => c.id === i.customerId);
          return (
            i.invoiceNumber.toLowerCase().includes(q) ||
            (cust?.name.toLowerCase().includes(q) ?? false)
          );
        }}
        toolbarExtra={
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(['ALL', 'Draft', 'Unpaid', 'Partial', 'Overdue', 'Paid'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        }
      />

      {/* Create / Edit Sales Invoice Modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit Draft Sales Invoice' : 'Create Sales Invoice'}
        subtitle="GST calculations are for frontend prototype demonstration."
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveInvoice('Draft')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveInvoice('Unpaid')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
            >
              Confirm & Issue Invoice
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
              <select
                value={customerId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setCustomerId(cid);
                  const cust = customers.find((c) => c.id === cid);
                  if (cust) {
                    setPaymentTermsDays(cust.paymentTermsDays);
                    setDueDate(computeDueDate(invoiceDate, cust.paymentTermsDays));
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {customers
                  .filter((c) => c.status !== 'Archived')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => {
                  setInvoiceDate(e.target.value);
                  setDueDate(computeDueDate(e.target.value, paymentTermsDays));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTermsDays}
                onChange={(e) => {
                  const days = Number(e.target.value);
                  setPaymentTermsDays(days);
                  setDueDate(computeDueDate(invoiceDate, days));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value={0}>Due on Receipt</option>
                <option value={15}>Net 15 Days</option>
                <option value={30}>Net 30 Days</option>
                <option value={45}>Net 45 Days</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800">Line Items</h3>
              <button
                type="button"
                onClick={() => {
                  const p = products[0];
                  if (!p) return;
                  setItems((prev) => [
                    ...prev,
                    recalcLine({
                      id: `li-${Date.now()}`,
                      productId: p.id,
                      productName: p.name,
                      quantity: 1,
                      unitPrice: p.sellingPrice,
                      discountPercent: 0,
                      gstPercent: p.gstRate,
                      lineTotal: 0,
                    }),
                  ]);
                }}
                className="text-xs font-semibold text-[#675BD3] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Row
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 w-20">Qty</th>
                    <th className="px-3 py-2 w-28">Rate (₹)</th>
                    <th className="px-3 py-2 w-20">Disc %</th>
                    <th className="px-3 py-2 w-20">GST %</th>
                    <th className="px-3 py-2 text-right w-28">Line Total</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((li, idx) => (
                    <tr key={li.id}>
                      <td className="px-3 py-2">
                        <select
                          value={li.productId}
                          onChange={(e) => {
                            const prod = products.find((p) => p.id === e.target.value);
                            if (!prod) return;
                            setItems((prev) =>
                              prev.map((row, rIdx) =>
                                rIdx === idx
                                  ? recalcLine({
                                      ...row,
                                      productId: prod.id,
                                      productName: prod.name,
                                      unitPrice: prod.sellingPrice,
                                      gstPercent: prod.gstRate,
                                    })
                                  : row
                              )
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={li.quantity}
                          onChange={(e) => {
                            const q = Math.max(1, Number(e.target.value));
                            setItems((prev) =>
                              prev.map((row, rIdx) => (rIdx === idx ? recalcLine({ ...row, quantity: q }) : row))
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={li.unitPrice}
                          onChange={(e) => {
                            const price = Math.max(0, Number(e.target.value));
                            setItems((prev) =>
                              prev.map((row, rIdx) => (rIdx === idx ? recalcLine({ ...row, unitPrice: price }) : row))
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={li.discountPercent}
                          onChange={(e) => {
                            const d = Math.max(0, Number(e.target.value));
                            setItems((prev) =>
                              prev.map((row, rIdx) => (rIdx === idx ? recalcLine({ ...row, discountPercent: d }) : row))
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={li.gstPercent}
                          onChange={(e) => {
                            const gst = Number(e.target.value);
                            setItems((prev) =>
                              prev.map((row, rIdx) => (rIdx === idx ? recalcLine({ ...row, gstPercent: gst }) : row))
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {formatINR(li.lineTotal)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => setItems((prev) => prev.filter((_, rIdx) => rIdx !== idx))}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date & Notes</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg mb-2"
              />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="PO reference, lorry receipt, delivery instructions..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium tabular-nums">{formatINR(formTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-medium tabular-nums text-emerald-700">
                  -{formatINR(formTotals.discountAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Applicable GST</span>
                <span className="font-medium tabular-nums">{formatINR(formTotals.taxAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="tabular-nums">{formatINR(formTotals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Printable Invoice View Modal */}
      <Modal
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={`Tax Invoice · ${viewInvoice?.invoiceNumber || ''}`}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print Invoice
            </button>
            <button
              type="button"
              onClick={() => setViewInvoice(null)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Close
            </button>
          </>
        }
      >
        {viewInvoice && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeBusiness.name}</h3>
                <p className="text-slate-600">{activeBusiness.address}, {activeBusiness.city}</p>
                <p className="font-mono text-slate-600 mt-0.5">GSTIN: {activeBusiness.gstin}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm font-bold font-mono text-[#675BD3]">{viewInvoice.invoiceNumber}</p>
                <p className="text-slate-600">Date: {formatDateIN(viewInvoice.invoiceDate)}</p>
                <p className="text-slate-600">Due Date: {formatDateIN(viewInvoice.dueDate)}</p>
                <div className="mt-1">
                  <StatusBadge status={viewInvoice.status} />
                </div>
              </div>
            </div>

            {(() => {
              const cust = customers.find((c) => c.id === viewInvoice.customerId);
              return (
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Billed To</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{cust?.name}</p>
                  <p className="text-slate-600">{cust?.address}, {cust?.city}, {cust?.state}</p>
                  <p className="font-mono text-slate-600 mt-0.5">GSTIN: {cust?.gstin || 'Unregistered'}</p>
                </div>
              );
            })()}

            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">GST</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewInvoice.items.map((li) => (
                  <tr key={li.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{li.productName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{li.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatINR(li.unitPrice)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{li.gstPercent}%</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatINR(li.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal</span>
                  <span className="tabular-nums">{formatINR(viewInvoice.subtotal - viewInvoice.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total GST</span>
                  <span className="tabular-nums">{formatINR(viewInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="tabular-nums">{formatINR(viewInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Paid Amount</span>
                  <span className="tabular-nums">{formatINR(viewInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600">
                  <span>Balance Due</span>
                  <span className="tabular-nums">{formatINR(Math.max(0, viewInvoice.totalAmount - viewInvoice.paidAmount))}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        open={!!payInvoice}
        onClose={() => setPayInvoice(null)}
        title={`Record Payment · ${payInvoice?.invoiceNumber || ''}`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPayInvoice(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="inv-pay-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Receipt
            </button>
          </>
        }
      >
        {payInvoice && (
          <form id="inv-pay-form" onSubmit={handleRecordPaymentSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding Balance</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatINR(payInvoice.totalAmount - payInvoice.paidAmount)}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Received (₹)</label>
              <input
                type="number"
                min={1}
                max={payInvoice.totalAmount - payInvoice.paidAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
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
                placeholder="e.g. HDFCR520261117..."
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
