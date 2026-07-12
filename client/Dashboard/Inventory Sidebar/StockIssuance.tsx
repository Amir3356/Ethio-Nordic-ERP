import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

const initialForm = {
  product_id: '',
  warehouse_id: '',
  batch_id: '',
  quantity: '',
  reference_type: 'sales_order',
  reference_id: '',
  override_justification: '',
};

export default function StockIssuance({ inventory }: Props) {
  const { data, getProduct, getWarehouse, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const stockOutMovements = useMemo(() => {
    if (!data) return [];
    return [...data.stock_ledger]
      .filter((m) => m.movement_type === 'stock-out')
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [data]);

  const selectedBatches = useMemo(() => {
    if (!form.product_id || !form.warehouse_id || !data) return [];
    return data.stock_batches
      .filter(
        (b) =>
          String(b.product_id) === form.product_id &&
          String(b.warehouse_id) === form.warehouse_id &&
          Number(b.available_quantity) > 0 &&
          b.batch_status === 'available'
      )
      .sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });
  }, [form.product_id, form.warehouse_id, data]);

  const fefoBatch = selectedBatches[0];
  const isFefoOverride =
    !!form.batch_id && !!fefoBatch && String(fefoBatch.batch_id) !== form.batch_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await inventoryAPI.issueStock({
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        batch_id: Number(form.batch_id),
        quantity: Number(form.quantity),
        reference_type: form.reference_type,
        reference_id: form.reference_id ? Number(form.reference_id) : null,
        override_justification: isFefoOverride ? form.override_justification : null,
      });
      setShowForm(false);
      setForm(initialForm);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to issue stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="stock-issuance">
      <div className="content-section-header">
        <h2>Step 5: Stock Issuance</h2>
      </div>

      <p className="content-description">
        When a Sales Order or internal transfer is approved, the Inventory module deducts stock from
        the allocated batch(es), decrements the ledger, and records a stock-out movement with a
        reference back to the originating sales order or transfer request.
      </p>

      <div className="inv-toolbar">
        <button className="inv-btn inv-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Issue Stock
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Ledger ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Batch</th>
              <th>Quantity Issued</th>
              <th>Balance After</th>
              <th>Reference</th>
              <th>Notes</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stockOutMovements.map((m) => {
              const product = getProduct(String(m.product_id));
              const warehouse = getWarehouse(String(m.warehouse_id));
              const batch = data.stock_batches.find((b) => String(b.batch_id) === String(m.batch_id));
              return (
                <tr key={m.ledger_id}>
                  <td className="inv-table-name">{m.ledger_id}</td>
                  <td>{product?.product_name || m.product_id}</td>
                  <td>{warehouse?.warehouse_name || m.warehouse_id}</td>
                  <td>{batch?.batch_number || m.batch_id}</td>
                  <td className="inv-text-red">
                    {Math.abs(Number(m.quantity)).toLocaleString()}
                  </td>
                  <td>{Number(m.balance_after).toLocaleString()}</td>
                  <td>
                    {m.reference_type
                      ? `${m.reference_type.replace('_', ' ')}${m.reference_id ? ` #${m.reference_id}` : ''}`
                      : '—'}
                  </td>
                  <td className="inv-text-truncate" title={m.notes || ''}>{m.notes || '—'}</td>
                  <td>{new Date(m.transaction_date).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {stockOutMovements.length === 0 && (
              <tr><td colSpan={9} className="inv-empty">No stock issuances recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Issue Stock</h3>
              <button className="inv-modal-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="inv-form">
              {error && <div className="inv-form-error">{error}</div>}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Product</label>
                  <select
                    required
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value, batch_id: '', override_justification: '' })}
                  >
                    <option value="">Select product</option>
                    {data.products.map((p) => (
                      <option key={p.product_id} value={String(p.product_id)}>
                        {p.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Warehouse</label>
                  <select
                    required
                    value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value, batch_id: '', override_justification: '' })}
                  >
                    <option value="">Select warehouse</option>
                    {data.warehouses.map((w) => (
                      <option key={w.warehouse_id} value={String(w.warehouse_id)}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Batch (FEFO: earliest expiry first)</label>
                  <select
                    required
                    value={form.batch_id}
                    onChange={(e) => setForm({ ...form, batch_id: e.target.value, override_justification: '' })}
                  >
                    <option value="">Select batch</option>
                    {selectedBatches.map((b, i) => (
                      <option key={b.batch_id} value={String(b.batch_id)}>
                        {i === 0 ? '★ ' : ''}{b.batch_number} (Qty: {Number(b.available_quantity).toLocaleString()}{b.expiry_date ? `, Exp: ${b.expiry_date}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Quantity to Issue</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Reference Type</label>
                  <select
                    required
                    value={form.reference_type}
                    onChange={(e) => setForm({ ...form, reference_type: e.target.value })}
                  >
                    <option value="sales_order">Sales Order</option>
                    <option value="internal_transfer">Internal Transfer</option>
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Reference ID</label>
                  <input
                    type="number"
                    placeholder="Originating order / transfer ID"
                    value={form.reference_id}
                    onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
                  />
                </div>
              </div>
              {isFefoOverride && (
                <div className="inv-form-group">
                  <label>FEFO Override Justification (required)</label>
                  <input
                    type="text"
                    required
                    placeholder={`Earliest-expiring batch is ${fefoBatch?.batch_number}. Justify issuing from a different batch.`}
                    value={form.override_justification}
                    onChange={(e) => setForm({ ...form, override_justification: e.target.value })}
                  />
                </div>
              )}
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>
                  Issue Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
