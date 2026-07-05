<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Admin']
        );

        $userRole = Role::firstOrCreate(
            ['slug' => 'user'],
            ['name' => 'User']
        );

        User::firstOrCreate(
            ['email' => 'amirsiraj1995@gmail.com'],
            [
                'full_name' => 'Admin User',
                'password' => Hash::make('AEHJSS36'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        )->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
