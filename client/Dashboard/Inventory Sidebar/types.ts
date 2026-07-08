export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
  reorder_level: number;
  fifo_fefo: 'FIFO' | 'FEFO';
  is_active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  capacity_sqm: number;
  manager: string;
}

export interface StockBatch {
  id: string;
  product_id: string;
  warehouse_id: string;
  batch_no: string;
  quantity: number;
  unit_cost: number;
  manufacture_date: string;
  expiry_date: string;
  received_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'depleted';
}

export interface StockLedgerEntry {
  id: string;
  product_id: string;
  warehouse_id: string;
  batch_id: string;
  type: 'stock-in' | 'stock-out' | 'transfer-in' | 'transfer-out' | 'adjustment';
  quantity: number;
  unit_cost: number;
  reference: string;
  reference_type: string;
  created_by: string;
  created_at: string;
  notes: string;
}

export interface StockAdjustment {
  id: string;
  product_id: string;
  warehouse_id: string;
  batch_id: string;
  quantity_before: number;
  quantity_after: number;
  adjustment_qty: number;
  reason: string;
  reason_code: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  approved_by: string | null;
  requested_at: string;
  approved_at: string | null;
  financial_impact: number | null;
}

export interface ReorderRule {
  id: string;
  product_id: string;
  warehouse_id: string;
  min_stock: number;
  reorder_level: number;
  auto_reorder: boolean;
  preferred_supplier: string;
  lead_time_days: number;
}

export interface DamagedGood {
  id: string;
  product_id: string;
  warehouse_id: string;
  batch_id: string;
  quantity: number;
  damage_type: string;
  description: string;
  photos: string[];
  status: string;
  reported_by: string;
  reported_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  write_off_amount: number | null;
}

export interface InventoryData {
  products: Product[];
  warehouses: Warehouse[];
  stock_batches: StockBatch[];
  stock_ledger: StockLedgerEntry[];
  stock_adjustments: StockAdjustment[];
  reorder_rules: ReorderRule[];
  damaged_goods: DamagedGood[];
}
