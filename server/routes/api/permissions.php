<?php

use App\Http\Controllers\Api\PermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware('rbac:permissions,view')->get('/permissions', [PermissionController::class, 'index']);
    Route::middleware('rbac:permissions,view')->get('/permissions/{id}', [PermissionController::class, 'show']);
    Route::middleware('rbac:permissions,view')->get('/permissions/module/{module}', [PermissionController::class, 'byModule']);
});
