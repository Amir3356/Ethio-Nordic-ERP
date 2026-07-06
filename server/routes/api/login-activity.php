<?php

use App\Http\Controllers\Api\LoginActivityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    // Login Activity
    Route::prefix('login-activity')->middleware(['rbac:login_activity.view'])->group(function () {
        Route::get('/', [LoginActivityController::class, 'index']);
        Route::get('/{id}', [LoginActivityController::class, 'show']);
        Route::get('/user/{userId}', [LoginActivityController::class, 'getUserActivity']);
    });

    // Audit Logs
    Route::prefix('audit-logs')->middleware(['rbac:audit_logs.view'])->group(function () {
        Route::get('/', [LoginActivityController::class, 'auditLogs']);
        Route::get('/{id}', [LoginActivityController::class, 'showAuditLog']);

        Route::middleware(['rbac:audit_logs.export'])->group(function () {
            Route::get('/export/csv', [LoginActivityController::class, 'exportAuditCsv']);
        });
    });

    // Security (admin only)
    Route::middleware(['rbac:role:admin|role:super-admin'])->group(function () {
        Route::prefix('security')->group(function () {
            Route::middleware(['rbac:security.view_events'])->group(function () {
                Route::get('/failed-logins', [LoginActivityController::class, 'failedLogins']);
                Route::get('/suspicious-activity', [LoginActivityController::class, 'suspiciousActivity']);
            });
        });
    });
});
