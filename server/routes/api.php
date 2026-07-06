<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| This file loads all API route modules from the api/ directory.
|
*/

require __DIR__ . '/api/health.php';
require __DIR__ . '/api/auth.php';
require __DIR__ . '/api/dashboard.php';
require __DIR__ . '/api/users.php';
require __DIR__ . '/api/roles.php';
require __DIR__ . '/api/permissions.php';
require __DIR__ . '/api/sessions.php';
require __DIR__ . '/api/login-activity.php';
