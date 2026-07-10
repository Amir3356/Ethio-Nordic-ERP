<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'amirsiraj1995@gmail.com'],
            [
                'full_name' => 'Admin',
                'department' => 'Administration',
                'password' => 'AEHJSS36',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $admin->roles()->syncWithoutDetaching([$adminRole->id]);
        }

        if (isset($this->command)) {
            $this->command->info('Admin user seeded: amirsiraj1995@gmail.com');
        }
    }
}
