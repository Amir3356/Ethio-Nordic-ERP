<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Module 1, Step 8: scheduled (quarterly) access review report listing
 * all users, their roles, and last login — surfacing dormant accounts
 * and privilege creep for remediation.
 */
class GenerateAccessReview extends Command
{
    protected $signature = 'access:generate-review {--inactive-days=90}';

    protected $description = 'Generate the periodic access review report (dormant accounts, privilege accumulation)';

    public function handle(): int
    {
        $inactiveDays = (int) $this->option('inactive-days');

        $report = User::with('roles')->get()->map(fn (User $user) => [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'department' => $user->department,
            'roles' => $user->roles->pluck('slug')->values(),
            'role_count' => $user->roles->count(),
            'last_login' => $user->last_login_at?->format('Y-m-d H:i:s'),
            'is_active' => $user->is_active,
            'dormant' => !$user->last_login_at || $user->last_login_at->lt(now()->subDays($inactiveDays)),
            'privilege_creep_flag' => $user->roles->count() > 2,
        ]);

        $summary = [
            'generated_at' => now()->toIso8601String(),
            'inactive_days_threshold' => $inactiveDays,
            'total_users' => $report->count(),
            'dormant_accounts' => $report->where('dormant', true)->count(),
            'privilege_creep_flags' => $report->where('privilege_creep_flag', true)->count(),
            'users' => $report->values(),
        ];

        Cache::forever('access-review:latest', $summary);
        Log::info('Periodic access review generated', [
            'total' => $summary['total_users'],
            'dormant' => $summary['dormant_accounts'],
            'privilege_creep' => $summary['privilege_creep_flags'],
        ]);

        $this->info("Access review generated: {$summary['total_users']} user(s), {$summary['dormant_accounts']} dormant, {$summary['privilege_creep_flags']} privilege-creep flag(s).");

        return self::SUCCESS;
    }
}
