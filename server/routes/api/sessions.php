<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'idle.session'])->group(function () {
    // Terminate any session (all authenticated users can do this)
    Route::prefix('sessions')->group(function () {
        Route::delete('/{tokenId}', [SessionController::class, 'destroy']);
        Route::post('/user/{userId}/terminate-all', [SessionController::class, 'destroyAllForUser']);
    });

    Route::prefix('sessions')->middleware(['rbac:sessions.view'])->group(function () {
        Route::get('/', [SessionController::class, 'index']);
        Route::get('/active', [SessionController::class, 'active']);
        Route::get('/stats', [AuthController::class, 'sessionStats']);

        // Get client's public IP address
        Route::get('/public-ip', [SessionController::class, 'getPublicIp']);

        // Get geolocation from an IP address
        Route::post('/geo-location', [SessionController::class, 'getGeoLocation']);

        // Idle timeout configuration (admin only)
        Route::get('/idle-timeout', [SessionController::class, 'getIdleTimeout']);
        Route::put('/idle-timeout', [SessionController::class, 'updateIdleTimeout'])
            ->middleware('rbac:role:admin');

        // Update session location (users can update their own)
        Route::put('/{tokenId}/location', [SessionController::class, 'updateLocation']);
    });
});
