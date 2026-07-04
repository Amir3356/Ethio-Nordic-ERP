<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LoginActivityController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/activate', [AuthController::class, 'activateAccount']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/verify-2fa', [AuthController::class, 'verifyTwoFactor']);
    Route::post('/auth/enable-2fa', [AuthController::class, 'enable2FA']);
    Route::post('/auth/disable-2fa', [AuthController::class, 'disable2FA']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::middleware('rbac:users,view')->get('/users', [UserController::class, 'index']);
    Route::middleware('rbac:users,create')->post('/users', [UserController::class, 'store']);
    Route::middleware('rbac:users,view')->get('/users/{id}', [UserController::class, 'show']);
    Route::middleware('rbac:users,edit')->put('/users/{id}', [UserController::class, 'update']);
    Route::middleware('rbac:users,delete')->post('/users/{id}/deactivate', [UserController::class, 'deactivate']);
    Route::middleware('rbac:users,edit')->post('/users/{id}/activate', [UserController::class, 'activate']);
    Route::middleware('rbac:users,view')->get('/users/{id}/permissions', [UserController::class, 'getUserPermissions']);
    Route::middleware('rbac:users,edit')->post('/users/bulk-action', [UserController::class, 'bulkAction']);

    Route::middleware('rbac:roles,view')->get('/roles', [RoleController::class, 'index']);
    Route::middleware('rbac:roles,create')->post('/roles', [RoleController::class, 'store']);
    Route::middleware('rbac:roles,view')->get('/roles/{id}', [RoleController::class, 'show']);
    Route::middleware('rbac:roles,edit')->put('/roles/{id}', [RoleController::class, 'update']);
    Route::middleware('rbac:roles,delete')->delete('/roles/{id}', [RoleController::class, 'destroy']);

    Route::middleware('rbac:permissions,view')->get('/permissions', [PermissionController::class, 'index']);
    Route::middleware('rbac:permissions,view')->get('/permissions/{id}', [PermissionController::class, 'show']);
    Route::middleware('rbac:permissions,view')->get('/permissions/module/{module}', [PermissionController::class, 'byModule']);

    Route::middleware('rbac:login-activity,view')->get('/login-activity', [LoginActivityController::class, 'index']);
    Route::middleware('rbac:login-activity,view')->get('/login-activity/user/{id}', [LoginActivityController::class, 'userActivity']);
    Route::middleware('rbac:login-activity,view')->get('/login-activity/stats', [LoginActivityController::class, 'stats']);
    Route::middleware('rbac:login-activity,view')->get('/login-activity/online', [LoginActivityController::class, 'onlineUsers']);

    Route::middleware('rbac:audit-logs,view')->get('/audit-logs', [AuditLogController::class, 'index']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/{id}', [AuditLogController::class, 'show']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/entity/{entityType}/{entityId}', [AuditLogController::class, 'entityHistory']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/module/{module}', [AuditLogController::class, 'moduleHistory']);
    Route::middleware('rbac:audit-logs,view')->get('/audit-logs/user/{userId}', [AuditLogController::class, 'userHistory']);

    Route::middleware('rbac:sessions,view')->get('/sessions', [SessionController::class, 'index']);
    Route::middleware('rbac:sessions,delete')->delete('/sessions/{tokenId}', [SessionController::class, 'destroy']);
    Route::middleware('rbac:sessions,delete')->delete('/sessions/user/{userId}', [SessionController::class, 'destroyAllForUser']);
    Route::middleware('rbac:sessions,delete')->post('/sessions/force-logout/{userId}', [SessionController::class, 'forceLogout']);
    Route::middleware('rbac:sessions,view')->get('/sessions/stats', [SessionController::class, 'sessionStats']);
});
