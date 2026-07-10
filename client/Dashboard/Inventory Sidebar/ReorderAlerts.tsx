import { useMemo } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function ReorderAlerts({ inventory }: Props) {
  const { data, getProduct, getWarehouse, getLowStockProducts } = inventory;

  const lowStockProducts = useMemo(() => getLowStockProducts(), [getLowStockProducts]);

  const reorderRules = useMemo(() => {
    if (!data) return [];
    return data.reorder_rules;
  }, [data]);

  if (!data) return null;

  return (
    <section className="content-section" id="reorder">
      <div className="content-section-header">
        <h2>Reorder Alerts</h2>
      </div>

      <p className="content-description">
        Automated low-stock notifications when inventory falls below configured reorder thresholds.
      </p>

      {lowStockProducts.length > 0 && (
        <>
          <h3 className="inv-subsection-title">
            <AlertTriangle size={16} /> Active Alerts ({lowStockProducts.length})
          </h3>
          <div className="inv-alert-list">
            {lowStockProducts.map(({ product, totalStock, warehouseStocks }) => (
              <div key={product.product_id} className="inv-alert-card">
                <div className="inv-alert-header">
                  <span className="inv-alert-product">{product.product_name}</span>
                  <span className="inv-badge inv-badge-red">Low Stock</span>
                </div>
                <div className="inv-alert-details">
                  <span>Code: {product.product_code}</span>
                  <span>Current: {totalStock.toLocaleString()} {product.unit_of_measure}</span>
                </div>
                <div className="inv-alert-warehouses">
                  {warehouseStocks.map(({ warehouse, quantity }) => (
                    <span key={warehouse.warehouse_id} className="inv-alert-wh">
                      {warehouse.warehouse_name}: {quantity.toLocaleString()}
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

      <h3 className="inv-subsection-title">Reorder Rules Configuration</h3>
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Min Stock</th>
              <th>Reorder Point</th>
              <th>Reorder Qty</th>
              <th>Alerts</th>
              <th>Auto Purchase Request</th>
            </tr>
          </thead>
          <tbody>
            {reorderRules.map((rule) => {
              const product = getProduct(String(rule.product_id));
              const warehouse = getWarehouse(String(rule.warehouse_id));
              return (
                <tr key={rule.reorder_rule_id}>
                  <td className="inv-table-name">{product?.product_name || rule.product_id}</td>
                  <td>{warehouse?.warehouse_name || rule.warehouse_id}</td>
                  <td>{Number(rule.minimum_stock_level).toLocaleString()}</td>
                  <td>{Number(rule.reorder_point).toLocaleString()}</td>
                  <td>{Number(rule.reorder_quantity).toLocaleString()}</td>
                  <td>
                    <span className={`inv-badge ${rule.alert_enabled ? 'inv-badge-green' : 'inv-badge-gray'}`}>
                      {rule.alert_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <span className={`inv-badge ${rule.auto_purchase_request ? 'inv-badge-green' : 'inv-badge-gray'}`}>
                      {rule.auto_purchase_request ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {reorderRules.length === 0 && (
              <tr><td colSpan={7} className="inv-empty">No reorder rules configured</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
