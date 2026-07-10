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
  product: '',
  warehouse: '',
  quantity_received: '',
  unit_cost: '',
  manufacture_date: '',
  expiry_date: '',
  receipt_reference: '',
};

export default function StockBatches({ inventory }: Props) {
  const { data, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const batches = useMemo(() => {
    if (!data) return [];
    return data.stock_batches;
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const product = data!.products.find(
        (p) =>
          p.product_name.toLowerCase() === form.product.toLowerCase() ||
          p.product_code.toLowerCase() === form.product.toLowerCase()
      );
      const warehouse = data!.warehouses.find(
        (w) =>
          w.warehouse_name.toLowerCase() === form.warehouse.toLowerCase() ||
          w.warehouse_code.toLowerCase() === form.warehouse.toLowerCase()
      );
      await inventoryAPI.createBatch({
        batch_number: form.batch_number,
        product_id: product?.product_id || form.product,
        warehouse_id: warehouse?.warehouse_id || form.warehouse,
        quantity_received: Number(form.quantity_received),
        unit_cost: Number(form.unit_cost),
        manufacture_date: form.manufacture_date || null,
        expiry_date: form.expiry_date || null,
        receipt_reference: form.receipt_reference || null,
      });
      setShowForm(false);
      setForm(initialForm);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || (err instanceof Error ? err.message : 'Failed to add stock');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="batches">
      <div className="content-section-header">
        <h2>Stock Ledger Update</h2>
      </div>

      <div className="inv-toolbar">
        <button className="inv-btn inv-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Stock
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Received</th>
              <th>Available</th>
              <th>Unit Cost</th>
              <th>Status</th>
              <th>Mfg Date</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.batch_id}>
                <td className="inv-table-name">{batch.batch_number}</td>
                <td>{Number(batch.quantity_received).toLocaleString()}</td>
                <td>{Number(batch.available_quantity).toLocaleString()}</td>
                <td>${Number(batch.unit_cost).toFixed(2)}</td>
                <td>
                  <span className="inv-badge inv-badge-blue">{batch.batch_status}</span>
                </td>
                <td>{batch.manufacture_date || '—'}</td>
                <td>{batch.expiry_date || '—'}</td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr><td colSpan={7} className="inv-empty">No batches found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Add Stock</h3>
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
                    placeholder="Enter product name or code"
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Warehouse</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter warehouse name or code"
                    value={form.warehouse}
                    onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Quantity Received</label>
                  <input
                    type="text"
                    required
                    value={form.quantity_received}
                    onChange={(e) => setForm({ ...form, quantity_received: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Unit Cost</label>
                  <input
                    type="text"
                    required
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    required
                    value={form.batch_number}
                    onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Receipt Reference</label>
                  <input
                    type="text"
                    placeholder="GRN reference"
                    value={form.receipt_reference}
                    onChange={(e) => setForm({ ...form, receipt_reference: e.target.value })}
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
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
