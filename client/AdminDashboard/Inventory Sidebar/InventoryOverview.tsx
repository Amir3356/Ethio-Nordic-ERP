import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, DollarSign, Package, BarChart3, ShieldCheck } from 'lucide-react';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function InventoryOverview({ inventory }: Props) {
  const { data, getInventoryValue, getLowStockProducts, getExpiringBatches } = inventory;

  const stats = useMemo(() => {
    if (!data) return null;
    const totalProducts = data.products.length;
    const totalBatches = data.stock_batches.filter((b) => b.status === 'active').length;
    const totalUnits = data.stock_batches
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + b.quantity, 0);
    const totalValue = getInventoryValue();
    const lowStockCount = getLowStockProducts().length;
    const expiringCount = getExpiringBatches(90).length;
    const pendingAdjustments = data.stock_adjustments.filter((a) => a.status === 'pending').length;
    const totalWarehouses = data.warehouses.length;
    const recentMovements = data.stock_ledger.length;
    return { totalProducts, totalBatches, totalUnits, totalValue, lowStockCount, expiringCount, pendingAdjustments, totalWarehouses, recentMovements };
  }, [data, getInventoryValue, getLowStockProducts, getExpiringBatches]);

  if (!stats) return null;

  return (
    <section className="content-section" id="overview">
      <div className="content-section-header">
        <h2>Inventory Overview</h2>
      </div>

      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-blue"><Package size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">{stats.totalProducts}</span>
            <span className="inv-stat-label">Products</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-green"><BarChart3 size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">{stats.totalBatches}</span>
            <span className="inv-stat-label">Active Batches</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-purple"><TrendingUp size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">{stats.totalUnits.toLocaleString()}</span>
            <span className="inv-stat-label">Total Units</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-amber"><DollarSign size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="inv-stat-label">Inventory Value</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-red"><AlertTriangle size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">{stats.lowStockCount}</span>
            <span className="inv-stat-label">Low Stock Alerts</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-orange"><Clock size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">{stats.expiringCount}</span>
            <span className="inv-stat-label">Expiring Soon</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-teal"><ShieldCheck size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">{stats.pendingAdjustments}</span>
            <span className="inv-stat-label">Pending Adjustments</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-stat-icon-indigo"><TrendingDown size={20} /></div>
          <div className="inv-stat-body">
            <span className="inv-stat-value">{stats.recentMovements}</span>
            <span className="inv-stat-label">Total Movements</span>
          </div>
        </div>
      </div>

      <h3 className="inv-subsection-title">Warehouse Summary</h3>
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>City</th>
              <th>Manager</th>
              <th>Capacity (sqm)</th>
              <th>Active Batches</th>
            </tr>
          </thead>
          <tbody>
            {data!.warehouses.map((wh) => {
              const batchCount = data!.stock_batches.filter(
                (b) => b.warehouse_id === wh.id && b.status === 'active'
              ).length;
              return (
                <tr key={wh.id}>
                  <td className="inv-table-name">{wh.name}</td>
                  <td>{wh.city}</td>
                  <td>{wh.manager}</td>
                  <td>{wh.capacity_sqm.toLocaleString()}</td>
                  <td>{batchCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
