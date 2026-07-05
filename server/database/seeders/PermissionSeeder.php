<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = ['users', 'roles', 'login-activity', 'sessions', 'audit-logs', 'dashboard'];
        $actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

        $permissions = [];
        foreach ($modules as $module) {
            foreach ($actions as $action) {
                $perm = Permission::firstOrCreate(
                    ['slug' => "{$module}.{$action}"],
                    [
                        'name' => ucfirst($action) . ' ' . str_replace('-', ' ', ucfirst($module)),
                        'module' => $module,
                        'action' => $action,
                        'description' => "Allow {$action} on {$module}",
                    ]
                );
                $permissions[] = $perm;
            }
        }

        $admin = Role::where('slug', 'admin')->first();
        if ($admin) {
            $admin->permissions()->syncWithoutDetaching(collect($permissions)->pluck('id'));
        }
    }
}
