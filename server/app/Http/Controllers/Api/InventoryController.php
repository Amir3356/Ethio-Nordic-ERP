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

    public function updateWarehouse(Request $request, int $id): JsonResponse
    {
        return $this->inventory->updateWarehouse($request, $id);
    }

    public function batches(Request $request): JsonResponse
    {
        return $this->inventory->batches($request);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        return $this->inventory->storeBatch($request);
    }

    public function updateBatch(Request $request, int $id): JsonResponse
    {
        return $this->inventory->updateBatch($request, $id);
    }

    public function deleteBatch(int $id): JsonResponse
    {
        return $this->inventory->deleteBatch($id);
    }

    public function movements(Request $request): JsonResponse
    {
        return $this->inventory->movements($request);
    }

    public function issueStock(Request $request): JsonResponse
    {
        return $this->inventory->issueStock($request);
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

    public function approveDamagedGood(int $id, Request $request): JsonResponse
    {
        return $this->inventory->approveDamagedGood($id, $request);
    }

    public function rejectDamagedGood(int $id, Request $request): JsonResponse
    {
        return $this->inventory->rejectDamagedGood($id, $request);
    }

    public function expiryMonitor(): JsonResponse
    {
        return $this->inventory->expiryMonitor();
    }

    public function valuation(): JsonResponse
    {
        return $this->inventory->valuation();
    }
}
