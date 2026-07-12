<?php

namespace App\Console\Commands;

use App\Models\ArInvoice;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Module 3, Step 5: IF (current date − due date) > 0 → trigger automated
 * reminder. Flips 'sent' invoices to 'overdue' and raises reminders
 * bucketed by aging (0–30 / 31–60 / 61–90 / 90+).
 */
class SendArOverdueReminders extends Command
{
    protected $signature = 'finance:ar-overdue-reminders';

    protected $description = 'Detect overdue customer invoices and raise automated payment reminders';

    public function handle(): int
    {
        $reminders = [];

        ArInvoice::whereNotIn('status', ['paid', 'written_off', 'draft'])
            ->where('due_date', '<', now()->startOfDay())
            ->orderBy('due_date')
            ->get()
            ->each(function (ArInvoice $inv) use (&$reminders) {
                if ($inv->status === 'sent') {
                    $inv->update(['status' => 'overdue']);
                }

                $daysOverdue = (int) $inv->due_date->diffInDays(now());
                $bucket = $daysOverdue <= 30 ? '0-30' : ($daysOverdue <= 60 ? '31-60' : ($daysOverdue <= 90 ? '61-90' : '90+'));

                $reminder = [
                    'invoice_no' => $inv->invoice_no,
                    'customer' => $inv->customer_name,
                    'amount' => (float) $inv->total_amount,
                    'due_date' => $inv->due_date->toDateString(),
                    'days_overdue' => $daysOverdue,
                    'aging_bucket' => $bucket,
                ];
                $reminders[] = $reminder;

                Log::channel('stack')->warning('AR overdue payment reminder', $reminder);
            });

        Cache::put('finance:ar-overdue-reminders', [
            'generated_at' => now()->toIso8601String(),
            'reminders' => $reminders,
        ], now()->addDay());

        $this->info(count($reminders) . ' overdue reminder(s) raised.');

        return self::SUCCESS;
    }
}
