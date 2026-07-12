import { useMemo } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function ReorderMonitoring({ inventory }: Props) {
  const { data, getProduct, getWarehouse, getLowStockAlerts } = inventory;

  const lowStockAlerts = useMemo(() => getLowStockAlerts(), [getLowStockAlerts]);

  const reorderRules = useMemo(() => {
    if (!data) return [];
    return data.reorder_rules;
  }, [data]);

  if (!data) return null;

  return (
    <section className="content-section" id="reorder-monitoring">
      <div className="content-section-header">
        <h2>Step 3: Reorder Level Monitoring</h2>
      </div>

      <p className="content-description">
        A background scheduled job continuously compares current stock levels against configured
        minimum stock and reorder thresholds per SKU. When stock falls below the reorder point,
        the system automatically generates a low-stock alert and, where configured, a draft
        Purchase Request routed to the Procurement module.
      </p>

      {lowStockAlerts.length > 0 && (
        <>
          <h3 className="inv-subsection-title">
            <AlertTriangle size={16} /> Active Alerts ({lowStockAlerts.length})
          </h3>
          <div className="inv-alert-list">
            {lowStockAlerts.map(({ rule, product, warehouse, currentStock }) => (
              <div key={rule.reorder_rule_id} className="inv-alert-card">
                <div className="inv-alert-header">
                  <span className="inv-alert-product">{product.product_name}</span>
                  <span className="inv-badge inv-badge-red">Low Stock</span>
                </div>
                <div className="inv-alert-details">
                  <span>Code: {product.product_code}</span>
                  <span>Current: {currentStock.toLocaleString()} {product.unit_of_measure}</span>
                  <span>Reorder Point: {Number(rule.reorder_point).toLocaleString()}</span>
                  <span>Min Stock: {Number(rule.minimum_stock_level).toLocaleString()}</span>
                </div>
                <div className="inv-alert-warehouses">
                  <span className="inv-alert-wh">
                    {warehouse.warehouse_name}: {currentStock.toLocaleString()}
                  </span>
                  {rule.auto_purchase_request && (
                    <span className="inv-badge inv-badge-blue">Draft Purchase Request → Procurement</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lowStockAlerts.length === 0 && (
        <div className="inv-alert-ok">
          <CheckCircle size={16} /> All products are above reorder levels.
        </div>
      )}

      <h3 className="inv-subsection-title">Reorder Rules Configuration</h3>
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Min Stock Level</th>
              <th>Reorder Point</th>
              <th>Reorder Quantity</th>
              <th>Alert Enabled</th>
              <th>Auto Purchase Request</th>
            </tr>
          </thead>
          <tbody>
            {reorderRules.map((rule) => {
              const product = getProduct(String(rule.product_id));
              const warehouse = getWarehouse(String(rule.warehouse_id));
              return (
                <tr key={rule.reorder_rule_id}>
                  <td className="inv-table-name">{rule.reorder_rule_id}</td>
                  <td>{product?.product_name || rule.product_id}</td>
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
              <tr><td colSpan={8} className="inv-empty">No reorder rules configured</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
