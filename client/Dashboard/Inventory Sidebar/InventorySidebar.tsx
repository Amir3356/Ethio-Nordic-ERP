import { useInventory } from './hooks';
import InventoryOverview from './InventoryOverview';
import GoodsReceipt from './GoodsReceipt';
import StockLedger from './StockLedger';
import ReorderMonitoring from './ReorderMonitoring';
import ExpiryMonitor from './ExpiryMonitor';
import StockIssuance from './StockIssuance';
import DamagedGoodsAdjustments from './DamagedGoodsAdjustments';
import CycleCounting from './CycleCounting';
import InventoryValuation from './InventoryValuation';
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
      <InventoryOverview inventory={inventory} />
      <GoodsReceipt inventory={inventory} />
      <StockLedger inventory={inventory} />
      <ReorderMonitoring inventory={inventory} />
      <ExpiryMonitor inventory={inventory} />
      <StockIssuance inventory={inventory} />
      <DamagedGoodsAdjustments inventory={inventory} />
      <CycleCounting inventory={inventory} />
      <InventoryValuation inventory={inventory} />
    </>
  );
}
