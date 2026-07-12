<?php

namespace App\Console\Commands;

use App\Services\Finance\FinanceService;
use Illuminate\Console\Command;

/**
 * Module 3, Step 8: automatically calculates and posts monthly
 * depreciation journal entries for all active fixed assets.
 */
class PostMonthlyDepreciation extends Command
{
    protected $signature = 'finance:post-depreciation';

    protected $description = 'Calculate and post monthly depreciation for all active fixed assets';

    public function handle(FinanceService $finance): int
    {
        $result = $finance->postMonthlyDepreciation();

        $this->info("Depreciation posted for {$result['assets']} asset(s), total ETB {$result['amount']}.");

        return self::SUCCESS;
    }
}
