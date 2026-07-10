<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\StockBatch;
use App\Models\StockLedger;
use App\Models\ReorderRule;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $warehouses = [
            Warehouse::create(['name' => 'Addis Ababa Central', 'code' => 'WH-AA-01', 'city' => 'Addis Ababa', 'capacity_sqm' => 5000, 'manager' => 'Abebe Kebede']),
            Warehouse::create(['name' => 'Dire Dawa Hub', 'code' => 'WH-DD-01', 'city' => 'Dire Dawa', 'capacity_sqm' => 3000, 'manager' => 'Fatima Ahmed']),
            Warehouse::create(['name' => 'Bahir Dar Storage', 'code' => 'WH-BD-01', 'city' => 'Bahir Dar', 'capacity_sqm' => 2500, 'manager' => 'Dawit Tesfaye']),
            Warehouse::create(['name' => 'Hawassa Distribution', 'code' => 'WH-HW-01', 'city' => 'Hawassa', 'capacity_sqm' => 2000, 'manager' => 'Sara Mulugeta']),
        ];

        $products = [
            Product::create(['sku' => 'PH-AMX-001', 'name' => 'Amoxicillin 500mg', 'category' => 'Pharmaceuticals', 'unit' => 'caps', 'min_stock' => 5000, 'reorder_level' => 8000, 'fifo_fefo' => 'FEFO']),
            Product::create(['sku' => 'PH-MET-002', 'name' => 'Metformin 850mg', 'category' => 'Pharmaceuticals', 'unit' => 'tabs', 'min_stock' => 3000, 'reorder_level' => 5000, 'fifo_fefo' => 'FEFO']),
            Product::create(['sku' => 'PH-CEF-003', 'name' => 'Ceftriaxone 1g', 'category' => 'Pharmaceuticals', 'unit' => 'vials', 'min_stock' => 1000, 'reorder_level' => 2000, 'fifo_fefo' => 'FEFO']),
            Product::create(['sku' => 'PH-IBU-004', 'name' => 'Ibuprofen 400mg', 'category' => 'Pharmaceuticals', 'unit' => 'tabs', 'min_stock' => 10000, 'reorder_level' => 15000, 'fifo_fefo' => 'FIFO']),
            Product::create(['sku' => 'MS-SAN-005', 'name' => 'Sanitizing Wipes', 'category' => 'Medical Supplies', 'unit' => 'packs', 'min_stock' => 2000, 'reorder_level' => 3000, 'fifo_fefo' => 'FIFO']),
            Product::create(['sku' => 'MS-GLV-006', 'name' => 'Nitrile Gloves (L)', 'category' => 'Medical Supplies', 'unit' => 'boxes', 'min_stock' => 500, 'reorder_level' => 800, 'fifo_fefo' => 'FIFO']),
            Product::create(['sku' => 'MS-MAS-007', 'name' => 'Surgical Masks', 'category' => 'Medical Supplies', 'unit' => 'boxes', 'min_stock' => 1000, 'reorder_level' => 1500, 'fifo_fefo' => 'FIFO']),
            Product::create(['sku' => 'EQ-THE-008', 'name' => 'Digital Thermometer', 'category' => 'Equipment', 'unit' => 'pcs', 'min_stock' => 100, 'reorder_level' => 200, 'fifo_fefo' => 'FIFO']),
            Product::create(['sku' => 'PH-PARA-009', 'name' => 'Paracetamol 500mg', 'category' => 'Pharmaceuticals', 'unit' => 'tabs', 'min_stock' => 20000, 'reorder_level' => 30000, 'fifo_fefo' => 'FIFO']),
            Product::create(['sku' => 'MS-ALC-010', 'name' => 'Hand Sanitizer 500ml', 'category' => 'Medical Supplies', 'unit' => 'bottles', 'min_stock' => 1500, 'reorder_level' => 2500, 'fifo_fefo' => 'FIFO']),
        ];

        $batches = [];
        $batchNo = 1;
        foreach ($products as $product) {
            foreach ($warehouses as $warehouse) {
                if (rand(1, 100) > 30) {
                    $qty = rand(100, 5000);
                    $cost = round(rand(50, 500) / 10, 2);
                    $mfg = now()->subMonths(rand(1, 6));
                    $exp = $mfg->copy()->addMonths(rand(12, 36));

                    $batches[] = StockBatch::create([
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'batch_no' => sprintf('B%04d', $batchNo++),
                        'quantity' => $qty,
                        'unit_cost' => $cost,
                        'manufacture_date' => $mfg,
                        'expiry_date' => $exp,
                        'received_date' => now()->subDays(rand(1, 90)),
                        'status' => 'active',
                    ]);
                }
            }
        }

        $users = ['Abebe Kebede', 'Fatima Ahmed', 'Dawit Tesfaye', 'Sara Mulugeta', 'Admin'];
        $types = ['stock-in', 'stock-out', 'transfer-in', 'transfer-out', 'adjustment'];

        foreach ($batches as $batch) {
            StockLedger::create([
                'product_id' => $batch->product_id,
                'warehouse_id' => $batch->warehouse_id,
                'batch_id' => $batch->id,
                'type' => 'stock-in',
                'quantity' => $batch->quantity,
                'unit_cost' => $batch->unit_cost,
                'reference' => 'GRN-' . $batch->batch_no,
                'reference_type' => 'goods_receipt',
                'created_by' => $users[array_rand($users)],
                'notes' => 'Initial goods receipt',
                'created_at' => $batch->received_date,
            ]);

            if (rand(1, 100) > 60) {
                $outQty = rand(10, min(100, (int)$batch->quantity));
                StockLedger::create([
                    'product_id' => $batch->product_id,
                    'warehouse_id' => $batch->warehouse_id,
                    'batch_id' => $batch->id,
                    'type' => 'stock-out',
                    'quantity' => -$outQty,
                    'unit_cost' => $batch->unit_cost,
                    'reference' => 'SO-' . rand(1000, 9999),
                    'reference_type' => 'sales_order',
                    'created_by' => $users[array_rand($users)],
                    'notes' => 'Sales order fulfillment',
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }

        $suppliers = ['MedPharm Ethiopia', 'Nordic Health Supply', 'East Africa Pharma'];
        foreach (array_slice($products, 0, 5) as $product) {
            $wh = $warehouses[array_rand($warehouses)];
            ReorderRule::create([
                'product_id' => $product->id,
                'warehouse_id' => $wh->id,
                'min_stock' => $product->min_stock,
                'reorder_level' => $product->reorder_level,
                'auto_reorder' => rand(0, 1),
                'preferred_supplier' => $suppliers[array_rand($suppliers)],
                'lead_time_days' => rand(7, 30),
            ]);
        }

        if (isset($this->command)) {
            $this->command->info("Inventory seeded: " . count($products) . " products, " . count($warehouses) . " warehouses, " . count($batches) . " batches");
        }
    }
}
