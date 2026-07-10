import { useState, useMemo } from 'react';
import { Camera, Plus, X, Check, Ban } from 'lucide-react';
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
  damage_reason: '',
  supporting_photos: '',
};

export default function DamagedGoods({ inventory }: Props) {
  const { data, getProduct, getWarehouse, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const damaged = useMemo(() => {
    if (!data) return [];
    let items = [...data.damaged_goods].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (statusFilter) {
      items = items.filter((d) => d.disposition_status === statusFilter);
    }
    return items;
  }, [data, statusFilter]);

  const selectedBatches = useMemo(() => {
    if (!form.product_id || !form.warehouse_id || !data) return [];
    return data.stock_batches.filter(
      (b) =>
        String(b.product_id) === form.product_id &&
        String(b.warehouse_id) === form.warehouse_id
    );
  }, [form.product_id, form.warehouse_id, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await inventoryAPI.createDamagedGood({
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        batch_id: Number(form.batch_id),
        quantity: Number(form.quantity),
        damage_reason: form.damage_reason,
        supporting_photos: form.supporting_photos || null,
      });
      setShowForm(false);
      setForm(initialForm);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to report damaged goods');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await inventoryAPI.approveDamagedGood(id);
      refetch();
    } catch {
      // silently fail
    }
  };

  const handleReject = async (id: string) => {
    try {
      await inventoryAPI.rejectDamagedGood(id);
      refetch();
    } catch {
      // silently fail
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'disposed') return <span className="inv-badge inv-badge-gray">Disposed</span>;
    if (status === 'pending') return <span className="inv-badge inv-badge-amber">Pending</span>;
    if (status === 'approved') return <span className="inv-badge inv-badge-green">Approved</span>;
    if (status === 'rejected') return <span className="inv-badge inv-badge-red">Rejected</span>;
    if (status === 'returned') return <span className="inv-badge inv-badge-blue">Returned</span>;
    return <span className="inv-badge inv-badge-blue">{status}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="damaged">
      <div className="content-section-header">
        <h2>Damaged Goods</h2>
      </div>

      <p className="content-description">
        Structured logging, approval workflow, and disposition of damaged or rejected stock.
      </p>

      <div className="inv-toolbar">
        <select
          className="inv-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="disposed">Disposed</option>
        </select>
        <button className="inv-btn inv-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Report Damaged
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Qty</th>
              <th>Damage Reason</th>
              <th>Photos</th>
              <th>Disposition</th>
              <th>Reported By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {damaged.map((dg) => {
              const product = getProduct(String(dg.product_id));
              const warehouse = getWarehouse(String(dg.warehouse_id));
              return (
                <tr key={dg.damaged_goods_id}>
                  <td className="inv-table-name">{dg.damaged_goods_id}</td>
                  <td>{product?.product_name || dg.product_id}</td>
                  <td>{warehouse?.warehouse_name || dg.warehouse_id}</td>
                  <td>{Number(dg.quantity).toLocaleString()}</td>
                  <td>{dg.damage_reason}</td>
                  <td>
                    {dg.supporting_photos ? (
                      <span className="inv-photo-count">
                        <Camera size={14} /> Available
                      </span>
                    ) : (
                      <span className="inv-text-muted">—</span>
                    )}
                  </td>
                  <td>{getStatusBadge(dg.disposition_status)}</td>
                  <td>{dg.reported_by ?? '—'}</td>
                  <td>
                    {dg.disposition_status === 'pending' && (
                      <div className="inv-btn-group">
                        <button className="inv-btn inv-btn-sm inv-btn-primary" onClick={() => handleApprove(String(dg.damaged_goods_id))}>
                          <Check size={12} /> Approve
                        </button>
                        <button className="inv-btn inv-btn-sm inv-btn-danger" onClick={() => handleReject(String(dg.damaged_goods_id))}>
                          <Ban size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {damaged.length === 0 && (
              <tr><td colSpan={9} className="inv-empty">No damaged goods records</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Report Damaged Goods</h3>
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
                        {b.batch_number} (Qty: {Number(b.available_quantity).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Quantity Damaged</label>
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
              <div className="inv-form-group">
                <label>Damage Reason</label>
                <select
                  required
                  value={form.damage_reason}
                  onChange={(e) => setForm({ ...form, damage_reason: e.target.value })}
                >
                  <option value="">Select reason</option>
                  <option value="broken">Broken/Damaged in transit</option>
                  <option value="expired">Expired</option>
                  <option value="contaminated">Contaminated</option>
                  <option value="water_damage">Water Damage</option>
                  <option value="pest_damage">Pest Damage</option>
                  <option value="recall">Product Recall</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="inv-form-group">
                <label>Supporting Photos URL (optional)</label>
                <input
                  type="text"
                  placeholder="Link to photos"
                  value={form.supporting_photos}
                  onChange={(e) => setForm({ ...form, supporting_photos: e.target.value })}
                />
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>
                  {submitting ? 'Reporting...' : 'Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
