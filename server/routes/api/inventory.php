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

        // Stock Batches
        Route::get('/batches', [InventoryController::class, 'batches']);
        Route::post('/batches', [InventoryController::class, 'storeBatch']);

        // Stock Movements
        Route::get('/movements', [InventoryController::class, 'movements']);

        // Stock Adjustments
        Route::get('/adjustments', [InventoryController::class, 'adjustments']);
        Route::post('/adjustments', [InventoryController::class, 'storeAdjustment']);
        Route::post('/adjustments/{id}/approve', [InventoryController::class, 'approveAdjustment']);

        // Reorder Alerts
        Route::get('/reorder-alerts', [InventoryController::class, 'reorderAlerts']);

        // Damaged Goods
        Route::get('/damaged-goods', [InventoryController::class, 'damagedGoods']);
        Route::post('/damaged-goods', [InventoryController::class, 'storeDamagedGood']);

        // Expiry Monitor
        Route::get('/expiry-monitor', [InventoryController::class, 'expiryMonitor']);

        // Valuation
        Route::get('/valuation', [InventoryController::class, 'valuation']);

        // Warehouses - update
        Route::put('/warehouses/{id}', [InventoryController::class, 'updateWarehouse']);

        // Cycle Counts
        Route::get('/cycle-counts', [InventoryController::class, 'cycleCounts']);
        Route::post('/cycle-counts', [InventoryController::class, 'storeCycleCount']);
        Route::post('/cycle-counts/{id}/approve', [InventoryController::class, 'approveCycleCount']);

        // Stock Transfers
        Route::get('/transfers', [InventoryController::class, 'transfers']);
        Route::post('/transfers', [InventoryController::class, 'storeTransfer']);
        Route::post('/transfers/{id}/approve', [InventoryController::class, 'approveTransfer']);
        Route::post('/transfers/{id}/complete', [InventoryController::class, 'completeTransfer']);

        // Damaged Goods - approve/reject
        Route::post('/damaged-goods/{id}/approve', [InventoryController::class, 'approveDamagedGood']);
        Route::post('/damaged-goods/{id}/reject', [InventoryController::class, 'rejectDamagedGood']);

        // FEFO Override
        Route::post('/fefo-overrides', [InventoryController::class, 'storeFefoOverride']);

        // Reports
        Route::get('/reports/stock', [InventoryController::class, 'stockReport']);
        Route::get('/reports/stock/export', [InventoryController::class, 'exportStockReport']);
    });
});
