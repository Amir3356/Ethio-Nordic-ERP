import { useState, useMemo } from 'react';
import { Plus, X, ArrowRightLeft, Check } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';
import type { StockTransfer } from './types';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

const initialForm = {
  product_id: '',
  batch_id: '',
  from_warehouse_id: '',
  to_warehouse_id: '',
  quantity: '',
  reason: '',
};

export default function StockTransfers({ inventory }: Props) {
  const { data, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const loadTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryAPI.getTransfers(params);
      setTransfers(res.data?.data ?? res.data ?? []);
    } catch {
      setTransfers([]);
    } finally {
      setLoadingTransfers(false);
    }
  };

  useState(() => {
    loadTransfers();
  });

  const selectedProductBatches = useMemo(() => {
    if (!form.product_id || !form.from_warehouse_id || !data) return [];
    return data.stock_batches.filter(
      (b) =>
        String(b.product_id) === form.product_id &&
        String(b.warehouse_id) === form.from_warehouse_id &&
        Number(b.available_quantity) > 0
    );
  }, [form.product_id, form.from_warehouse_id, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await inventoryAPI.createTransfer({
        product_id: Number(form.product_id),
        batch_id: Number(form.batch_id),
        from_warehouse_id: Number(form.from_warehouse_id),
        to_warehouse_id: Number(form.to_warehouse_id),
        quantity: Number(form.quantity),
        reason: form.reason || null,
      });
      setShowForm(false);
      setForm(initialForm);
      loadTransfers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await inventoryAPI.approveTransfer(id);
      loadTransfers();
      refetch();
    } catch {
      // silently fail
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await inventoryAPI.completeTransfer(id);
      loadTransfers();
      refetch();
    } catch {
      // silently fail
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inv-badge inv-badge-amber">Pending</span>;
      case 'approved': return <span className="inv-badge inv-badge-blue">Approved</span>;
      case 'completed': return <span className="inv-badge inv-badge-green">Completed</span>;
      case 'rejected': return <span className="inv-badge inv-badge-red">Rejected</span>;
      default: return <span className="inv-badge inv-badge-gray">{status}</span>;
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="transfers">
      <div className="content-section-header">
        <h2>Stock Transfers</h2>
      </div>

      <p className="content-description">
        Transfer stock between warehouses with approval workflow.
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
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="inv-btn inv-btn-secondary" onClick={loadTransfers}>
          Refresh
        </button>
        <button className="inv-btn inv-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Transfer
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Batch</th>
              <th>From</th>
              <th>To</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => {
              const product = data.products.find((p) => String(p.product_id) === String(t.product_id));
              const fromWh = data.warehouses.find((w) => String(w.warehouse_id) === String(t.from_warehouse_id));
              const toWh = data.warehouses.find((w) => String(w.warehouse_id) === String(t.to_warehouse_id));
              const batch = data.stock_batches.find((b) => String(b.batch_id) === String(t.batch_id));
              return (
                <tr key={t.transfer_id}>
                  <td className="inv-table-name">{t.transfer_id}</td>
                  <td>{product?.product_name || t.product_id}</td>
                  <td>{batch?.batch_number || t.batch_id}</td>
                  <td>{fromWh?.warehouse_name || t.from_warehouse_id}</td>
                  <td>
                    <span className="inv-transfer-arrow">
                      <ArrowRightLeft size={14} /> {toWh?.warehouse_name || t.to_warehouse_id}
                    </span>
                  </td>
                  <td>{Number(t.quantity).toLocaleString()}</td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td>
                    {t.status === 'pending' && (
                      <button className="inv-btn inv-btn-sm inv-btn-primary" onClick={() => handleApprove(String(t.transfer_id))}>
                        <Check size={12} /> Approve
                      </button>
                    )}
                    {t.status === 'approved' && (
                      <button className="inv-btn inv-btn-sm inv-btn-green" onClick={() => handleComplete(String(t.transfer_id))}>
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {transfers.length === 0 && (
              <tr><td colSpan={8} className="inv-empty">
                {loadingTransfers ? 'Loading...' : 'No transfers found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>New Stock Transfer</h3>
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
                  <label>From Warehouse</label>
                  <select
                    required
                    value={form.from_warehouse_id}
                    onChange={(e) => setForm({ ...form, from_warehouse_id: e.target.value, batch_id: '' })}
                  >
                    <option value="">Select source</option>
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
                    {selectedProductBatches.map((b) => (
                      <option key={b.batch_id} value={String(b.batch_id)}>
                        {b.batch_number} (Qty: {Number(b.available_quantity).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>To Warehouse</label>
                  <select
                    required
                    value={form.to_warehouse_id}
                    onChange={(e) => setForm({ ...form, to_warehouse_id: e.target.value })}
                  >
                    <option value="">Select destination</option>
                    {data.warehouses
                      .filter((w) => String(w.warehouse_id) !== form.from_warehouse_id)
                      .map((w) => (
                        <option key={w.warehouse_id} value={String(w.warehouse_id)}>
                          {w.warehouse_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="inv-form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="inv-form-group">
                <label>Reason</label>
                <input
                  type="text"
                  placeholder="Optional reason for transfer"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
