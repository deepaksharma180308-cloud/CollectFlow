import React, { useMemo, useState } from 'react';
import { ArrowDownUp, Edit2, PackagePlus, Plus } from 'lucide-react';
import { ColumnDef, DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { Product, StockMovement, StockMovementType } from '../types';
import { DEMO_TODAY, formatDateIN, formatINR } from '../utils/format';

const EMPTY_PRODUCT = {
  sku: '',
  name: '',
  category: 'Steel & Structural',
  description: '',
  unit: 'Pcs',
  hsnCode: '',
  purchasePrice: 0,
  sellingPrice: 0,
  gstRate: 18,
  openingStock: 0,
  availableStock: 0,
  reorderLevel: 20,
};

export const Products: React.FC = () => {
  const { products, setProducts, stockMovements, addStockMovement, showToast } = useApp();

  const [tab, setTab] = useState<'inventory' | 'low_stock' | 'movements'>('inventory');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState<{
    productId: string;
    type: StockMovementType;
    quantity: number;
    reference: string;
    notes: string;
  }>({
    productId: products[0]?.id || '',
    type: 'Stock Received',
    quantity: 10,
    reference: '',
    notes: '',
  });

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + p.availableStock * p.purchasePrice, 0);
    const retailValue = products.reduce((sum, p) => sum + p.availableStock * p.sellingPrice, 0);
    const lowStockCount = products.filter((p) => p.availableStock <= p.reorderLevel).length;
    return { totalSkus: products.length, totalValue, retailValue, lowStockCount };
  }, [products]);

  const displayedProducts = useMemo(() => {
    if (tab === 'low_stock') return products.filter((p) => p.availableStock <= p.reorderLevel);
    return products;
  }, [products, tab]);

  const openNewProduct = () => {
    setEditingProduct(null);
    setForm(EMPTY_PRODUCT);
    setProductModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      description: p.description,
      unit: p.unit,
      hsnCode: p.hsnCode,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      gstRate: p.gstRate,
      openingStock: p.openingStock,
      availableStock: p.availableStock,
      reorderLevel: p.reorderLevel,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) {
      showToast({ type: 'error', title: 'Validation error', description: 'Product Name and SKU are required.' });
      return;
    }
    if (editingProduct) {
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...form } : p)));
      showToast({ type: 'success', title: 'Product updated', description: form.name });
    } else {
      const newProd: Product = { id: `prod-${Date.now()}`, ...form };
      setProducts((prev) => [newProd, ...prev]);
      showToast({ type: 'success', title: 'Product added', description: `${form.sku} · ${form.name}` });
    }
    setProductModalOpen(false);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.productId || adjustForm.quantity <= 0) {
      showToast({ type: 'error', title: 'Invalid quantity', description: 'Enter a quantity greater than 0.' });
      return;
    }
    const isOutbound =
      adjustForm.type === 'Stock Sold' ||
      adjustForm.type === 'Purchase Return' ||
      adjustForm.type === 'Damaged Stock';
    const signedQty = isOutbound ? -Math.abs(adjustForm.quantity) : Math.abs(adjustForm.quantity);
    addStockMovement({
      productId: adjustForm.productId,
      type: adjustForm.type,
      quantity: signedQty,
      date: DEMO_TODAY,
      reference: adjustForm.reference || `ADJ-${Date.now().toString().slice(-4)}`,
      notes: adjustForm.notes || adjustForm.type,
    });
    const prod = products.find((p) => p.id === adjustForm.productId);
    showToast({
      type: 'success',
      title: 'Stock movement logged',
      description: `${prod?.name || 'SKU'}: ${signedQty > 0 ? '+' : ''}${signedQty} ${prod?.unit || ''}`,
    });
    setAdjustOpen(false);
  };

  const productColumns: ColumnDef<Product>[] = [
    {
      key: 'name',
      header: 'Product / SKU',
      sortable: true,
      sortValue: (p) => p.name,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-500">
            <span className="font-mono">{p.sku}</span> · {p.category} · HSN {p.hsnCode || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'purchase',
      header: 'Purchase Price',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.purchasePrice,
      render: (p) => <span className="tabular-nums text-slate-700">{formatINR(p.purchasePrice)}</span>,
    },
    {
      key: 'selling',
      header: 'Selling Price',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.sellingPrice,
      render: (p) => <span className="tabular-nums font-medium text-slate-900">{formatINR(p.sellingPrice)}</span>,
    },
    {
      key: 'stock',
      header: 'Available Stock',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.availableStock,
      render: (p) => (
        <span className="tabular-nums font-semibold text-slate-900">
          {p.availableStock} {p.unit}
        </span>
      ),
    },
    {
      key: 'valuation',
      header: 'Stock Value (Cost)',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.availableStock * p.purchasePrice,
      render: (p) => (
        <span className="tabular-nums text-slate-700">
          {formatINR(p.availableStock * p.purchasePrice)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (p) => {
        const status =
          p.availableStock === 0
            ? 'Out of Stock'
            : p.availableStock <= p.reorderLevel
            ? 'Low Stock'
            : 'Active';
        return <StatusBadge status={status === 'Active' ? 'In Stock' : status} tone={status === 'Active' ? 'success' : status === 'Low Stock' ? 'warning' : 'danger'} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setAdjustForm({
                productId: p.id,
                type: 'Stock Received',
                quantity: 10,
                reference: '',
                notes: '',
              });
              setAdjustOpen(true);
            }}
            className="p-1.5 rounded-md text-slate-500 hover:text-[#675BD3] hover:bg-slate-100"
            title="Adjust Stock"
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditProduct(p)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const movementColumns: ColumnDef<StockMovement>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (m) => m.date,
      render: (m) => <span className="tabular-nums text-xs">{formatDateIN(m.date)}</span>,
    },
    {
      key: 'product',
      header: 'Product',
      render: (m) => {
        const p = products.find((item) => item.id === m.productId);
        return (
          <div>
            <p className="text-xs font-semibold text-slate-900">{p?.name || m.productId}</p>
            <p className="text-[11px] font-mono text-slate-500">{p?.sku}</p>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Movement Type',
      render: (m) => (
        <StatusBadge
          status={m.type}
          tone={m.quantity > 0 ? 'success' : m.type === 'Damaged Stock' ? 'danger' : 'warning'}
          showIcon={false}
        />
      ),
    },
    {
      key: 'qty',
      header: 'Quantity',
      align: 'right',
      render: (m) => {
        const p = products.find((item) => item.id === m.productId);
        return (
          <span className={`font-semibold tabular-nums text-xs ${m.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {m.quantity > 0 ? '+' : ''}
            {m.quantity} {p?.unit || ''}
          </span>
        );
      },
    },
    {
      key: 'ref',
      header: 'Reference & Notes',
      render: (m) => (
        <div className="text-xs">
          <span className="font-mono font-medium text-slate-800">{m.reference}</span>
          <p className="text-slate-500">{m.notes}</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products & Inventory"
        subtitle="Track wholesale SKUs, purchase & selling rates, stock movements, returns, damage, and valuation."
        actions={
          <>
            <button
              type="button"
              onClick={() => setAdjustOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              <PackagePlus className="w-4 h-4" /> Stock Adjustment
            </button>
            <button
              type="button"
              onClick={openNewProduct}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] hover:bg-[#574BC2] rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard title="Active SKUs" value={String(stats.totalSkus)} subtitle="Catalog items" />
        <StatCard title="Inventory Cost Value" value={formatINR(stats.totalValue)} tone="accent" />
        <StatCard title="Potential Sale Value" value={formatINR(stats.retailValue)} tone="positive" />
        <StatCard
          title="Low-Stock Alerts"
          value={String(stats.lowStockCount)}
          tone={stats.lowStockCount > 0 ? 'warning' : 'positive'}
          subtitle="At or below reorder level"
        />
      </div>

      <div className="mb-4 flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg w-fit">
        {(
          [
            { key: 'inventory', label: `All Products (${products.length})` },
            { key: 'low_stock', label: `Low-Stock Alerts (${stats.lowStockCount})` },
            { key: 'movements', label: `Stock Movement History (${stockMovements.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === t.key ? 'bg-[#675BD3] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'movements' ? (
        <DataTable
          data={stockMovements}
          columns={movementColumns}
          keyExtractor={(m) => m.id}
          searchPlaceholder="Search reference or notes..."
          searchFilter={(m, q) =>
            m.reference.toLowerCase().includes(q) || m.notes.toLowerCase().includes(q)
          }
        />
      ) : (
        <DataTable
          data={displayedProducts}
          columns={productColumns}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Search product name, SKU, category..."
          searchFilter={(p, q) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          }
        />
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? `Edit Product · ${editingProduct.sku}` : 'Add New Product'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Save Product
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Product ID *</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (e.g. MT, Bags, Pcs)</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
            <input
              type="text"
              value={form.hsnCode}
              onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price (₹)</label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
            <input
              type="number"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Available Stock</label>
            <input
              type="number"
              value={form.availableStock}
              onChange={(e) => setForm({ ...form, availableStock: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level</label>
            <input
              type="number"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Stock Movement / Adjustment Modal */}
      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Log Stock Movement"
        subtitle="Record stock received, sold, sales return, purchase return, damaged stock, or manual adjustment."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAdjustOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="adjust-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#675BD3] rounded-lg"
            >
              Update Stock
            </button>
          </>
        }
      >
        <form id="adjust-form" onSubmit={handleSaveAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product</label>
            <select
              value={adjustForm.productId}
              onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Avail: {p.availableStock} {p.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
              <select
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as StockMovementType })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="Stock Received">Stock Received (+)</option>
                <option value="Stock Sold">Stock Sold (-)</option>
                <option value="Sales Return">Sales Return (+)</option>
                <option value="Purchase Return">Purchase Return (-)</option>
                <option value="Damaged Stock">Damaged Stock (-)</option>
                <option value="Stock Adjustment">Stock Adjustment (+)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference #</label>
            <input
              type="text"
              value={adjustForm.reference}
              onChange={(e) => setAdjustForm({ ...adjustForm, reference: e.target.value })}
              placeholder="e.g. CHALLAN-112, CN-26-010"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
