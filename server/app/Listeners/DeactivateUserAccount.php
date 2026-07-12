<?php

namespace App\Listeners;

use App\Events\EmployeeTerminated;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Consumes the offboarding event: deactivates the employee's system
 * login and revokes active sessions/tokens.
 */
class DeactivateUserAccount implements ShouldQueue
{
    public function handle(EmployeeTerminated $event): void
    {
        $user = User::where('email', $event->email)->first();

        if (!$user) {
            Log::warning('Deactivation skipped: no user account for employee.', ['email' => $event->email]);
            return;
        }

        $user->update(['is_active' => false]);
        $user->tokens()->delete();
        DB::table('sessions')->where('user_id', $user->id)->delete();

        Log::info('User account deactivated on employee exit.', [
            'employee_id' => $event->employeeId,
            'user_id' => $user->id,
            'reason' => $event->reason,
        ]);
    }
}
