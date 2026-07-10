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
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data]);

  const getStatusBadge = (status: string) => {
    if (status === 'disposed') return <span className="inv-badge inv-badge-gray">Disposed</span>;
    if (status === 'pending') return <span className="inv-badge inv-badge-amber">Pending</span>;
    if (status === 'approved') return <span className="inv-badge inv-badge-green">Approved</span>;
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
        Structured logging and disposition of damaged or rejected stock.
      </p>

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
              <th>Disposal Date</th>
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
                  <td>{dg.disposal_date || '—'}</td>
                </tr>
              );
            })}
            {damaged.length === 0 && (
              <tr><td colSpan={9} className="inv-empty">No damaged goods records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
