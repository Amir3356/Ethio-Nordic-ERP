<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions for User & Access Management module
        $userManagementPermissions = [
            ['name' => 'View Users', 'slug' => 'users.view', 'action' => 'view', 'description' => 'View user accounts and their details'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'action' => 'create', 'description' => 'Create new user accounts'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'action' => 'edit', 'description' => 'Edit existing user accounts'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'action' => 'delete', 'description' => 'Delete user accounts'],
            ['name' => 'Activate/Deactivate Users', 'slug' => 'users.activate', 'action' => 'activate', 'description' => 'Activate or deactivate user accounts'],
            ['name' => 'Reset User Passwords', 'slug' => 'users.reset_password', 'action' => 'reset_password', 'description' => 'Reset user passwords'],
            ['name' => 'Manage User Roles', 'slug' => 'users.manage_roles', 'action' => 'manage_roles', 'description' => 'Assign and remove roles from users'],
            ['name' => 'View User Permissions', 'slug' => 'users.view_permissions', 'action' => 'view_permissions', 'description' => 'View user permissions and access levels'],
            
            ['name' => 'View Roles', 'slug' => 'roles.view', 'action' => 'view', 'description' => 'View roles and their details'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'action' => 'create', 'description' => 'Create new roles'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'action' => 'edit', 'description' => 'Edit existing roles'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'action' => 'delete', 'description' => 'Delete roles'],
            
            ['name' => 'View Permissions', 'slug' => 'permissions.view', 'action' => 'view', 'description' => 'View permissions and their details'],
            ['name' => 'Create Permissions', 'slug' => 'permissions.create', 'action' => 'create', 'description' => 'Create new permissions'],
            ['name' => 'Edit Permissions', 'slug' => 'permissions.edit', 'action' => 'edit', 'description' => 'Edit existing permissions'],
            ['name' => 'Delete Permissions', 'slug' => 'permissions.delete', 'action' => 'delete', 'description' => 'Delete permissions'],
            ['name' => 'Assign Permissions to Roles', 'slug' => 'permissions.assign', 'action' => 'assign', 'description' => 'Assign permissions to roles'],
            
            ['name' => 'View Login Activity', 'slug' => 'login_activity.view', 'action' => 'view', 'description' => 'View login activity logs'],
            ['name' => 'Export Login Activity', 'slug' => 'login_activity.export', 'action' => 'export', 'description' => 'Export login activity reports'],
            
            ['name' => 'View Audit Logs', 'slug' => 'audit_logs.view', 'action' => 'view', 'description' => 'View audit trail logs'],
            ['name' => 'Export Audit Logs', 'slug' => 'audit_logs.export', 'action' => 'export', 'description' => 'Export audit trail reports'],
            
            ['name' => 'View Sessions', 'slug' => 'sessions.view', 'action' => 'view', 'description' => 'View active user sessions'],
            ['name' => 'Terminate Sessions', 'slug' => 'sessions.terminate', 'action' => 'terminate', 'description' => 'Terminate user sessions'],
            ['name' => 'View Session Statistics', 'slug' => 'sessions.stats', 'action' => 'stats', 'description' => 'View session statistics and device breakdown'],
            
            ['name' => 'Access Review Reports', 'slug' => 'access_review.view', 'action' => 'view', 'description' => 'View periodic access review reports'],
        ];

        // Create Security module permissions
        $securityPermissions = [
            ['name' => 'Manage Two-Factor Authentication', 'slug' => 'security.manage_2fa', 'action' => 'manage_2fa', 'description' => 'Enable/disable 2FA for users'],
            ['name' => 'Force Password Reset', 'slug' => 'security.force_password_reset', 'action' => 'force_password_reset', 'description' => 'Force users to reset their passwords'],
            ['name' => 'View Security Events', 'slug' => 'security.view_events', 'action' => 'view_events', 'description' => 'View security-related events and alerts'],
            ['name' => 'Configure Security Policies', 'slug' => 'security.configure_policies', 'action' => 'configure_policies', 'description' => 'Configure system security policies'],
        ];

        // Create System Administration permissions
        $systemPermissions = [
            ['name' => 'System Configuration', 'slug' => 'system.configure', 'action' => 'configure', 'description' => 'Configure system settings'],
            ['name' => 'Database Management', 'slug' => 'system.database', 'action' => 'database', 'description' => 'Manage database operations'],
            ['name' => 'Backup Management', 'slug' => 'system.backup', 'action' => 'backup', 'description' => 'Manage system backups'],
            ['name' => 'System Monitoring', 'slug' => 'system.monitor', 'action' => 'monitor', 'description' => 'Monitor system performance and health'],
        ];

        // Add all permissions to array with module information
        $allPermissions = collect()
            ->merge(collect($userManagementPermissions)->map(fn($p) => array_merge($p, ['module' => 'User Management'])))
            ->merge(collect($securityPermissions)->map(fn($p) => array_merge($p, ['module' => 'Security'])))
            ->merge(collect($systemPermissions)->map(fn($p) => array_merge($p, ['module' => 'System Administration'])))
            ->toArray();

        // Create permissions
        foreach ($allPermissions as $permissionData) {
            Permission::firstOrCreate(
                ['slug' => $permissionData['slug']],
                $permissionData
            );
        }

        // Create roles
        $roles = [
            [
                'name' => 'Super Administrator',
                'slug' => 'super-admin',
            ],
            [
                'name' => 'Administrator',
                'slug' => 'admin',
            ],
            [
                'name' => 'HR Manager',
                'slug' => 'hr-manager',
            ],
            [
                'name' => 'Department Manager',
                'slug' => 'dept-manager',
            ],
            [
                'name' => 'Finance Manager',
                'slug' => 'finance-manager',
            ],
            [
                'name' => 'Warehouse Officer',
                'slug' => 'warehouse-officer',
            ],
            [
                'name' => 'Regulatory Affairs Officer',
                'slug' => 'regulatory-officer',
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }

        // Assign permissions to roles
        $this->assignPermissionsToRoles();

        // Create default super admin user
        $this->createDefaultSuperAdmin();

        if (isset($this->command)) {
            $this->command->info('Roles and permissions seeded successfully!');
        }
    }

    /**
     * Assign permissions to roles based on role hierarchy
     */
    private function assignPermissionsToRoles(): void
    {
        // Super Admin gets all permissions
        $superAdmin = Role::where('slug', 'super-admin')->first();
        $allPermissions = Permission::all();
        $superAdmin->permissions()->sync($allPermissions->pluck('id'));

        // Admin gets most permissions except system administration
        $admin = Role::where('slug', 'admin')->first();
        $adminPermissions = Permission::where('module', '!=', 'System Administration')->get();
        $admin->permissions()->sync($adminPermissions->pluck('id'));

        // HR Manager gets user management permissions
        $hrManager = Role::where('slug', 'hr-manager')->first();
        $hrPermissions = Permission::whereIn('slug', [
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.activate',
            'users.reset_password', 'users.manage_roles', 'users.view_permissions',
            'roles.view', 'permissions.view',
            'login_activity.view', 'login_activity.export',
            'sessions.view', 'sessions.terminate', 'sessions.stats',
            'access_review.view',
        ])->get();
        $hrManager->permissions()->sync($hrPermissions->pluck('id'));

        // Department Manager gets limited user oversight
        $deptManager = Role::where('slug', 'dept-manager')->first();
        $deptPermissions = Permission::whereIn('slug', [
            'users.view', 'users.view_permissions',
            'login_activity.view',
            'sessions.view', 'sessions.stats',
        ])->get();
        $deptManager->permissions()->sync($deptPermissions->pluck('id'));

        // Finance Manager gets view permissions for audit purposes
        $financeManager = Role::where('slug', 'finance-manager')->first();
        $financePermissions = Permission::whereIn('slug', [
            'users.view',
            'audit_logs.view', 'audit_logs.export',
            'login_activity.view', 'login_activity.export',
        ])->get();
        $financeManager->permissions()->sync($financePermissions->pluck('id'));

        // Warehouse Officer gets basic view permissions
        $warehouseOfficer = Role::where('slug', 'warehouse-officer')->first();
        $warehousePermissions = Permission::whereIn('slug', [
            'users.view',
        ])->get();
        $warehouseOfficer->permissions()->sync($warehousePermissions->pluck('id'));

        // Regulatory Affairs Officer gets audit and compliance permissions
        $regulatoryOfficer = Role::where('slug', 'regulatory-officer')->first();
        $regulatoryPermissions = Permission::whereIn('slug', [
            'users.view',
            'audit_logs.view', 'audit_logs.export',
            'login_activity.view', 'login_activity.export',
            'access_review.view',
        ])->get();
        $regulatoryOfficer->permissions()->sync($regulatoryPermissions->pluck('id'));

        // Employee gets minimal permissions (view only their own data)
        $employee = Role::where('slug', 'employee')->first();
        // No default permissions for regular employees - granted on case-by-case basis
        $employee->permissions()->sync([]);
    }

    /**
     * Create default super admin user
     */
    private function createDefaultSuperAdmin(): void
    {
        $superAdminRole = Role::where('slug', 'super-admin')->first();

        $user = User::firstOrCreate(
            ['email' => 'amirsiraj1995@gmail.com'],
            [
                'full_name' => 'Admin',
                'department' => 'IT',
                'password' => Hash::make('AEHJSS36'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $user->roles()->sync([$superAdminRole->id]);

        if (isset($this->command)) {
            $this->command->info('Default super admin created: amirsiraj1995@gmail.com / AEHJSS36');
        }
    }
}
