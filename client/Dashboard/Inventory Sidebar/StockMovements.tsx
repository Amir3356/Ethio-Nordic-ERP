import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function StockMovements({ inventory }: Props) {
  const { data, getProduct, getWarehouse } = inventory;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const movements = useMemo(() => {
    if (!data) return [];
    let filtered = [...data.stock_ledger];
    if (typeFilter !== 'all') {
      filtered = filtered.filter((m) => m.movement_type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) => {
        const product = getProduct(String(m.product_id));
        return (
          (m.reference_type || '').toLowerCase().includes(q) ||
          m.movement_type.toLowerCase().includes(q) ||
          (product?.product_name || '').toLowerCase().includes(q) ||
          (product?.product_code || '').toLowerCase().includes(q)
        );
      });
    }
    return filtered.sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );
  }, [data, search, typeFilter, getProduct]);

  const getTypeBadge = (type: string) => {
    const cls =
      type === 'stock-in' ? 'inv-badge-green' :
      type === 'stock-out' ? 'inv-badge-red' :
      type === 'transfer-in' || type === 'transfer-out' ? 'inv-badge-blue' :
      'inv-badge-amber';
    return <span className={`inv-badge ${cls}`}>{type.replace('-', ' ')}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="movements">
      <div className="content-section-header">
        <h2>Stock Movements</h2>
      </div>

      <div className="inv-toolbar">
        <div className="inv-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by reference type, product, movement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="inv-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="stock-in">Stock In</option>
          <option value="stock-out">Stock Out</option>
          <option value="transfer-in">Transfer In</option>
          <option value="transfer-out">Transfer Out</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Quantity</th>
              <th>Balance After</th>
              <th>Reference Type</th>
              <th>By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const product = getProduct(String(m.product_id));
              const warehouse = getWarehouse(String(m.warehouse_id));
              return (
                <tr key={m.ledger_id}>
                  <td className="inv-table-name">{m.ledger_id}</td>
                  <td>{getTypeBadge(m.movement_type)}</td>
                  <td>{product?.product_name || m.product_id}</td>
                  <td>{warehouse?.warehouse_name || m.warehouse_id}</td>
                  <td className={Number(m.quantity) < 0 ? 'inv-text-red' : 'inv-text-green'}>
                    {Number(m.quantity) > 0 ? '+' : ''}{Number(m.quantity).toLocaleString()}
                  </td>
                  <td>{Number(m.balance_after).toLocaleString()}</td>
                  <td>{m.reference_type || '—'}</td>
                  <td>{m.created_by ?? '—'}</td>
                  <td>{new Date(m.transaction_date).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {movements.length === 0 && (
              <tr><td colSpan={9} className="inv-empty">No movements found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
