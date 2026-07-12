<?php

namespace App\Console\Commands;

use App\Models\StockBatch;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Module 2, Step 4: daily batch expiry monitoring. Flags batches past
 * their expiry date and raises escalating alerts at the 90/60/30-day
 * thresholds for warehouse and regulatory teams.
 */
class MonitorBatchExpiry extends Command
{
    protected $signature = 'inventory:monitor-batch-expiry';

    protected $description = 'Flag expired batches and raise escalating expiry alerts (90/60/30 days)';

    private const THRESHOLDS = [90, 60, 30];

    public function handle(): int
    {
        // Flag batches whose expiry date has passed so FEFO allocation skips them.
        $expiredCount = StockBatch::where('batch_status', 'available')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', now()->startOfDay())
            ->update(['batch_status' => 'expired']);

        $alerts = [];

        $batches = StockBatch::with(['product', 'warehouse'])
            ->where('batch_status', 'available')
            ->where('available_quantity', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now(), now()->addDays(max(self::THRESHOLDS))])
            ->orderBy('expiry_date')
            ->get();

        foreach ($batches as $batch) {
            $daysLeft = (int) now()->startOfDay()->diffInDays($batch->expiry_date, false);
            $tier = collect(self::THRESHOLDS)->first(fn ($t) => $daysLeft <= $t);

            $alert = [
                'batch_number' => $batch->batch_number,
                'product' => $batch->product?->product_name,
                'warehouse' => $batch->warehouse?->warehouse_name,
                'expiry_date' => $batch->expiry_date?->toDateString(),
                'days_left' => $daysLeft,
                'quantity' => (float) $batch->available_quantity,
                'alert_tier' => $tier . '-day',
            ];
            $alerts[] = $alert;

            Log::channel('stack')->warning('Batch expiry alert', $alert);
        }

        Cache::put('inventory:expiry-alerts', [
            'generated_at' => now()->toIso8601String(),
            'expired_batches_flagged' => $expiredCount,
            'alerts' => $alerts,
        ], now()->addDay());

        $this->info("{$expiredCount} batch(es) flagged expired, " . count($alerts) . ' expiry alert(s) generated.');

        return self::SUCCESS;
    }
}
