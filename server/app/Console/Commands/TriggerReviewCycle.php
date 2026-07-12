<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\PerformanceReview;
use Illuminate\Console\Command;

/**
 * Module 4, Step 6: at defined intervals (semi-annual), the system
 * triggers performance review workflows by opening a draft review
 * for every active employee.
 */
class TriggerReviewCycle extends Command
{
    protected $signature = 'hr:trigger-review-cycle';

    protected $description = 'Open draft performance reviews for all active employees (semi-annual cycle)';

    public function handle(): int
    {
        $period = now()->year . '-H' . (now()->month <= 6 ? '1' : '2');
        $created = 0;

        Employee::where('employment_status', 'active')->each(function (Employee $emp) use ($period, &$created) {
            $exists = PerformanceReview::where('employee_id', $emp->employee_id)
                ->where('review_period', $period)
                ->exists();

            if (!$exists) {
                PerformanceReview::create([
                    'employee_id' => $emp->employee_id,
                    'review_period' => $period,
                    'reviewer_id' => $emp->manager_id,
                    'status' => 'draft',
                ]);
                $created++;
            }
        });

        $this->info("{$created} draft review(s) opened for period {$period}.");

        return self::SUCCESS;
    }
}
