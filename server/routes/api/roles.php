<?php

use App\Http\Controllers\Api\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
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
});
