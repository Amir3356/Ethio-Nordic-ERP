<?php

use App\Http\Controllers\Api\PermissionAssignmentController;
use App\Http\Controllers\Api\PermissionBulkController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\PermissionGeneratorController;
use App\Http\Controllers\Api\PermissionReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('permissions')->middleware(['rbac:permissions.view'])->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::get('/{id}', [PermissionController::class, 'show']);
        Route::get('/modules/list', [PermissionReportController::class, 'getModules']);
        Route::get('/actions/list', [PermissionReportController::class, 'getActions']);
        Route::get('/grouped/by-module', [PermissionReportController::class, 'getGroupedByModule']);
        Route::get('/matrix/roles', [PermissionReportController::class, 'getRoleMatrix']);

        Route::middleware(['rbac:permissions.create'])->group(function () {
            Route::post('/', [PermissionController::class, 'store']);
            Route::post('/bulk-create', [PermissionBulkController::class, 'bulkCreate']);
            Route::post('/generate-standard', [PermissionGeneratorController::class, 'generateStandardPermissions']);
        });

        Route::middleware(['rbac:permissions.edit'])->group(function () {
            Route::put('/{id}', [PermissionController::class, 'update']);
        });

        Route::middleware(['rbac:permissions.delete'])->group(function () {
            Route::delete('/{id}', [PermissionController::class, 'destroy']);
        });

        // Permission assignment to roles
        Route::middleware(['rbac:permissions.assign'])->group(function () {
            Route::post('/roles/{roleId}/assign', [PermissionAssignmentController::class, 'assignToRole']);
            Route::post('/roles/{roleId}/remove', [PermissionAssignmentController::class, 'removeFromRole']);
            Route::post('/roles/{roleId}/sync', [PermissionAssignmentController::class, 'syncRolePermissions']);
        });
    });
});
