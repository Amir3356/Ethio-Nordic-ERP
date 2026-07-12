<?php

namespace App\Listeners;

use App\Events\PayrollDisbursed;
use App\Models\ChartOfAccount;
use App\Services\Finance\FinanceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Module 3, Step 2: a completed payroll run posts salary expense and
 * statutory liability entries to the general ledger.
 */
class PostPayrollJournal implements ShouldQueue
{
    public function __construct(private readonly FinanceService $finance)
    {
    }

    public function handle(PayrollDisbursed $event): void
    {
        if (!ChartOfAccount::whereKey('COA-6010')->exists()) {
            Log::warning('Payroll journal skipped: chart of accounts not configured.');
            return;
        }

        try {
            $this->finance->postEntry([
                'date' => now()->toDateString(),
                'description' => "{$event->payPeriod} payroll processing",
                'source_module' => 'HR',
                'reference' => 'PAY-' . $event->payPeriod,
                'created_by' => 'System',
                'approved_by' => 'Auto-approved',
            ], [
                ['account_id' => 'COA-6010', 'debit' => $event->totalGross, 'credit' => 0, 'description' => 'Salaries expense'],
                ['account_id' => 'COA-2210', 'debit' => 0, 'credit' => $event->totalPensionEmployee, 'description' => 'Pension fund deduction (NBE)'],
                ['account_id' => 'COA-2130', 'debit' => 0, 'credit' => $event->totalIncomeTax, 'description' => 'Income tax withholding'],
                ['account_id' => 'COA-2220', 'debit' => 0, 'credit' => $event->totalNet, 'description' => 'Net payroll payable'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to post payroll journal', ['run' => $event->payrollRunId, 'error' => $e->getMessage()]);
        }
    }
}
