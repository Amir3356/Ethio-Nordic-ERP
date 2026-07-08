import { useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function ExpiryMonitor({ inventory }: Props) {
  const { data, getProduct, getWarehouse, getExpiringBatches } = inventory;

  const expiring90 = useMemo(() => getExpiringBatches(90), [getExpiringBatches]);
  const expiring60 = useMemo(() => getExpiringBatches(60), [getExpiringBatches]);
  const expiring30 = useMemo(() => getExpiringBatches(30), [getExpiringBatches]);

  const getDaysUntilExpiry = (expiryDate: string): number => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (days: number) => {
    if (days <= 30) return <span className="inv-badge inv-badge-red">Critical ({days}d)</span>;
    if (days <= 60) return <span className="inv-badge inv-badge-amber">Warning ({days}d)</span>;
    return <span className="inv-badge inv-badge-blue">Watch ({days}d)</span>;
  };

  if (!data) return null;

  return (
    <div className="inv-section">
      <h3 className="inv-section-title">Expiry Monitoring</h3>
      <div className="inv-description">
        Batch-level expiry tracking with escalating alerts. FEFO enforcement ensures earliest-expiring batches are allocated first.
      </div>

      <div className="inv-expiry-summary">
        <div className="inv-expiry-card inv-expiry-critical">
          <AlertTriangle size={18} />
          <div>
            <span className="inv-expiry-count">{expiring30.length}</span>
            <span className="inv-expiry-label">Within 30 Days</span>
          </div>
        </div>
        <div className="inv-expiry-card inv-expiry-warning">
          <Clock size={18} />
          <div>
            <span className="inv-expiry-count">{expiring60.length}</span>
            <span className="inv-expiry-label">Within 60 Days</span>
          </div>
        </div>
        <div className="inv-expiry-card inv-expiry-watch">
          <Clock size={18} />
          <div>
            <span className="inv-expiry-count">{expiring90.length}</span>
            <span className="inv-expiry-label">Within 90 Days</span>
          </div>
        </div>
      </div>

      {expiring90.length > 0 && (
        <>
          <h4 className="inv-subsection-title">Batches Expiring Within 90 Days</h4>
          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Batch No</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Quantity</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiring90
                  .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                  .map((batch) => {
                    const product = getProduct(batch.product_id);
                    const warehouse = getWarehouse(batch.warehouse_id);
                    const daysLeft = getDaysUntilExpiry(batch.expiry_date);
                    return (
                      <tr key={batch.id}>
                        <td className="inv-table-name">{batch.batch_no}</td>
                        <td>{product?.name || batch.product_id}</td>
                        <td>{warehouse?.name || batch.warehouse_id}</td>
                        <td>{batch.quantity.toLocaleString()}</td>
                        <td>{batch.expiry_date}</td>
                        <td>{daysLeft}</td>
                        <td>{getExpiryBadge(daysLeft)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {expiring90.length === 0 && (
        <div className="inv-alert-ok">
          <Clock size={16} /> No batches expiring within the next 90 days.
        </div>
      )}
    </div>
  );
}
