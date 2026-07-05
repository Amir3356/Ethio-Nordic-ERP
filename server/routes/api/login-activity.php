<?php

use App\Http\Controllers\Api\LoginActivityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware('rbac:login-activity,view')->get('/login-activity', [LoginActivityController::class, 'index']);
    Route::middleware('rbac:login-activity,view')->get('/login-activity/user/{id}', [LoginActivityController::class, 'userActivity']);
    Route::middleware('rbac:login-activity,view')->get('/login-activity/stats', [LoginActivityController::class, 'stats']);
    Route::middleware('rbac:login-activity,view')->get('/login-activity/online', [LoginActivityController::class, 'onlineUsers']);
});
