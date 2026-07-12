<?php

use App\Http\Controllers\Api\InventoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'idle.session'])->group(function () {
    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'overview']);

        // Products
        Route::get('/products', [InventoryController::class, 'products']);
        Route::post('/products', [InventoryController::class, 'storeProduct']);
        Route::put('/products/{id}', [InventoryController::class, 'updateProduct']);

        // Warehouses
        Route::get('/warehouses', [InventoryController::class, 'warehouses']);
        Route::post('/warehouses', [InventoryController::class, 'storeWarehouse']);
        Route::put('/warehouses/{id}', [InventoryController::class, 'updateWarehouse']);

        // Stock Batches
        Route::get('/batches', [InventoryController::class, 'batches']);
        Route::post('/batches', [InventoryController::class, 'storeBatch']);

        // Stock Movements (Ledger)
        Route::get('/movements', [InventoryController::class, 'movements']);

        // Stock Issuance (FEFO-enforced stock-out)
        Route::post('/issue', [InventoryController::class, 'issueStock']);

        // Stock Adjustments
        Route::get('/adjustments', [InventoryController::class, 'adjustments']);
        Route::post('/adjustments', [InventoryController::class, 'storeAdjustment']);
        Route::post('/adjustments/{id}/approve', [InventoryController::class, 'approveAdjustment']);

        // Reorder Alerts
        Route::get('/reorder-alerts', [InventoryController::class, 'reorderAlerts']);

        // Damaged Goods
        Route::get('/damaged-goods', [InventoryController::class, 'damagedGoods']);
        Route::post('/damaged-goods', [InventoryController::class, 'storeDamagedGood']);
        Route::post('/damaged-goods/{id}/approve', [InventoryController::class, 'approveDamagedGood']);
        Route::post('/damaged-goods/{id}/reject', [InventoryController::class, 'rejectDamagedGood']);

        // Expiry Monitor
        Route::get('/expiry-monitor', [InventoryController::class, 'expiryMonitor']);

        // Valuation
        Route::get('/valuation', [InventoryController::class, 'valuation']);
    });
});
