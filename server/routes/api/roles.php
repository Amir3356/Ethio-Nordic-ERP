<?php

use App\Http\Controllers\Api\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware('rbac:roles,view')->get('/roles', [RoleController::class, 'index']);
    Route::middleware('rbac:roles,create')->post('/roles', [RoleController::class, 'store']);
    Route::middleware('rbac:roles,view')->get('/roles/{id}', [RoleController::class, 'show']);
    Route::middleware('rbac:roles,edit')->put('/roles/{id}', [RoleController::class, 'update']);
    Route::middleware('rbac:roles,delete')->delete('/roles/{id}', [RoleController::class, 'destroy']);
});
