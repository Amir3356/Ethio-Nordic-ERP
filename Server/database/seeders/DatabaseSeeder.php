<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'users'          => ['view', 'create', 'edit', 'delete', 'approve', 'export'],
            'roles'          => ['view', 'create', 'edit', 'delete'],
            'permissions'    => ['view'],
            'login-activity' => ['view', 'export'],
            'audit-logs'     => ['view', 'export'],
            'sessions'       => ['view', 'delete'],
            'dashboard'      => ['view'],
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(
                    ['module' => $module, 'action' => $action],
                    [
                        'name'        => ucfirst(str_replace('-', ' ', $module)) . ' ' . ucfirst($action),
                        'slug'        => "{$module}.{$action}",
                        'description' => ucfirst($action) . ' ' . $module,
                    ]
                );
            }
        }

        $admin = Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name'        => 'Admin',
                'description' => 'Full system access',
                'is_active'   => true,
                'is_system'   => true,
            ]
        );
        $admin->syncPermissions(Permission::pluck('id')->toArray());

        User::firstOrCreate(
            ['email' => 'amirsiraj1995@gmail.com'],
            [
                'name'             => 'Admin',
                'password'         => Hash::make('AEHJSS36'),
                'is_active'        => true,
                'email_verified_at' => now(),
            ]
        )->roles()->syncWithoutDetaching([$admin->id]);
    }
}
