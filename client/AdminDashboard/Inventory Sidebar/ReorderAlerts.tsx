import { useMemo } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function ReorderAlerts({ inventory }: Props) {
  const { data, getProduct, getWarehouse, getTotalStockForProduct, getLowStockProducts } = inventory;

  const lowStockProducts = useMemo(() => getLowStockProducts(), [getLowStockProducts]);

  const reorderRules = useMemo(() => {
    if (!data) return [];
    return data.reorder_rules;
  }, [data]);

  if (!data) return null;

  return (
    <div className="inv-section">
      <h3 className="inv-section-title">Reorder Level Monitoring</h3>
      <div className="inv-description">
        Automated low-stock notifications when inventory falls below configured reorder thresholds.
      </div>

      {lowStockProducts.length > 0 && (
        <>
          <h4 className="inv-subsection-title">
            <AlertTriangle size={16} /> Active Alerts ({lowStockProducts.length})
          </h4>
          <div className="inv-alert-list">
            {lowStockProducts.map(({ product, totalStock, warehouseStocks }) => (
              <div key={product.id} className="inv-alert-card">
                <div className="inv-alert-header">
                  <span className="inv-alert-product">{product.name}</span>
                  <span className="inv-badge inv-badge-red">Low Stock</span>
                </div>
                <div className="inv-alert-details">
                  <span>SKU: {product.sku}</span>
                  <span>Current: {totalStock.toLocaleString()} {product.unit}</span>
                  <span>Reorder at: {product.reorder_level.toLocaleString()}</span>
                  <span>Min: {product.min_stock.toLocaleString()}</span>
                </div>
                <div className="inv-alert-warehouses">
                  {warehouseStocks.map(({ warehouse, quantity }) => (
                    <span key={warehouse.id} className="inv-alert-wh">
                      {warehouse.name}: {quantity.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lowStockProducts.length === 0 && (
        <div className="inv-alert-ok">
          <CheckCircle size={16} /> All products are above reorder levels.
        </div>
      )}

      <h4 className="inv-subsection-title">Reorder Rules Configuration</h4>
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Min Stock</th>
              <th>Reorder Level</th>
              <th>Auto Reorder</th>
              <th>Supplier</th>
              <th>Lead Time</th>
            </tr>
          </thead>
          <tbody>
            {reorderRules.map((rule) => {
              const product = getProduct(rule.product_id);
              const warehouse = getWarehouse(rule.warehouse_id);
              return (
                <tr key={rule.id}>
                  <td className="inv-table-name">{product?.name || rule.product_id}</td>
                  <td>{warehouse?.name || rule.warehouse_id}</td>
                  <td>{rule.min_stock.toLocaleString()}</td>
                  <td>{rule.reorder_level.toLocaleString()}</td>
                  <td>
                    <span className={`inv-badge ${rule.auto_reorder ? 'inv-badge-green' : 'inv-badge-gray'}`}>
                      {rule.auto_reorder ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>{rule.preferred_supplier}</td>
                  <td>{rule.lead_time_days} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
