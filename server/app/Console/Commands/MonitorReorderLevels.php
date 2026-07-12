<?php

namespace App\Console\Commands;

use App\Models\ReorderRule;
use App\Models\StockBatch;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Module 2, Step 3: background job comparing current stock levels against
 * configured minimum stock and reorder thresholds per SKU. Generates
 * low-stock alerts when stock falls below the reorder point.
 */
class MonitorReorderLevels extends Command
{
    protected $signature = 'inventory:monitor-reorder-levels';

    protected $description = 'Compare stock levels against reorder rules and generate low-stock alerts';

    public function handle(): int
    {
        $alerts = [];

        ReorderRule::with(['product', 'warehouse'])
            ->where('alert_enabled', true)
            ->get()
            ->each(function (ReorderRule $rule) use (&$alerts) {
                $currentStock = (float) StockBatch::where('product_id', $rule->product_id)
                    ->where('warehouse_id', $rule->warehouse_id)
                    ->where('batch_status', 'available')
                    ->sum('available_quantity');

                if ($currentStock <= (float) $rule->reorder_point) {
                    $alert = [
                        'product' => $rule->product?->product_name,
                        'warehouse' => $rule->warehouse?->warehouse_name,
                        'current_stock' => $currentStock,
                        'reorder_point' => (float) $rule->reorder_point,
                        'reorder_quantity' => (float) $rule->reorder_quantity,
                        'below_minimum' => $currentStock <= (float) $rule->minimum_stock_level,
                    ];
                    $alerts[] = $alert;

                    Log::channel('stack')->warning('Low-stock alert', $alert);
                }
            });

        Cache::put('inventory:reorder-alerts', [
            'generated_at' => now()->toIso8601String(),
            'alerts' => $alerts,
        ], now()->addDay());

        $this->info(count($alerts) . ' low-stock alert(s) generated.');

        return self::SUCCESS;
    }
}
