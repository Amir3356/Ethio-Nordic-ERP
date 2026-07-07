<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'idle.session'])->group(function () {
    Route::prefix('sessions')->middleware(['rbac:sessions.view'])->group(function () {
        Route::get('/', [SessionController::class, 'index']);
        Route::get('/active', [SessionController::class, 'active']);
        Route::get('/stats', [AuthController::class, 'sessionStats']);

        Route::middleware(['rbac:sessions.terminate'])->group(function () {
            Route::delete('/{tokenId}', [SessionController::class, 'destroy']);
            Route::post('/user/{userId}/terminate-all', [SessionController::class, 'destroyAllForUser']);
        });
    });
});
