<?php

use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    require __DIR__ . '/api/auth.php';
    require __DIR__ . '/api/users.php';
    require __DIR__ . '/api/roles.php';
    require __DIR__ . '/api/permissions.php';
    require __DIR__ . '/api/login-activity.php';
    require __DIR__ . '/api/audit-logs.php';
    require __DIR__ . '/api/sessions.php';
    require __DIR__ . '/api/dashboard.php';
});
