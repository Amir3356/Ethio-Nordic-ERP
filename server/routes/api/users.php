<?php

use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('users')->middleware(['rbac:users.view'])->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/access-review', [UserController::class, 'accessReviewReport'])
            ->middleware(['rbac:access_review.view']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::get('/{id}/permissions', [UserController::class, 'getUserPermissions']);

        // Creation requires specific permission
        Route::middleware(['rbac:users.create'])->group(function () {
            Route::post('/', [UserController::class, 'store']);
        });

        // Editing requires specific permission
        Route::middleware(['rbac:users.edit'])->group(function () {
            Route::put('/{id}', [UserController::class, 'update']);
            Route::post('/{id}/resend-activation', [UserController::class, 'resendActivation']);
            Route::post('/{id}/reset-password', [UserController::class, 'resetPassword']);
        });

        // Activation/Deactivation requires specific permission
        Route::middleware(['rbac:users.activate'])->group(function () {
            Route::post('/{id}/activate', [UserController::class, 'activate']);
            Route::post('/{id}/deactivate', [UserController::class, 'deactivate']);
            Route::post('/bulk-action', [UserController::class, 'bulkAction']);
        });

        // Deletion requires specific permission
        Route::middleware(['rbac:users.delete'])->group(function () {
            Route::delete('/{id}', [UserController::class, 'destroy']);
        });
    });
});
