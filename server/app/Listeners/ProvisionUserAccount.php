<?php

namespace App\Listeners;

use App\Events\EmployeeOnboarded;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Consumes the onboarding event: creates the employee's system login
 * with a temporary password and assigns the default employee role.
 */
class ProvisionUserAccount implements ShouldQueue
{
    public function handle(EmployeeOnboarded $event): void
    {
        if (User::where('email', $event->email)->exists()) {
            Log::info('Provisioning skipped: user already exists.', ['email' => $event->email]);
            return;
        }

        $user = User::create([
            'full_name' => $event->fullName,
            'email' => $event->email,
            'department' => $event->department,
            'password' => Str::random(16),
            'is_active' => true,
            'temp_password_expires_at' => now()->addDays(7),
        ]);

        $role = Role::where('slug', 'employee')->first();
        if ($role) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }

        Log::info('User account provisioned for new employee.', [
            'employee_id' => $event->employeeId,
            'user_id' => $user->id,
            'role' => $role?->slug,
        ]);
    }
}
