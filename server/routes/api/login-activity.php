<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\LoginActivityController;
use App\Http\Controllers\Api\SecurityController;
use App\Http\Controllers\Api\UserLoginActivityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    // Login Activity
    Route::prefix('login-activity')->middleware(['rbac:login_activity.view'])->group(function () {
        Route::get('/', [LoginActivityController::class, 'index']);
        Route::get('/{id}', [LoginActivityController::class, 'show']);
        Route::get('/user/{userId}', [UserLoginActivityController::class, 'getUserActivity']);
    });

    // Audit Logs — immutable: only GET allowed, PUT/PATCH/DELETE blocked
    Route::prefix('audit-logs')->middleware(['rbac:audit_logs.view', 'audit.immutable'])->group(function () {
        Route::get('/', [AuditLogController::class, 'auditLogs']);
        Route::get('/{id}', [AuditLogController::class, 'showAuditLog']);

        Route::middleware(['rbac:audit_logs.export'])->group(function () {
            Route::get('/export/csv', [AuditLogController::class, 'exportAuditCsv']);
        });
    });

    // Security (admin only)
    Route::middleware(['rbac:role:admin'])->group(function () {
        Route::prefix('security')->group(function () {
            Route::middleware(['rbac:security.view_events'])->group(function () {
                Route::get('/failed-logins', [SecurityController::class, 'failedLogins']);
                Route::get('/suspicious-activity', [SecurityController::class, 'suspiciousActivity']);
            });
        });
    });
});
