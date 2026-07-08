<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::where('email', 'ilhsir73@gmail.com')->first();
if ($user) {
    $user->password = bcrypt('AEHJSS36@');
    $user->is_active = true;
    $user->email_verified_at = now();
    $user->save();
    echo "Password set, user activated.\n";
} else {
    echo "User not found.\n";
}
