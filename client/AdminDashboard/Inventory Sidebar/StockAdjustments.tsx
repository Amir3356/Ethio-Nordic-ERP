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
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
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
              <th>Before</th>
              <th>After</th>
              <th>Adjustment</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Requested By</th>
              <th>Financial Impact</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((adj) => {
              const product = getProduct(adj.product_id);
              const warehouse = getWarehouse(adj.warehouse_id);
              return (
                <tr key={adj.id}>
                  <td className="inv-table-name">{adj.id}</td>
                  <td>{product?.name || adj.product_id}</td>
                  <td>{warehouse?.name || adj.warehouse_id}</td>
                  <td>{adj.quantity_before.toLocaleString()}</td>
                  <td>{adj.quantity_after.toLocaleString()}</td>
                  <td className={adj.adjustment_qty < 0 ? 'inv-text-red' : 'inv-text-green'}>
                    {adj.adjustment_qty > 0 ? '+' : ''}{adj.adjustment_qty.toLocaleString()}
                  </td>
                  <td>{adj.reason}</td>
                  <td>{getStatusBadge(adj.status)}</td>
                  <td>{adj.requested_by}</td>
                  <td>
                    {adj.financial_impact !== null ? (
                      <span className={adj.financial_impact < 0 ? 'inv-text-red' : 'inv-text-green'}>
                        ${Math.abs(adj.financial_impact).toFixed(2)}
                      </span>
                    ) : (
                      <span className="inv-text-muted">—</span>
                    )}
                  </td>
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
