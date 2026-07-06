<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

// Check users
$users = \DB::table('users')->get();
echo "Users in database:\n";
foreach ($users as $user) {
    echo "  ID: {$user->id}, Email: {$user->email}, Name: {$user->full_name}\n";
}

// Check if admin exists
$admin = \App\Models\User::find(1);
echo "\nAdmin user lookup:\n";
echo "Admin is: " . ($admin ? $admin->email : 'NULL') . "\n";

// Check all users
$allUsers = \App\Models\User::all();
echo "\nAll users via Eloquent: " . $allUsers->count() . "\n";
foreach ($allUsers as $u) {
    echo "  - " . $u->email . "\n";
}
