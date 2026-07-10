<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Inventory\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventory
    ) {}

    public function overview(): JsonResponse
    {
        return $this->inventory->overview();
    }

    public function products(Request $request): JsonResponse
    {
        return $this->inventory->products($request);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        return $this->inventory->storeProduct($request);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        return $this->inventory->updateProduct($request, $id);
    }

    public function warehouses(): JsonResponse
    {
        return $this->inventory->warehouses();
    }

    public function storeWarehouse(Request $request): JsonResponse
    {
        return $this->inventory->storeWarehouse($request);
    }

    public function batches(Request $request): JsonResponse
    {
        return $this->inventory->batches($request);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        return $this->inventory->storeBatch($request);
    }

    public function movements(Request $request): JsonResponse
    {
        return $this->inventory->movements($request);
    }

    public function adjustments(Request $request): JsonResponse
    {
        return $this->inventory->adjustments($request);
    }

    public function storeAdjustment(Request $request): JsonResponse
    {
        return $this->inventory->storeAdjustment($request);
    }

    public function approveAdjustment(int $id, Request $request): JsonResponse
    {
        return $this->inventory->approveAdjustment($id, $request);
    }

    public function reorderAlerts(): JsonResponse
    {
        return $this->inventory->reorderAlerts();
    }

    public function damagedGoods(Request $request): JsonResponse
    {
        return $this->inventory->damagedGoods($request);
    }

    public function storeDamagedGood(Request $request): JsonResponse
    {
        return $this->inventory->storeDamagedGood($request);
    }

    public function expiryMonitor(): JsonResponse
    {
        return $this->inventory->expiryMonitor();
    }

    public function valuation(): JsonResponse
    {
        return $this->inventory->valuation();
    }

    public function updateWarehouse(Request $request, int $id): JsonResponse
    {
        return $this->inventory->updateWarehouse($request, $id);
    }

    public function cycleCounts(Request $request): JsonResponse
    {
        return $this->inventory->cycleCounts($request);
    }

    public function storeCycleCount(Request $request): JsonResponse
    {
        return $this->inventory->storeCycleCount($request);
    }

    public function approveCycleCount(int $id, Request $request): JsonResponse
    {
        return $this->inventory->approveCycleCount($id, $request);
    }

    public function transfers(Request $request): JsonResponse
    {
        return $this->inventory->transfers($request);
    }

    public function storeTransfer(Request $request): JsonResponse
    {
        return $this->inventory->storeTransfer($request);
    }

    public function approveTransfer(int $id, Request $request): JsonResponse
    {
        return $this->inventory->approveTransfer($id, $request);
    }

    public function completeTransfer(int $id, Request $request): JsonResponse
    {
        return $this->inventory->completeTransfer($id, $request);
    }

    public function approveDamagedGood(int $id, Request $request): JsonResponse
    {
        return $this->inventory->approveDamagedGood($id, $request);
    }

    public function rejectDamagedGood(int $id, Request $request): JsonResponse
    {
        return $this->inventory->rejectDamagedGood($id, $request);
    }

    public function storeFefoOverride(Request $request): JsonResponse
    {
        return $this->inventory->storeFefoOverride($request);
    }

    public function stockReport(Request $request): JsonResponse
    {
        return $this->inventory->stockReport($request);
    }

    public function exportStockReport(Request $request): JsonResponse
    {
        return $this->inventory->exportStockReport($request);
    }
}
