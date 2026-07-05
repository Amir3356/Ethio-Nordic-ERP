<?php

use App\Http\Controllers\Api\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs', [AuditLogController::class, 'index']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/{id}', [AuditLogController::class, 'show']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/entity/{entityType}/{entityId}', [AuditLogController::class, 'entityHistory']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/module/{module}', [AuditLogController::class, 'moduleHistory']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/user/{userId}', [AuditLogController::class, 'userHistory']);
});
