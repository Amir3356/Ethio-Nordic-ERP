import { useMemo } from 'react';
import { DollarSign } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function InventoryValuation({ inventory }: Props) {
  const { data, getInventoryValue } = inventory;

  const valuationByProduct = useMemo(() => {
    if (!data) return [];
    return data.products.map((product) => {
      const batches = data.stock_batches.filter(
        (b) => String(b.product_id) === String(product.product_id)
      );
      const totalQuantity = batches.reduce((sum, b) => sum + Number(b.available_quantity), 0);
      const totalValue = batches.reduce(
        (sum, b) => sum + Number(b.available_quantity) * Number(b.unit_cost),
        0
      );
      const avgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
      return { product, totalQuantity, totalValue, avgCost, batchCount: batches.length };
    }).filter((v) => v.totalQuantity > 0);
  }, [data]);

  const valuationByWarehouse = useMemo(() => {
    if (!data) return [];
    return data.warehouses.map((warehouse) => {
      const batches = data.stock_batches.filter(
        (b) => String(b.warehouse_id) === String(warehouse.warehouse_id)
      );
      const totalQuantity = batches.reduce((sum, b) => sum + Number(b.available_quantity), 0);
      const totalValue = batches.reduce(
        (sum, b) => sum + Number(b.available_quantity) * Number(b.unit_cost),
        0
      );
      return { warehouse, totalQuantity, totalValue, batchCount: batches.length };
    });
  }, [data]);

  const totalValue = getInventoryValue();

  if (!data) return null;

  return (
    <section className="content-section" id="valuation">
      <div className="content-section-header">
        <h2>Inventory Valuation</h2>
      </div>

      <p className="content-description">
        FIFO/FEFO-based costing for financial reporting. Cost-of-goods-sold is matched to specific batches consumed.
      </p>

      <div className="inv-valuation-total">
        <DollarSign size={24} />
        <div>
          <span className="inv-valuation-total-value">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="inv-valuation-total-label">Total Inventory Value</span>
        </div>
      </div>

      <h3 className="inv-subsection-title">Valuation by Product</h3>
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Code</th>
              <th>UoM</th>
              <th>Batch Tracking</th>
              <th>Batches</th>
              <th>Total Qty</th>
              <th>Avg Unit Cost</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {valuationByProduct
              .sort((a, b) => b.totalValue - a.totalValue)
              .map(({ product, totalQuantity, totalValue, avgCost, batchCount }) => (
                <tr key={product.product_id}>
                  <td className="inv-table-name">{product.product_name}</td>
                  <td>{product.product_code}</td>
                  <td>{product.unit_of_measure}</td>
                  <td>
                    <span className={`inv-badge ${product.requires_batch_tracking ? 'inv-badge-green' : 'inv-badge-gray'}`}>
                      {product.requires_batch_tracking ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{batchCount}</td>
                  <td>{totalQuantity.toLocaleString()}</td>
                  <td>${avgCost.toFixed(2)}</td>
                  <td className="inv-text-bold">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h3 className="inv-subsection-title">Valuation by Warehouse</h3>
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Location</th>
              <th>Type</th>
              <th>Batches</th>
              <th>Total Qty</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {valuationByWarehouse
              .sort((a, b) => b.totalValue - a.totalValue)
              .map(({ warehouse, totalQuantity, totalValue, batchCount }) => (
                <tr key={warehouse.warehouse_id}>
                  <td className="inv-table-name">{warehouse.warehouse_name}</td>
                  <td>{warehouse.location}</td>
                  <td>{warehouse.warehouse_type}</td>
                  <td>{batchCount}</td>
                  <td>{totalQuantity.toLocaleString()}</td>
                  <td className="inv-text-bold">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
