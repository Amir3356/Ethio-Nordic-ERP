<?php

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// API version info
Route::get('/version', function () {
    return response()->json([
        'api_version' => '1.0.0',
        'app_name' => config('app.name'),
        'environment' => config('app.env'),
    ]);
});
