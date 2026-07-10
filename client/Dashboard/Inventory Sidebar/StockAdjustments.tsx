import { useMemo } from 'react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function StockAdjustments({ inventory }: Props) {
  const { data, getProduct, getWarehouse } = inventory;

  const adjustments = useMemo(() => {
    if (!data) return [];
    return [...data.stock_adjustments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'approved' ? 'inv-badge-green' :
      status === 'pending' ? 'inv-badge-amber' :
      'inv-badge-red';
    return <span className={`inv-badge ${cls}`}>{status}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="adjustments">
      <div className="content-section-header">
        <h2>Stock Adjustments</h2>
      </div>

      <p className="content-description">
        Controlled, approval-gated stock corrections with full audit trail.
      </p>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Reason Code</th>
              <th>Description</th>
              <th>Status</th>
              <th>Requested By</th>
              <th>Approved By</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((adj) => {
              const product = getProduct(String(adj.product_id));
              const warehouse = getWarehouse(String(adj.warehouse_id));
              return (
                <tr key={adj.adjustment_id}>
                  <td className="inv-table-name">{adj.adjustment_id}</td>
                  <td>{product?.product_name || adj.product_id}</td>
                  <td>{warehouse?.warehouse_name || adj.warehouse_id}</td>
                  <td>{adj.adjustment_type}</td>
                  <td className={adj.adjustment_type === 'decrease' ? 'inv-text-red' : 'inv-text-green'}>
                    {adj.adjustment_type === 'decrease' ? '-' : '+'}
                    {Number(adj.quantity).toLocaleString()}
                  </td>
                  <td>{adj.reason_code || '—'}</td>
                  <td className="inv-text-truncate" title={adj.description || ''}>
                    {adj.description || '—'}
                  </td>
                  <td>{getStatusBadge(adj.status)}</td>
                  <td>{adj.requested_by ?? '—'}</td>
                  <td>{adj.approved_by ?? '—'}</td>
                </tr>
              );
            })}
            {adjustments.length === 0 && (
              <tr><td colSpan={10} className="inv-empty">No adjustments found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
