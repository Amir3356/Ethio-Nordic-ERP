import { useMemo } from 'react';
import { Camera } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function DamagedGoods({ inventory }: Props) {
  const { data, getProduct, getWarehouse } = inventory;

  const damaged = useMemo(() => {
    if (!data) return [];
    return [...data.damaged_goods].sort(
      (a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
    );
  }, [data]);

  const getStatusBadge = (status: string) => {
    if (status === 'disposed') return <span className="inv-badge inv-badge-gray">Disposed</span>;
    if (status === 'pending_review') return <span className="inv-badge inv-badge-amber">Pending Review</span>;
    return <span className="inv-badge inv-badge-blue">{status}</span>;
  };

  if (!data) return null;

  return (
    <div className="inv-section">
      <h3 className="inv-section-title">Damaged Goods</h3>
      <div className="inv-description">
        Structured logging and disposition of damaged or rejected stock.
      </div>
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Qty</th>
              <th>Damage Type</th>
              <th>Description</th>
              <th>Photos</th>
              <th>Status</th>
              <th>Reported By</th>
              <th>Write-off</th>
            </tr>
          </thead>
          <tbody>
            {damaged.map((dg) => {
              const product = getProduct(dg.product_id);
              const warehouse = getWarehouse(dg.warehouse_id);
              return (
                <tr key={dg.id}>
                  <td className="inv-table-name">{dg.id}</td>
                  <td>{product?.name || dg.product_id}</td>
                  <td>{warehouse?.name || dg.warehouse_id}</td>
                  <td>{dg.quantity.toLocaleString()}</td>
                  <td>{dg.damage_type}</td>
                  <td className="inv-text-truncate" title={dg.description}>{dg.description}</td>
                  <td>
                    <span className="inv-photo-count">
                      <Camera size={14} /> {dg.photos.length}
                    </span>
                  </td>
                  <td>{getStatusBadge(dg.status)}</td>
                  <td>{dg.reported_by}</td>
                  <td>
                    {dg.write_off_amount !== null ? (
                      <span className="inv-text-red">${dg.write_off_amount.toFixed(2)}</span>
                    ) : (
                      <span className="inv-text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {damaged.length === 0 && (
              <tr><td colSpan={10} className="inv-empty">No damaged goods records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
