<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'amirsiraj1995@gmail.com'],
            [
                'full_name' => 'Admin',
                'department' => 'Administration',
                'password' => Hash::make('AEHJSS36@'),
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
