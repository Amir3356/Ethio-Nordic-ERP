<?php

use App\Http\Controllers\Api\AIForecastingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'idle.session'])->group(function () {
    Route::prefix('ai-forecasting')->group(function () {
        Route::get('/demand-forecast', [AIForecastingController::class, 'forecastDemand']);
        Route::get('/reorder-recommendations', [AIForecastingController::class, 'reorderRecommendations']);
        Route::get('/inventory-health', [AIForecastingController::class, 'inventoryHealth']);
    });
});
