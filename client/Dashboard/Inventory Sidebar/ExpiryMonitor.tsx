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
    <section className="content-section" id="expiry">
      <div className="content-section-header">
        <h2>Step 4: Expiry Monitoring (FEFO Enforcement)</h2>
      </div>

      <p className="content-description">
        Each batch's expiry date is monitored daily. Batches approaching expiry (configurable thresholds,
        e.g. 90/60/30 days) trigger escalating alerts to warehouse and regulatory teams. When Sales &amp;
        Distribution requests stock allocation for an order, the system automatically allocates from the
        earliest-expiring eligible batch first (FEFO), unless a batch is manually overridden with justification.
      </p>

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
          <h3 className="inv-subsection-title">Batches Expiring Within 90 Days</h3>
          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Batch No</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiring90
                  .filter((b) => b.expiry_date)
                  .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
                  .map((batch) => {
                    const product = getProduct(String(batch.product_id));
                    const warehouse = getWarehouse(String(batch.warehouse_id));
                    const daysLeft = getDaysUntilExpiry(batch.expiry_date!);
                    return (
                      <tr key={batch.batch_id}>
                        <td className="inv-table-name">{batch.batch_number}</td>
                        <td>{product?.product_name || batch.product_id}</td>
                        <td>{warehouse?.warehouse_name || batch.warehouse_id}</td>
                        <td>{Number(batch.available_quantity).toLocaleString()}</td>
                        <td>${Number(batch.unit_cost).toFixed(2)}</td>
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
    </section>
  );
}
