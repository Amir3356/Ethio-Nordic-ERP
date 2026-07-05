<?php

use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware('rbac:users,view')->get('/users', [UserController::class, 'index']);
    Route::middleware('rbac:users,create')->post('/users', [UserController::class, 'store']);
    Route::middleware('rbac:users,view')->get('/users/{id}', [UserController::class, 'show']);
    Route::middleware('rbac:users,edit')->put('/users/{id}', [UserController::class, 'update']);
    Route::middleware('rbac:users,delete')->post('/users/{id}/deactivate', [UserController::class, 'deactivate']);
    Route::middleware('rbac:users,edit')->post('/users/{id}/activate', [UserController::class, 'activate']);
    Route::middleware('rbac:users,view')->get('/users/{id}/permissions', [UserController::class, 'getUserPermissions']);
    Route::middleware('rbac:users,edit')->post('/users/bulk-action', [UserController::class, 'bulkAction']);
});
