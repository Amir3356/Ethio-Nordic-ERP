<?php

namespace App\Services\Inventory;

use App\Models\Product;
use App\Models\StockBatch;
use App\Models\StockLedger;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryService
{
    public function overview(): JsonResponse
    {
        $products = Product::where('is_active', true)->get();
        $warehouses = Warehouse::where('is_active', true)->get();
        $batches = StockBatch::with(['product', 'warehouse'])->get();
        $ledger = StockLedger::with(['product', 'warehouse'])->latest()->limit(100)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products,
                'warehouses' => $warehouses,
                'stock_batches' => $batches,
                'stock_ledger' => $ledger,
            ],
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $products = $query->orderBy('name')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $products]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:products,sku',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'fifo_fefo' => 'required|in:FIFO,FEFO',
        ]);

        $product = Product::create($validated);

        return response()->json(['success' => true, 'data' => $product], 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:255',
            'unit' => 'sometimes|string|max:50',
            'min_stock' => 'sometimes|numeric|min:0',
            'reorder_level' => 'sometimes|numeric|min:0',
            'fifo_fefo' => 'sometimes|in:FIFO,FEFO',
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($validated);

        return response()->json(['success' => true, 'data' => $product->fresh()]);
    }

    public function warehouses(): JsonResponse
    {
        $warehouses = Warehouse::where('is_active', true)->get();
        return response()->json(['success' => true, 'data' => $warehouses]);
    }

    public function storeWarehouse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:warehouses,code',
            'city' => 'required|string|max:255',
            'capacity_sqm' => 'required|numeric|min:0',
            'manager' => 'nullable|string|max:255',
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json(['success' => true, 'data' => $warehouse], 201);
    }

    public function batches(Request $request): JsonResponse
    {
        $query = StockBatch::with(['product', 'warehouse']);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('batch_no', 'like', "%{$search}%")
                  ->orWhereHas('product', fn($pq) => $pq->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"));
            });
        }

        $batches = $query->orderBy('received_date', 'desc')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $batches]);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'batch_no' => 'required|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',
            'manufacture_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:manufacture_date',
            'received_date' => 'required|date',
        ]);

        $batch = StockBatch::create($validated);

        StockLedger::create([
            'product_id' => $batch->product_id,
            'warehouse_id' => $batch->warehouse_id,
            'batch_id' => $batch->id,
            'type' => 'stock-in',
            'quantity' => $batch->quantity,
            'unit_cost' => $batch->unit_cost,
            'reference' => 'GRN-' . $batch->batch_no,
            'reference_type' => 'goods_receipt',
            'created_by' => $request->user()->full_name ?? 'System',
            'notes' => 'Initial stock receipt',
        ]);

        return response()->json(['success' => true, 'data' => $batch], 201);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = StockLedger::with(['product', 'warehouse', 'batch']);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('product', fn($pq) => $pq->where('name', 'like', "%{$search}%"));
            });
        }

        $movements = $query->latest('created_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $movements]);
    }

    public function adjustments(Request $request): JsonResponse
    {
        $query = StockAdjustment::with(['product', 'warehouse', 'batch']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $adjustments = $query->latest('requested_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $adjustments]);
    }

    public function storeAdjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'batch_id' => 'required|exists:stock_batches,id',
            'adjustment_qty' => 'required|numeric',
            'reason' => 'required|string|max:500',
            'reason_code' => 'nullable|string',
        ]);

        $batch = StockBatch::findOrFail($validated['batch_id']);
        $quantityBefore = $batch->quantity;
        $quantityAfter = $quantityBefore + $validated['adjustment_qty'];

        if ($quantityAfter < 0) {
            return response()->json(['success' => false, 'message' => 'Adjustment would result in negative stock.'], 422);
        }

        $adjustment = \App\Models\StockAdjustment::create([
            ...$validated,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'status' => 'pending',
            'requested_by' => $request->user()->full_name ?? 'Unknown',
            'requested_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $adjustment], 201);
    }

    public function approveAdjustment(int $id, Request $request): JsonResponse
    {
        $adjustment = \App\Models\StockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Adjustment is not pending.'], 422);
        }

        $adjustment->update([
            'status' => 'approved',
            'approved_by' => $request->user()->full_name ?? 'Unknown',
            'approved_at' => now(),
        ]);

        $batch = StockBatch::findOrFail($adjustment->batch_id);
        $batch->update(['quantity' => $adjustment->quantity_after]);

        StockLedger::create([
            'product_id' => $adjustment->product_id,
            'warehouse_id' => $adjustment->warehouse_id,
            'batch_id' => $adjustment->batch_id,
            'type' => 'adjustment',
            'quantity' => $adjustment->adjustment_qty,
            'unit_cost' => $batch->unit_cost,
            'reference' => 'ADJ-' . $adjustment->id,
            'reference_type' => 'stock_adjustment',
            'created_by' => $request->user()->full_name ?? 'System',
            'notes' => $adjustment->reason,
        ]);

        if ($batch->quantity <= 0) {
            $batch->update(['status' => 'depleted']);
        }

        return response()->json(['success' => true, 'data' => $adjustment->fresh()]);
    }

    public function reorderAlerts(): JsonResponse
    {
        $products = Product::where('is_active', true)->get();
        $batches = StockBatch::where('status', 'active')->get();

        $alerts = $products->map(function ($product) use ($batches) {
            $productBatches = $batches->where('product_id', $product->id);
            $totalStock = $productBatches->sum('quantity');

            if ($totalStock <= $product->reorder_level) {
                $warehouseStocks = $productBatches->groupBy('warehouse_id')->map(function ($whBatches, $whId) {
                    return ['warehouse_id' => $whId, 'quantity' => $whBatches->sum('quantity')];
                })->values();

                return [
                    'product' => $product,
                    'total_stock' => $totalStock,
                    'reorder_level' => $product->reorder_level,
                    'min_stock' => $product->min_stock,
                    'warehouse_stocks' => $warehouseStocks,
                ];
            }

            return null;
        })->filter()->values();

        $rules = \App\Models\ReorderRule::with(['product', 'warehouse'])->get();

        return response()->json([
            'success' => true,
            'data' => [
                'alerts' => $alerts,
                'rules' => $rules,
            ],
        ]);
    }

    public function damagedGoods(Request $request): JsonResponse
    {
        $query = \App\Models\DamagedGood::with(['product', 'warehouse', 'batch']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $goods = $query->latest('reported_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $goods]);
    }

    public function storeDamagedGood(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'batch_id' => 'required|exists:stock_batches,id',
            'quantity' => 'required|numeric|min:0.01',
            'damage_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'photos' => 'nullable|array',
        ]);

        $record = \App\Models\DamagedGood::create([
            ...$validated,
            'status' => 'pending_review',
            'reported_by' => $request->user()->full_name ?? 'Unknown',
            'reported_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $record], 201);
    }

    public function expiryMonitor(): JsonResponse
    {
        $batches = StockBatch::with(['product', 'warehouse'])
            ->where('status', 'active')
            ->where('expiry_date', '>=', now())
            ->orderBy('expiry_date')
            ->get();

        $expiring90 = $batches->filter(fn($b) => $b->expiry_date->diffInDays(now()) <= 90);
        $expiring60 = $batches->filter(fn($b) => $b->expiry_date->diffInDays(now()) <= 60);
        $expiring30 = $batches->filter(fn($b) => $b->expiry_date->diffInDays(now()) <= 30);

        return response()->json([
            'success' => true,
            'data' => [
                'expiring_90_days' => $expiring90->values(),
                'expiring_60_days' => $expiring60->values(),
                'expiring_30_days' => $expiring30->values(),
                'total_expiring' => $expiring90->count(),
            ],
        ]);
    }

    public function valuation(): JsonResponse
    {
        $batches = StockBatch::with(['product', 'warehouse'])
            ->where('status', 'active')
            ->get();

        $byProduct = $batches->groupBy('product_id')->map(function ($whBatches, $productId) {
            $product = Product::find($productId);
            $totalQty = $whBatches->sum('quantity');
            $totalValue = $whBatches->sum(fn($b) => $b->quantity * $b->unit_cost);
            return [
                'product' => $product,
                'total_quantity' => $totalQty,
                'total_value' => $totalValue,
                'avg_cost' => $totalQty > 0 ? $totalValue / $totalQty : 0,
                'batch_count' => $whBatches->count(),
            ];
        })->filter()->values();

        $byWarehouse = $batches->groupBy('warehouse_id')->map(function ($whBatches, $whId) {
            $warehouse = Warehouse::find($whId);
            return [
                'warehouse' => $warehouse,
                'total_quantity' => $whBatches->sum('quantity'),
                'total_value' => $whBatches->sum(fn($b) => $b->quantity * $b->unit_cost),
                'batch_count' => $whBatches->count(),
            ];
        })->filter()->values();

        $totalValue = $batches->sum(fn($b) => $b->quantity * $b->unit_cost);

        return response()->json([
            'success' => true,
            'data' => [
                'total_value' => $totalValue,
                'by_product' => $byProduct,
                'by_warehouse' => $byWarehouse,
            ],
        ]);
    }
}
