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
  counted_quantity: '',
};

export default function CycleCounting({ inventory }: Props) {
  const { data, getProduct, getWarehouse, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cycleCounts = useMemo(() => {
    if (!data) return [];
    return [...data.stock_adjustments]
      .filter((a) => (a.reason_code || '').toLowerCase() === 'cycle-count')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data]);

  const selectedBatches = useMemo(() => {
    if (!form.product_id || !form.warehouse_id || !data) return [];
    return data.stock_batches.filter(
      (b) =>
        String(b.product_id) === form.product_id &&
        String(b.warehouse_id) === form.warehouse_id
    );
  }, [form.product_id, form.warehouse_id, data]);

  const selectedBatch = useMemo(
    () => selectedBatches.find((b) => String(b.batch_id) === form.batch_id),
    [selectedBatches, form.batch_id]
  );

  const systemQuantity = selectedBatch ? Number(selectedBatch.available_quantity) : null;
  const countedQuantity = form.counted_quantity === '' ? null : Number(form.counted_quantity);
  const variance =
    systemQuantity !== null && countedQuantity !== null ? countedQuantity - systemQuantity : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (variance === null) return;
    if (variance === 0) {
      setError('No variance between physical count and system quantity — nothing to reconcile.');
      return;
    }
    setSubmitting(true);
    try {
      await inventoryAPI.createAdjustment({
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        batch_id: Number(form.batch_id),
        adjustment_type: variance > 0 ? 'increase' : 'decrease',
        quantity: Math.abs(variance),
        reason_code: 'cycle-count',
        description: `Cycle count: physical ${countedQuantity}, system ${systemQuantity}, variance ${variance > 0 ? '+' : ''}${variance}`,
      });
      setShowForm(false);
      setForm(initialForm);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to record cycle count');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="cycle-counting">
      <div className="content-section-header">
        <h2>Step 7: Cycle Counting &amp; Reconciliation</h2>
      </div>

      <p className="content-description">
        Scheduled or ad-hoc cycle counts are performed against physical stock. Variances between
        system and physical counts are flagged, investigated, and resolved through the same
        approval-gated adjustment workflow, ensuring a full audit trail of every correction.
      </p>

      <div className="inv-toolbar">
        <button className="inv-btn inv-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Record Cycle Count
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Adjustment ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Batch</th>
              <th>Variance</th>
              <th>Description</th>
              <th>Status</th>
              <th>Requested By</th>
              <th>Approved By</th>
              <th>Approved At</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {cycleCounts.map((adj) => {
              const product = getProduct(String(adj.product_id));
              const warehouse = getWarehouse(String(adj.warehouse_id));
              const batch = data.stock_batches.find((b) => String(b.batch_id) === String(adj.batch_id));
              return (
                <tr key={adj.adjustment_id}>
                  <td className="inv-table-name">{adj.adjustment_id}</td>
                  <td>{product?.product_name || adj.product_id}</td>
                  <td>{warehouse?.warehouse_name || adj.warehouse_id}</td>
                  <td>{batch?.batch_number || adj.batch_id}</td>
                  <td className={adj.adjustment_type === 'decrease' ? 'inv-text-red' : 'inv-text-green'}>
                    {adj.adjustment_type === 'decrease' ? '-' : '+'}{Number(adj.quantity).toLocaleString()}
                  </td>
                  <td className="inv-text-truncate" title={adj.description || ''}>{adj.description || '—'}</td>
                  <td>
                    <span className={`inv-badge ${adj.status === 'approved' ? 'inv-badge-green' : adj.status === 'pending' ? 'inv-badge-amber' : 'inv-badge-gray'}`}>
                      {adj.status}
                    </span>
                  </td>
                  <td>{adj.requested_by ?? '—'}</td>
                  <td>{adj.approved_by ?? '—'}</td>
                  <td>{adj.approved_at ? new Date(adj.approved_at).toLocaleDateString() : '—'}</td>
                  <td>{new Date(adj.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {cycleCounts.length === 0 && (
              <tr><td colSpan={11} className="inv-empty">No cycle count records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Record Cycle Count</h3>
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
                    onChange={(e) => setForm({ ...form, product_id: e.target.value, batch_id: '' })}
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
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value, batch_id: '' })}
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
                  <label>Batch</label>
                  <select
                    required
                    value={form.batch_id}
                    onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                  >
                    <option value="">Select batch</option>
                    {selectedBatches.map((b) => (
                      <option key={b.batch_id} value={String(b.batch_id)}>
                        {b.batch_number} (System Qty: {Number(b.available_quantity).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Physical Count</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Quantity physically counted"
                    value={form.counted_quantity}
                    onChange={(e) => setForm({ ...form, counted_quantity: e.target.value })}
                  />
                </div>
              </div>
              {variance !== null && (
                <div className="inv-form-group">
                  <label>Variance (Physical − System)</label>
                  <span className={variance === 0 ? 'inv-text-muted' : variance > 0 ? 'inv-text-green' : 'inv-text-red'}>
                    {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                    {variance === 0
                      ? ' — counts match, no adjustment needed'
                      : ' — an approval-gated adjustment will be created'}
                  </span>
                </div>
              )}
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting || variance === 0}>
                  {submitting ? 'Recording...' : 'Record Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
