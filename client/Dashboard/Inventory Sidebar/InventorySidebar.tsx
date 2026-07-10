import { useInventory } from './hooks';
import ProductManagement from './ProductManagement';
import WarehouseManagement from './WarehouseManagement';
import StockBatches from './StockBatches';
import StockMovements from './StockMovements';
import StockAdjustments from './StockAdjustments';
import StockTransfers from './StockTransfers';
import ReorderAlerts from './ReorderAlerts';
import DamagedGoods from './DamagedGoods';
import ExpiryMonitor from './ExpiryMonitor';
import InventoryValuation from './InventoryValuation';
import CycleCounts from './CycleCounts';
import InventoryReports from './InventoryReports';
import './InventorySidebar.css';

export default function InventorySidebar() {
  const inventory = useInventory();

  if (inventory.loading) {
    return <p className="content-loading">Loading inventory data...</p>;
  }

  if (inventory.error) {
    return (
      <div className="content-error">
        <p>{inventory.error}</p>
        <button onClick={() => inventory.refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <ProductManagement inventory={inventory} />
      <WarehouseManagement inventory={inventory} />
      <StockBatches inventory={inventory} />
      <StockMovements inventory={inventory} />
      <StockTransfers inventory={inventory} />
      <StockAdjustments inventory={inventory} />
      <ReorderAlerts inventory={inventory} />
      <DamagedGoods inventory={inventory} />
      <ExpiryMonitor inventory={inventory} />
      <CycleCounts inventory={inventory} />
      <InventoryValuation inventory={inventory} />
      <InventoryReports inventory={inventory} />
    </>
  );
}
