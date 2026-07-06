<?php

use App\Http\Controllers\Api\PermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
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
});
