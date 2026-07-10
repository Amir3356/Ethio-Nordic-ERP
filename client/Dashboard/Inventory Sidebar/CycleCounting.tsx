import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import type { useInventory } from './hooks';
import type { StockAdjustment } from './types';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function CycleCounting({ inventory }: Props) {
  const { data, getProduct, getWarehouse, refetch } = inventory;

  const cycleCounts = useMemo(() => {
    if (!data) return [];
    return [...data.stock_adjustments]
      .filter((a) => a.reason_code === 'cycle-count' || a.reason_code === 'CYCLE-COUNT')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data]);

  const allAdjustments = useMemo(() => {
    if (!data) return [];
    return [...data.stock_adjustments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data]);

  const displayData = cycleCounts.length > 0 ? cycleCounts : allAdjustments;

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
            </tr>
          </thead>
          <tbody>
            {displayData.map((adj) => {
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
            {displayData.length === 0 && (
              <tr><td colSpan={13} className="inv-empty">No cycle count records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
