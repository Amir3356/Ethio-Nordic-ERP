<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(Illuminate\Http\Request::capture());

$roles = DB::select('SELECT r.name, r.slug FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = 11');
echo "User roles:\n";
foreach ($roles as $r) echo "  {$r->name} ({$r->slug})\n";

$allRoles = DB::select('SELECT name, slug FROM roles');
echo "\nAll roles:\n";
foreach ($allRoles as $r) echo "  {$r->name} ({$r->slug})\n";

$user = App\Models\User::find(11);
echo "\nIs admin: " . ($user->isAdmin() ? 'true' : 'false') . "\n";
echo "Has 2FA: " . ($user->hasTwoFactorEnabled() ? 'true' : 'false') . "\n";
