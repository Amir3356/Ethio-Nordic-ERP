<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Published by HR when a payroll run is disbursed (Module 4, Step 5).
 * Consumed by Finance to post the consolidated payroll journal entry
 * (Module 3, Step 2 — automated sub-ledger postings).
 */
class PayrollDisbursed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $payrollRunId,
        public string $payPeriod,
        public float $totalGross,
        public float $totalIncomeTax,
        public float $totalPensionEmployee,
        public float $totalNet,
    ) {
    }
}
