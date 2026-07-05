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
        $admin = Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name'      => 'Admin',
                'is_active' => true,
                'is_system' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'amirsiraj1995@gmail.com'],
            [
                'full_name'      => 'Amir Siraj',
                'password'         => Hash::make('AEHJSS36'),
                'is_active'        => true,
                'email_verified_at' => now(),
            ]
        )->roles()->syncWithoutDetaching([$admin->id]);
    }
}
