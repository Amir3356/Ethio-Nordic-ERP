<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Published when a Goods Receipt Note records incoming stock
 * (Module 2, Step 1). Consumed by the Inventory module's
 * ProcessStockIn listener via the internal event queue.
 */
class StockInReceived
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $productId,
        public int $warehouseId,
        public string $batchNumber,
        public float $quantityReceived,
        public float $unitCost,
        public ?string $manufactureDate,
        public ?string $expiryDate,
        public ?int $supplierId,
        public ?string $receiptReference,
        public ?int $userId,
    ) {
    }
}
