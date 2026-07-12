<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Published by Inventory when a damaged-goods write-off is approved
 * (Module 2, Step 6). Consumed by Finance to post the write-off
 * journal entry (Module 3 — inventory write-off postings).
 */
class StockWrittenOff
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $damagedGoodsId,
        public string $productName,
        public float $quantity,
        public float $writeOffValue,
    ) {
    }
}
