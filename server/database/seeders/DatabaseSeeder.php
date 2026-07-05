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
        $this->call([
            PermissionSeeder::class,
        ]);

        $admin = Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name'      => 'Admin'
            ]
        );

        User::firstOrCreate(
            ['email' => 'amirsiraj1995@gmail.com'],
            [

                'password'         => Hash::make('AEHJSS36'),
                'is_active'        => true,
                'email_verified_at' => now(),
            ]
        )->roles()->syncWithoutDetaching([$admin->id]);
    }
}
