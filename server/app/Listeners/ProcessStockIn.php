<?php

namespace App\Listeners;

use App\Events\StockInReceived;
use App\Models\StockBatch;
use App\Models\StockLedger;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;

/**
 * Consumes the stock-in event (Module 2, Step 2): creates a new batch
 * record or increments an existing one, then appends the stock ledger
 * entry. Runs inside a transaction with a row lock so concurrent
 * receipts for the same batch cannot race.
 */
class ProcessStockIn implements ShouldQueue
{
    public function handle(StockInReceived $event): void
    {
        DB::transaction(function () use ($event) {
            $batch = StockBatch::where('product_id', $event->productId)
                ->where('warehouse_id', $event->warehouseId)
                ->where('batch_number', $event->batchNumber)
                ->lockForUpdate()
                ->first();

            if ($batch) {
                $batch->update([
                    'quantity_received' => (float) $batch->quantity_received + $event->quantityReceived,
                    'available_quantity' => (float) $batch->available_quantity + $event->quantityReceived,
                    'unit_cost' => $event->unitCost,
                    'manufacture_date' => $event->manufactureDate ?? $batch->manufacture_date,
                    'expiry_date' => $event->expiryDate ?? $batch->expiry_date,
                    'batch_status' => 'available',
                ]);
                $batch->refresh();
            } else {
                $batch = StockBatch::create([
                    'product_id' => $event->productId,
                    'warehouse_id' => $event->warehouseId,
                    'batch_number' => $event->batchNumber,
                    'quantity_received' => $event->quantityReceived,
                    'available_quantity' => $event->quantityReceived,
                    'unit_cost' => $event->unitCost,
                    'manufacture_date' => $event->manufactureDate,
                    'expiry_date' => $event->expiryDate,
                    'supplier_id' => $event->supplierId,
                    'receipt_reference' => $event->receiptReference,
                    'batch_status' => 'available',
                ]);
            }

            StockLedger::create([
                'product_id' => $batch->product_id,
                'warehouse_id' => $batch->warehouse_id,
                'batch_id' => $batch->batch_id,
                'movement_type' => 'stock-in',
                'quantity' => $event->quantityReceived,
                'balance_after' => $batch->available_quantity,
                'reference_type' => 'goods_receipt',
                'reference_id' => null,
                'notes' => $event->receiptReference ? 'GRN: ' . $event->receiptReference : null,
                'transaction_date' => now(),
                'created_by' => $event->userId,
            ]);
        });
    }
}
