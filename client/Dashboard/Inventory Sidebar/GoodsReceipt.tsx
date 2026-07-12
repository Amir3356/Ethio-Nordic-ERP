import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

const initialForm = {
  batch_number: '',
  product_id: '',
  warehouse_id: '',
  quantity_received: '',
  unit_cost: '',
  manufacture_date: '',
  expiry_date: '',
  supplier_id: '',
  receipt_reference: '',
};

export default function GoodsReceipt({ inventory }: Props) {
  const { data, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await inventoryAPI.createBatch({
        batch_number: form.batch_number,
        product_id: form.product_id,
        warehouse_id: form.warehouse_id,
        quantity_received: form.quantity_received,
        unit_cost: form.unit_cost,
        manufacture_date: form.manufacture_date || null,
        expiry_date: form.expiry_date || null,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        receipt_reference: form.receipt_reference || null,
      });
      setShowForm(false);
      setForm(initialForm);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to receive stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="goods-receipt">
      <div className="content-section-header">
        <h2>Step 1-2: Goods Receipt &amp; Stock Ledger Update</h2>
      </div>

      <p className="content-description">
        When goods arrive from a supplier and customs clearance is finalized, the Warehouse Management System
        records a Goods Receipt Note. This creates a new batch record (or increments an existing batch)
        with quantity, unit cost, manufacture date, and expiry date. The real-time stock ledger is updated atomically.
      </p>

      <div className="inv-toolbar">
        <button className="inv-btn inv-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Record Goods Receipt
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Batch Number</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Qty Received</th>
              <th>Available Qty</th>
              <th>Unit Cost</th>
              <th>Mfg Date</th>
              <th>Expiry Date</th>
              <th>Supplier ID</th>
              <th>Receipt Ref</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...data.stock_batches]
              .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
              .map((batch) => {
                const product = data.products.find((p) => String(p.product_id) === String(batch.product_id));
                const warehouse = data.warehouses.find((w) => String(w.warehouse_id) === String(batch.warehouse_id));
                return (
                  <tr key={batch.batch_id}>
                    <td className="inv-table-name">{batch.batch_number}</td>
                    <td>{product?.product_name || batch.product_id}</td>
                    <td>{warehouse?.warehouse_name || batch.warehouse_id}</td>
                    <td>{Number(batch.quantity_received).toLocaleString()}</td>
                    <td>{Number(batch.available_quantity).toLocaleString()}</td>
                    <td>${Number(batch.unit_cost).toFixed(2)}</td>
                    <td>{batch.manufacture_date || '—'}</td>
                    <td>{batch.expiry_date || '—'}</td>
                    <td>{batch.supplier_id ?? '—'}</td>
                    <td>{batch.receipt_reference || '—'}</td>
                    <td>
                      <span className={`inv-badge ${batch.batch_status === 'available' ? 'inv-badge-green' : 'inv-badge-gray'}`}>
                        {batch.batch_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            {data.stock_batches.length === 0 && (
              <tr><td colSpan={11} className="inv-empty">No goods receipts recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Record Goods Receipt</h3>
              <button className="inv-modal-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="inv-form">
              {error && <div className="inv-form-error">{error}</div>}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Product</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product name or ID"
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Warehouse</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter warehouse name or ID"
                    value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BN-2026-001"
                    value={form.batch_number}
                    onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Receipt Reference (GRN)</label>
                  <input
                    type="text"
                    placeholder="e.g. GRN-001"
                    value={form.receipt_reference}
                    onChange={(e) => setForm({ ...form, receipt_reference: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Quantity Received</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter quantity"
                    value={form.quantity_received}
                    onChange={(e) => setForm({ ...form, quantity_received: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Unit Cost</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter cost per unit"
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Manufacture Date</label>
                  <input
                    type="date"
                    value={form.manufacture_date}
                    onChange={(e) => setForm({ ...form, manufacture_date: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Supplier ID</label>
                <input
                  type="number"
                  placeholder="Optional supplier ID"
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                />
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Record Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
