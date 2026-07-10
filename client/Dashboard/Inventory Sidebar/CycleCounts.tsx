import { useState, useMemo } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';
import type { CycleCount } from './types';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

const initialForm = {
  warehouse_id: '',
  product_id: '',
  batch_id: '',
  counted_quantity: '',
  notes: '',
};

export default function CycleCounts({ inventory }: Props) {
  const { data, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState<CycleCount[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const loadCounts = async () => {
    setLoadingCounts(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryAPI.getCycleCounts(params);
      setCounts(res.data?.data ?? res.data ?? []);
    } catch {
      setCounts([]);
    } finally {
      setLoadingCounts(false);
    }
  };

  useState(() => {
    loadCounts();
  });

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
      await inventoryAPI.createCycleCount({
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        batch_id: Number(form.batch_id),
        counted_quantity: Number(form.counted_quantity),
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm(initialForm);
      loadCounts();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to create cycle count');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await inventoryAPI.approveCycleCount(id);
      loadCounts();
      refetch();
    } catch {
      // silently fail
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inv-badge inv-badge-amber">Pending</span>;
      case 'approved': return <span className="inv-badge inv-badge-green">Approved</span>;
      case 'variance': return <span className="inv-badge inv-badge-red">Variance</span>;
      default: return <span className="inv-badge inv-badge-gray">{status}</span>;
    }
  };

  const getVarianceClass = (variance: number) => {
    if (variance === 0) return 'inv-text-green';
    return 'inv-text-red';
  };

  if (!data) return null;

  return (
    <section className="content-section" id="cycle-counts">
      <div className="content-section-header">
        <h2>Cycle Counting & Reconciliation</h2>
      </div>

      <p className="content-description">
        Perform scheduled or ad-hoc cycle counts against physical stock. Variances are flagged and investigated.
      </p>

      <div className="inv-toolbar">
        <select
          className="inv-filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="variance">Variance</option>
        </select>
        <button className="inv-btn inv-btn-secondary" onClick={loadCounts}>
          Refresh
        </button>
        <button className="inv-btn inv-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Count
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Batch</th>
              <th>System Qty</th>
              <th>Counted Qty</th>
              <th>Variance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counts.map((c) => {
              const product = data.products.find((p) => String(p.product_id) === String(c.product_id));
              const warehouse = data.warehouses.find((w) => String(w.warehouse_id) === String(c.warehouse_id));
              const batch = data.stock_batches.find((b) => String(b.batch_id) === String(c.batch_id));
              return (
                <tr key={c.cycle_count_id}>
                  <td className="inv-table-name">{c.cycle_count_id}</td>
                  <td>{product?.product_name || c.product_id}</td>
                  <td>{warehouse?.warehouse_name || c.warehouse_id}</td>
                  <td>{batch?.batch_number || c.batch_id}</td>
                  <td>{Number(c.system_quantity).toLocaleString()}</td>
                  <td>{Number(c.counted_quantity).toLocaleString()}</td>
                  <td className={getVarianceClass(Number(c.variance))}>
                    {Number(c.variance) > 0 ? '+' : ''}{Number(c.variance).toLocaleString()}
                  </td>
                  <td>{getStatusBadge(c.status)}</td>
                  <td>
                    {c.status === 'pending' && Number(c.variance) !== 0 && (
                      <button className="inv-btn inv-btn-sm inv-btn-primary" onClick={() => handleApprove(String(c.cycle_count_id))}>
                        <Check size={12} /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {counts.length === 0 && (
              <tr><td colSpan={9} className="inv-empty">
                {loadingCounts ? 'Loading...' : 'No cycle counts found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>New Cycle Count</h3>
              <button className="inv-modal-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="inv-form">
              {error && <div className="inv-form-error">{error}</div>}
              <div className="inv-form-row">
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
                        {b.batch_number} (System: {Number(b.available_quantity).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Physically Counted Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Enter counted quantity"
                    value={form.counted_quantity}
                    onChange={(e) => setForm({ ...form, counted_quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes about this count"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Submit Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
