export interface Product {
  product_id: number | string;
  product_code: string;
  product_name: string;
  description: string | null;
  category_id: number | string | null;
  unit_of_measure: string;
  requires_batch_tracking: boolean;
  requires_expiry_tracking: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Warehouse {
  warehouse_id: number | string;
  warehouse_code: string;
  warehouse_name: string;
  location: string;
  warehouse_type: string;
  capacity: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockBatch {
  batch_id: number | string;
  product_id: number | string;
  warehouse_id: number | string;
  batch_number: string;
  quantity_received: number;
  available_quantity: number;
  unit_cost: number;
  manufacture_date: string | null;
  expiry_date: string | null;
  supplier_id: number | string | null;
  receipt_reference: string | null;
  batch_status: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockLedgerEntry {
  ledger_id: number | string;
  product_id: number | string;
  warehouse_id: number | string;
  batch_id: number | string;
  movement_type: string;
  quantity: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: number | string | null;
  notes?: string | null;
  transaction_date: string;
  created_by: number | string | null;
}

export interface StockAdjustment {
  adjustment_id: number | string;
  product_id: number | string;
  warehouse_id: number | string;
  batch_id: number | string;
  adjustment_type: string;
  quantity: number;
  reason_code: string | null;
  description: string | null;
  supporting_document: string | null;
  status: string;
  requested_by: number | string | null;
  approved_by: number | string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ReorderRule {
  reorder_rule_id: number | string;
  product_id: number | string;
  warehouse_id: number | string;
  minimum_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  alert_enabled: boolean;
  auto_purchase_request: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DamagedGood {
  damaged_goods_id: number | string;
  product_id: number | string;
  warehouse_id: number | string;
  batch_id: number | string;
  quantity: number;
  damage_reason: string;
  reported_by: number | string | null;
  supporting_photos: string | null;
  disposition_status: string;
  approved_by: number | string | null;
  disposal_date: string | null;
  created_at: string;
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
