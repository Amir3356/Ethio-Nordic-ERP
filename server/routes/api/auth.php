<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// ==================== PUBLIC AUTH ROUTES ====================
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login-with-recovery', [AuthController::class, 'loginWithRecoveryCode']);
    Route::post('/activate', [AuthController::class, 'activateAccount']);
    Route::post('/setup-2fa-onboarding', [AuthController::class, 'setupTwoFactorOnboarding']);
    Route::post('/verify-2fa-onboarding', [AuthController::class, 'verifyTwoFactorOnboarding']);
    Route::post('/skip-2fa-onboarding', [AuthController::class, 'skipTwoFactorOnboarding']);
    Route::post('/refresh', [AuthController::class, 'refreshToken']);
});

// ==================== AUTHENTICATED AUTH ROUTES ====================
Route::middleware(['auth:sanctum', 'idle.session'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);

        // Two-Factor Authentication
        Route::post('/setup-2fa', [AuthController::class, 'setupTwoFactor']);
        Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor']);
        Route::post('/disable-2fa', [AuthController::class, 'disableTwoFactor']);
        Route::post('/regenerate-recovery-codes', [AuthController::class, 'regenerateRecoveryCodes']);

        // Session Management
        Route::get('/sessions', [AuthController::class, 'activeSessions']);
        Route::delete('/sessions/{tokenId}', [AuthController::class, 'revokeSession']);
        Route::post('/revoke-all-sessions', [AuthController::class, 'revokeAllOtherSessions']);
    });

    // User registration (admin only)
    Route::middleware(['rbac:role:admin'])->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
    });
});
