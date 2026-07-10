import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

const initialDamagedForm = {
  product_id: '',
  warehouse_id: '',
  batch_id: '',
  quantity: '',
  damage_reason: '',
  supporting_photos: '',
};

const initialAdjustmentForm = {
  product_id: '',
  warehouse_id: '',
  batch_id: '',
  adjustment_type: 'increase',
  quantity: '',
  reason_code: '',
  description: '',
};

export default function DamagedGoodsAdjustments({ inventory }: Props) {
  const { data, getProduct, getWarehouse, refetch } = inventory;
  const [activeTab, setActiveTab] = useState<'damaged' | 'adjustments'>('damaged');
  const [showDamagedForm, setShowDamagedForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [damagedForm, setDamagedForm] = useState(initialDamagedForm);
  const [adjustmentForm, setAdjustmentForm] = useState(initialAdjustmentForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const damagedGoods = useMemo(() => {
    if (!data) return [];
    let items = [...data.damaged_goods].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (statusFilter) items = items.filter((d) => d.disposition_status === statusFilter);
    return items;
  }, [data, statusFilter]);

  const adjustments = useMemo(() => {
    if (!data) return [];
    let items = [...data.stock_adjustments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (statusFilter) items = items.filter((a) => a.status === statusFilter);
    return items;
  }, [data, statusFilter]);

  const damagedBatches = useMemo(() => {
    if (!damagedForm.product_id || !damagedForm.warehouse_id || !data) return [];
    return data.stock_batches.filter(
      (b) => String(b.product_id) === damagedForm.product_id && String(b.warehouse_id) === damagedForm.warehouse_id
    );
  }, [damagedForm.product_id, damagedForm.warehouse_id, data]);

  const adjustmentBatches = useMemo(() => {
    if (!adjustmentForm.product_id || !adjustmentForm.warehouse_id || !data) return [];
    return data.stock_batches.filter(
      (b) => String(b.product_id) === adjustmentForm.product_id && String(b.warehouse_id) === adjustmentForm.warehouse_id
    );
  }, [adjustmentForm.product_id, adjustmentForm.warehouse_id, data]);

  const handleDamagedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await inventoryAPI.createDamagedGood({
        product_id: Number(damagedForm.product_id),
        warehouse_id: Number(damagedForm.warehouse_id),
        batch_id: Number(damagedForm.batch_id),
        quantity: Number(damagedForm.quantity),
        damage_reason: damagedForm.damage_reason,
        supporting_photos: damagedForm.supporting_photos || null,
      });
      setShowDamagedForm(false);
      setDamagedForm(initialDamagedForm);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to report damaged goods');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await inventoryAPI.createAdjustment({
        product_id: Number(adjustmentForm.product_id),
        warehouse_id: Number(adjustmentForm.warehouse_id),
        batch_id: Number(adjustmentForm.batch_id),
        adjustment_type: adjustmentForm.adjustment_type,
        quantity: Number(adjustmentForm.quantity),
        reason_code: adjustmentForm.reason_code || null,
        description: adjustmentForm.description || null,
      });
      setShowAdjustmentForm(false);
      setAdjustmentForm(initialAdjustmentForm);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to create adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAdjustment = async (id: string) => {
    try { await inventoryAPI.approveAdjustment(id); refetch(); } catch { /* */ }
  };

  const handleApproveDamaged = async (id: string) => {
    try { await inventoryAPI.approveDamagedGood(id); refetch(); } catch { /* */ }
  };

  const handleRejectDamaged = async (id: string) => {
    try { await inventoryAPI.rejectDamagedGood(id); refetch(); } catch { /* */ }
  };

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'approved' ? 'inv-badge-green' :
      status === 'pending' ? 'inv-badge-amber' :
      status === 'rejected' ? 'inv-badge-red' :
      'inv-badge-gray';
    return <span className={`inv-badge ${cls}`}>{status}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="damaged-adjustments">
      <div className="content-section-header">
        <h2>Step 6: Damaged Goods &amp; Adjustments</h2>
      </div>

      <p className="content-description">
        Warehouse staff report damaged or discrepant stock through a structured form capturing quantity,
        batch, reason, and supporting photos. This creates a pending adjustment request that routes to a
        supervisor for approval. Once approved, the ledger is corrected and the financial impact is posted
        to the Finance &amp; Accounting module.
      </p>

      <div className="inv-toolbar">
        <div className="inv-tab-group">
          <button
            className={`inv-tab ${activeTab === 'damaged' ? 'inv-tab-active' : ''}`}
            onClick={() => setActiveTab('damaged')}
          >
            Damaged Goods
          </button>
          <button
            className={`inv-tab ${activeTab === 'adjustments' ? 'inv-tab-active' : ''}`}
            onClick={() => setActiveTab('adjustments')}
          >
            Stock Adjustments
          </button>
        </div>
        <select
          className="inv-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {activeTab === 'damaged' ? (
          <button className="inv-btn inv-btn-primary" onClick={() => setShowDamagedForm(true)}>
            <Plus size={16} /> Report Damaged
          </button>
        ) : (
          <button className="inv-btn inv-btn-primary" onClick={() => setShowAdjustmentForm(true)}>
            <Plus size={16} /> New Adjustment
          </button>
        )}
      </div>

      {activeTab === 'damaged' && (
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Damaged Goods ID</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Damage Reason</th>
                <th>Photos</th>
                <th>Disposition Status</th>
                <th>Reported By</th>
                <th>Approved By</th>
                <th>Disposal Date</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {damagedGoods.map((dg) => {
                const product = getProduct(String(dg.product_id));
                const warehouse = getWarehouse(String(dg.warehouse_id));
                const batch = data.stock_batches.find((b) => String(b.batch_id) === String(dg.batch_id));
                return (
                  <tr key={dg.damaged_goods_id}>
                    <td className="inv-table-name">{dg.damaged_goods_id}</td>
                    <td>{product?.product_name || dg.product_id}</td>
                    <td>{warehouse?.warehouse_name || dg.warehouse_id}</td>
                    <td>{batch?.batch_number || dg.batch_id}</td>
                    <td>{Number(dg.quantity).toLocaleString()}</td>
                    <td>{dg.damage_reason}</td>
                    <td>{dg.supporting_photos ? 'Available' : '—'}</td>
                    <td>{getStatusBadge(dg.disposition_status)}</td>
                    <td>{dg.reported_by ?? '—'}</td>
                    <td>{dg.approved_by ?? '—'}</td>
                    <td>{dg.disposal_date || '—'}</td>
                    <td>{new Date(dg.created_at).toLocaleDateString()}</td>
                    <td>
                      {dg.disposition_status === 'pending' && (
                        <div className="inv-btn-group">
                          <button className="inv-btn inv-btn-sm inv-btn-primary" onClick={() => handleApproveDamaged(String(dg.damaged_goods_id))}>Approve</button>
                          <button className="inv-btn inv-btn-sm inv-btn-danger" onClick={() => handleRejectDamaged(String(dg.damaged_goods_id))}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {damagedGoods.length === 0 && (
                <tr><td colSpan={13} className="inv-empty">No damaged goods records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'adjustments' && (
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Adjustment ID</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Batch</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason Code</th>
                <th>Description</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Approved By</th>
                <th>Approved At</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj) => {
                const product = getProduct(String(adj.product_id));
                const warehouse = getWarehouse(String(adj.warehouse_id));
                const batch = data.stock_batches.find((b) => String(b.batch_id) === String(adj.batch_id));
                return (
                  <tr key={adj.adjustment_id}>
                    <td className="inv-table-name">{adj.adjustment_id}</td>
                    <td>{product?.product_name || adj.product_id}</td>
                    <td>{warehouse?.warehouse_name || adj.warehouse_id}</td>
                    <td>{batch?.batch_number || adj.batch_id}</td>
                    <td>{adj.adjustment_type}</td>
                    <td className={adj.adjustment_type === 'decrease' ? 'inv-text-red' : 'inv-text-green'}>
                      {adj.adjustment_type === 'decrease' ? '-' : '+'}{Number(adj.quantity).toLocaleString()}
                    </td>
                    <td>{adj.reason_code || '—'}</td>
                    <td className="inv-text-truncate" title={adj.description || ''}>{adj.description || '—'}</td>
                    <td>{getStatusBadge(adj.status)}</td>
                    <td>{adj.requested_by ?? '—'}</td>
                    <td>{adj.approved_by ?? '—'}</td>
                    <td>{adj.approved_at ? new Date(adj.approved_at).toLocaleDateString() : '—'}</td>
                    <td>{new Date(adj.created_at).toLocaleDateString()}</td>
                    <td>
                      {adj.status === 'pending' && (
                        <button className="inv-btn inv-btn-sm inv-btn-primary" onClick={() => handleApproveAdjustment(String(adj.adjustment_id))}>Approve</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {adjustments.length === 0 && (
                <tr><td colSpan={14} className="inv-empty">No adjustments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDamagedForm && (
        <div className="inv-modal-overlay" onClick={() => setShowDamagedForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Report Damaged Goods</h3>
              <button className="inv-modal-close" onClick={() => setShowDamagedForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleDamagedSubmit} className="inv-form">
              {error && <div className="inv-form-error">{error}</div>}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Product</label>
                  <select required value={damagedForm.product_id} onChange={(e) => setDamagedForm({ ...damagedForm, product_id: e.target.value, batch_id: '' })}>
                    <option value="">Select product</option>
                    {data.products.map((p) => (<option key={p.product_id} value={String(p.product_id)}>{p.product_name}</option>))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Warehouse</label>
                  <select required value={damagedForm.warehouse_id} onChange={(e) => setDamagedForm({ ...damagedForm, warehouse_id: e.target.value, batch_id: '' })}>
                    <option value="">Select warehouse</option>
                    {data.warehouses.map((w) => (<option key={w.warehouse_id} value={String(w.warehouse_id)}>{w.warehouse_name}</option>))}
                  </select>
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Batch</label>
                  <select required value={damagedForm.batch_id} onChange={(e) => setDamagedForm({ ...damagedForm, batch_id: e.target.value })}>
                    <option value="">Select batch</option>
                    {damagedBatches.map((b) => (<option key={b.batch_id} value={String(b.batch_id)}>{b.batch_number} (Qty: {Number(b.available_quantity).toLocaleString()})</option>))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Quantity Damaged</label>
                  <input type="number" required min="1" value={damagedForm.quantity} onChange={(e) => setDamagedForm({ ...damagedForm, quantity: e.target.value })} />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Damage Reason</label>
                <select required value={damagedForm.damage_reason} onChange={(e) => setDamagedForm({ ...damagedForm, damage_reason: e.target.value })}>
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
                <label>Supporting Photos URL</label>
                <input type="text" placeholder="Optional link to photos" value={damagedForm.supporting_photos} onChange={(e) => setDamagedForm({ ...damagedForm, supporting_photos: e.target.value })} />
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowDamagedForm(false)}>Cancel</button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>{submitting ? 'Reporting...' : 'Report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdjustmentForm && (
        <div className="inv-modal-overlay" onClick={() => setShowAdjustmentForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>New Stock Adjustment</h3>
              <button className="inv-modal-close" onClick={() => setShowAdjustmentForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdjustmentSubmit} className="inv-form">
              {error && <div className="inv-form-error">{error}</div>}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Product</label>
                  <select required value={adjustmentForm.product_id} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, product_id: e.target.value, batch_id: '' })}>
                    <option value="">Select product</option>
                    {data.products.map((p) => (<option key={p.product_id} value={String(p.product_id)}>{p.product_name}</option>))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Warehouse</label>
                  <select required value={adjustmentForm.warehouse_id} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, warehouse_id: e.target.value, batch_id: '' })}>
                    <option value="">Select warehouse</option>
                    {data.warehouses.map((w) => (<option key={w.warehouse_id} value={String(w.warehouse_id)}>{w.warehouse_name}</option>))}
                  </select>
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Batch</label>
                  <select required value={adjustmentForm.batch_id} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, batch_id: e.target.value })}>
                    <option value="">Select batch</option>
                    {adjustmentBatches.map((b) => (<option key={b.batch_id} value={String(b.batch_id)}>{b.batch_number} (Qty: {Number(b.available_quantity).toLocaleString()})</option>))}
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Adjustment Type</label>
                  <select value={adjustmentForm.adjustment_type} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value })}>
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Quantity</label>
                  <input type="number" required min="1" value={adjustmentForm.quantity} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })} />
                </div>
                <div className="inv-form-group">
                  <label>Reason Code</label>
                  <input type="text" placeholder="e.g. DAMAGE, EXPIRED" value={adjustmentForm.reason_code} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason_code: e.target.value })} />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Description</label>
                <input type="text" placeholder="Detailed reason" value={adjustmentForm.description} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })} />
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowAdjustmentForm(false)}>Cancel</button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
