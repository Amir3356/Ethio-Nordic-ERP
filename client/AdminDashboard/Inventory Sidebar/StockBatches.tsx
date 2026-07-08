import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function StockBatches({ inventory }: Props) {
  const { data, getProduct, getWarehouse } = inventory;
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  const batches = useMemo(() => {
    if (!data) return [];
    let filtered = data.stock_batches.filter((b) => b.status === 'active');
    if (warehouseFilter !== 'all') {
      filtered = filtered.filter((b) => b.warehouse_id === warehouseFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((b) => {
        const product = getProduct(b.product_id);
        const warehouse = getWarehouse(b.warehouse_id);
        return (
          b.batch_no.toLowerCase().includes(q) ||
          (product?.name || '').toLowerCase().includes(q) ||
          (product?.sku || '').toLowerCase().includes(q) ||
          (warehouse?.name || '').toLowerCase().includes(q)
        );
      });
    }
    return filtered;
  }, [data, search, warehouseFilter, getProduct, getWarehouse]);

  if (!data) return null;

  return (
    <section className="content-section" id="batches">
      <div className="content-section-header">
        <h2>Stock Batches</h2>
      </div>

      <div className="inv-toolbar">
        <div className="inv-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by batch, product, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="inv-filter-select"
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
        >
          <option value="all">All Warehouses</option>
          {data.warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Batch No</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Mfg Date</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const product = getProduct(batch.product_id);
              const warehouse = getWarehouse(batch.warehouse_id);
              return (
                <tr key={batch.id}>
                  <td className="inv-table-name">{batch.batch_no}</td>
                  <td>{product?.name || batch.product_id}</td>
                  <td>{warehouse?.name || batch.warehouse_id}</td>
                  <td>{batch.quantity.toLocaleString()}</td>
                  <td>${batch.unit_cost.toFixed(2)}</td>
                  <td>${(batch.quantity * batch.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{batch.manufacture_date}</td>
                  <td>{batch.expiry_date}</td>
                </tr>
              );
            })}
            {batches.length === 0 && (
              <tr><td colSpan={8} className="inv-empty">No batches found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
