<?php

namespace App\Listeners;

use App\Events\StockWrittenOff;
use App\Models\ChartOfAccount;
use App\Services\Finance\FinanceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Module 3 integration: an approved damaged-goods disposition posts its
 * financial impact (write-off) to the general ledger (Module 2, Step 6).
 */
class PostInventoryWriteOff implements ShouldQueue
{
    public function __construct(private readonly FinanceService $finance)
    {
    }

    public function handle(StockWrittenOff $event): void
    {
        if ($event->writeOffValue <= 0 || !ChartOfAccount::whereKey('COA-1210')->exists()) {
            Log::warning('Inventory write-off journal skipped.', ['damaged_goods_id' => $event->damagedGoodsId]);
            return;
        }

        try {
            $this->finance->postEntry([
                'date' => now()->toDateString(),
                'description' => "Damaged goods write-off - {$event->productName} (DG-{$event->damagedGoodsId})",
                'source_module' => 'Inventory',
                'reference' => 'DG-' . $event->damagedGoodsId,
                'created_by' => 'System',
                'approved_by' => 'Finance Manager',
            ], [
                ['account_id' => 'COA-5010', 'debit' => $event->writeOffValue, 'credit' => 0, 'description' => 'Inventory write-off expense'],
                ['account_id' => 'COA-1210', 'debit' => 0, 'credit' => $event->writeOffValue, 'description' => 'Reduce inventory - damaged stock'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to post inventory write-off journal', ['id' => $event->damagedGoodsId, 'error' => $e->getMessage()]);
        }
    }
}
