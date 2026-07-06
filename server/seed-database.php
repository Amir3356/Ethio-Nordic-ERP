<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

// Disable Termwind to avoid mbstring issue
putenv('TERM=dumb');

$app['db']->transaction(function () use ($app) {
    $role_seeder = new \Database\Seeders\RolePermissionSeeder();
    echo "🌱 Seeding RolePermissionSeeder...\n";
    $role_seeder->run();
    echo "✅ Seeding completed successfully!\n";
});

echo "\n📊 Database Summary:\n";

$user_count = \App\Models\User::count();
$role_count = \App\Models\Role::count();
$permission_count = \App\Models\Permission::count();

echo "Users: $user_count\n";
echo "Roles: $role_count\n";
echo "Permissions: $permission_count\n";

$admin = \App\Models\User::where('email', 'admin@ethionordic.com')->first();
if ($admin) {
    echo "\n✅ Default Admin Created:\n";
    echo "   Email: admin@ethionordic.com\n";
    echo "   Password: EthioNordic@2026!\n";
    echo "   Roles: " . $admin->roles->pluck('name')->join(', ') . "\n";
}

echo "\n✅ All systems operational!\n";
