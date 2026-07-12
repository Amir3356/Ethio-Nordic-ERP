<?php

namespace App\Console\Commands;

use App\Models\Training;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Module 4, Step 7: automated certification renewal reminders sent
 * ahead of expiry (90/60/30-day escalation).
 */
class SendCertificationReminders extends Command
{
    protected $signature = 'hr:certification-reminders';

    protected $description = 'Raise renewal reminders for certifications approaching expiry';

    private const THRESHOLDS = [90, 60, 30];

    public function handle(): int
    {
        $reminders = [];

        Training::with('employee')
            ->whereNotNull('cert_expiry')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('cert_expiry', [now(), now()->addDays(max(self::THRESHOLDS))])
            ->orderBy('cert_expiry')
            ->get()
            ->each(function (Training $t) use (&$reminders) {
                $daysLeft = (int) now()->startOfDay()->diffInDays($t->cert_expiry, false);
                $tier = collect(self::THRESHOLDS)->first(fn ($d) => $daysLeft <= $d);

                $reminder = [
                    'employee' => trim(($t->employee?->first_name ?? '') . ' ' . ($t->employee?->last_name ?? '')),
                    'certification' => $t->certification ?? $t->training_name,
                    'expiry_date' => $t->cert_expiry?->toDateString(),
                    'days_left' => $daysLeft,
                    'reminder_tier' => $tier . '-day',
                ];
                $reminders[] = $reminder;

                Log::channel('stack')->warning('Certification renewal reminder', $reminder);
            });

        Cache::put('hr:certification-reminders', [
            'generated_at' => now()->toIso8601String(),
            'reminders' => $reminders,
        ], now()->addDay());

        $this->info(count($reminders) . ' certification reminder(s) raised.');

        return self::SUCCESS;
    }
}
