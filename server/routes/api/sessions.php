<?php

use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('sessions')->middleware(['rbac:sessions.view'])->group(function () {
        Route::get('/', [SessionController::class, 'index']);
        Route::get('/active', [SessionController::class, 'active']);

        Route::middleware(['rbac:sessions.terminate'])->group(function () {
            Route::delete('/{tokenId}', [SessionController::class, 'destroy']);
            Route::post('/user/{userId}/terminate-all', [SessionController::class, 'destroyAllForUser']);
        });
    });
});
