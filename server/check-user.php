<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$user = App\Models\User::where('email', 'amirsiraj1995@gmail.com')->first();
if ($user) {
    echo "id={$user->id} active={$user->is_active} email={$user->email}\n";
    echo "password_hash={$user->password}\n";
    echo "has2fa=" . ($user->hasTwoFactorEnabled() ? 'true' : 'false') . "\n";
} else {
    echo "User not found\n";
}
