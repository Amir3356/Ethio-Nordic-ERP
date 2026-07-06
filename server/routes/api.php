<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\LoginActivityController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned the "api" middleware group. Make something great!
|
*/

// ==================== PUBLIC ROUTES ====================

// Authentication routes (no auth required)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login-with-recovery', [AuthController::class, 'loginWithRecoveryCode']);
    Route::post('/activate', [AuthController::class, 'activateAccount']);
});

// ==================== AUTHENTICATED ROUTES ====================

Route::middleware(['auth:sanctum'])->group(function () {
    
    // ==================== AUTH & PROFILE ROUTES ====================
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

    // ==================== DASHBOARD (Basic access for all authenticated users) ====================
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ==================== USER MANAGEMENT ROUTES ====================
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

    // ==================== ROLE MANAGEMENT ROUTES ====================
    Route::prefix('roles')->middleware(['rbac:roles.view'])->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/{id}', [RoleController::class, 'show']);
        
        Route::middleware(['rbac:roles.create'])->group(function () {
            Route::post('/', [RoleController::class, 'store']);
        });
        
        Route::middleware(['rbac:roles.edit'])->group(function () {
            Route::put('/{id}', [RoleController::class, 'update']);
        });
        
        Route::middleware(['rbac:roles.delete'])->group(function () {
            Route::delete('/{id}', [RoleController::class, 'destroy']);
        });
    });

    // ==================== PERMISSION MANAGEMENT ROUTES ====================
    Route::prefix('permissions')->middleware(['rbac:permissions.view'])->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::get('/{id}', [PermissionController::class, 'show']);
        Route::get('/modules/list', [PermissionController::class, 'getModules']);
        Route::get('/actions/list', [PermissionController::class, 'getActions']);
        Route::get('/grouped/by-module', [PermissionController::class, 'getGroupedByModule']);
        Route::get('/matrix/roles', [PermissionController::class, 'getRoleMatrix']);
        
        Route::middleware(['rbac:permissions.create'])->group(function () {
            Route::post('/', [PermissionController::class, 'store']);
            Route::post('/bulk-create', [PermissionController::class, 'bulkCreate']);
            Route::post('/generate-standard', [PermissionController::class, 'generateStandardPermissions']);
        });
        
        Route::middleware(['rbac:permissions.edit'])->group(function () {
            Route::put('/{id}', [PermissionController::class, 'update']);
        });
        
        Route::middleware(['rbac:permissions.delete'])->group(function () {
            Route::delete('/{id}', [PermissionController::class, 'destroy']);
        });
        
        // Permission assignment to roles
        Route::middleware(['rbac:permissions.assign'])->group(function () {
            Route::post('/roles/{roleId}/assign', [PermissionController::class, 'assignToRole']);
            Route::post('/roles/{roleId}/remove', [PermissionController::class, 'removeFromRole']);
            Route::post('/roles/{roleId}/sync', [PermissionController::class, 'syncRolePermissions']);
        });
    });

    // ==================== LOGIN ACTIVITY ROUTES ====================
    Route::prefix('login-activity')->middleware(['rbac:login_activity.view'])->group(function () {
        Route::get('/', [LoginActivityController::class, 'index']);
        Route::get('/{id}', [LoginActivityController::class, 'show']);
        Route::get('/user/{userId}', [LoginActivityController::class, 'getUserActivity']);
    });

    // ==================== AUDIT LOGS ROUTES ====================
    Route::prefix('audit-logs')->middleware(['rbac:audit_logs.view'])->group(function () {
        Route::get('/', [LoginActivityController::class, 'auditLogs']);
        Route::get('/{id}', [LoginActivityController::class, 'showAuditLog']);
        
        Route::middleware(['rbac:audit_logs.export'])->group(function () {
            Route::get('/export/csv', [LoginActivityController::class, 'exportAuditCsv']);
        });
    });

    // ==================== SESSION MANAGEMENT ROUTES ====================
    Route::prefix('sessions')->middleware(['rbac:sessions.view'])->group(function () {
        Route::get('/', [SessionController::class, 'index']);
        
        Route::middleware(['rbac:sessions.terminate'])->group(function () {
            Route::delete('/{tokenId}', [SessionController::class, 'destroy']);
        });
    });

    // ==================== ADMIN ONLY ROUTES ====================
    Route::middleware(['rbac:role:admin|role:super-admin'])->group(function () {
        
        // User registration (admin only)
        Route::post('/auth/register', [AuthController::class, 'register']);
        
        // Security management
        Route::prefix('security')->group(function () {
            Route::middleware(['rbac:security.view_events'])->group(function () {
                Route::get('/failed-logins', [LoginActivityController::class, 'failedLogins']);
                Route::get('/suspicious-activity', [LoginActivityController::class, 'suspiciousActivity']);
            });
        });
    });
});

// ==================== FALLBACK ROUTES ====================

// Health check (public)
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// API version info (public)
Route::get('/version', function () {
    return response()->json([
        'api_version' => '1.0.0',
        'app_name' => config('app.name'),
        'environment' => config('app.env'),
    ]);
});
