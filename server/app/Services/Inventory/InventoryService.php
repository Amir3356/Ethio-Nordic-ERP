<?php

namespace App\Services\Inventory;

use App\Models\DamagedGood;
use App\Models\Product;
use App\Models\ReorderRule;
use App\Models\StockAdjustment;
use App\Models\StockBatch;
use App\Models\StockLedger;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryService
{
    public function overview(): JsonResponse
    {
        $products = Product::where('status', 'active')->get();
        $warehouses = Warehouse::where('status', 'active')->get();
        $batches = StockBatch::with(['product', 'warehouse'])->get();
        $ledger = StockLedger::with(['product', 'warehouse'])
            ->orderByDesc('transaction_date')
            ->limit(100)
            ->get();
        $adjustments = StockAdjustment::with(['product', 'warehouse', 'batch'])
            ->latest('created_at')
            ->limit(50)
            ->get();
        $rules = ReorderRule::with(['product', 'warehouse'])->get();
        $damaged = DamagedGood::with(['product', 'warehouse', 'batch'])
            ->latest('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products,
                'warehouses' => $warehouses,
                'stock_batches' => $batches,
                'stock_ledger' => $ledger,
                'stock_adjustments' => $adjustments,
                'reorder_rules' => $rules,
                'damaged_goods' => $damaged,
            ],
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                  ->orWhere('product_code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->orderBy('product_name')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $products]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_code' => 'required|string|unique:products,product_code',
            'product_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|integer',
            'unit_of_measure' => 'required|string|max:50',
            'requires_batch_tracking' => 'sometimes|boolean',
            'requires_expiry_tracking' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        $product = Product::create($validated);

        return response()->json(['success' => true, 'data' => $product], 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'product_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|integer',
            'unit_of_measure' => 'sometimes|string|max:50',
            'requires_batch_tracking' => 'sometimes|boolean',
            'requires_expiry_tracking' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        $product->update($validated);

        return response()->json(['success' => true, 'data' => $product->fresh()]);
    }

    public function warehouses(): JsonResponse
    {
        $warehouses = Warehouse::where('status', 'active')->get();

        return response()->json(['success' => true, 'data' => $warehouses]);
    }

    public function storeWarehouse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_code' => 'required|string|unique:warehouses,warehouse_code',
            'warehouse_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'warehouse_type' => 'required|string|max:100',
            'capacity' => 'required|numeric|min:0',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json(['success' => true, 'data' => $warehouse], 201);
    }

    public function updateWarehouse(Request $request, int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        $validated = $request->validate([
            'warehouse_name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'warehouse_type' => 'sometimes|string|max:100',
            'capacity' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        $warehouse->update($validated);

        return response()->json(['success' => true, 'data' => $warehouse->fresh()]);
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

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('batch_number', 'like', "%{$search}%")
                  ->orWhere('receipt_reference', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('product_name', 'like', "%{$search}%")
                        ->orWhere('product_code', 'like', "%{$search}%");
                  });
            });
        }

        $batches = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $batches]);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required',
            'warehouse_id' => 'required',
            'batch_number' => 'required|string',
            'quantity_received' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',
            'manufacture_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:manufacture_date',
            'supplier_id' => 'nullable|integer',
            'receipt_reference' => 'nullable|string|max:255',
            'batch_status' => 'sometimes|string|in:available,expired,quarantined,consumed',
        ]);

        $productId = $validated['product_id'];
        if (!is_numeric($productId)) {
            $product = Product::where('product_name', $productId)
                ->orWhere('product_code', $productId)
                ->first();
            if (!$product) {
                return response()->json(['success' => false, 'message' => 'Product not found'], 422);
            }
            $productId = $product->product_id;
        }

        $warehouseId = $validated['warehouse_id'];
        if (!is_numeric($warehouseId)) {
            $warehouse = Warehouse::where('warehouse_name', $warehouseId)
                ->orWhere('warehouse_code', $warehouseId)
                ->first();
            if (!$warehouse) {
                return response()->json(['success' => false, 'message' => 'Warehouse not found'], 422);
            }
            $warehouseId = $warehouse->warehouse_id;
        }

        $quantity = $validated['quantity_received'];

        $batch = StockBatch::create([
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'batch_number' => $validated['batch_number'],
            'quantity_received' => $quantity,
            'available_quantity' => $quantity,
            'unit_cost' => $validated['unit_cost'],
            'manufacture_date' => $validated['manufacture_date'] ?? null,
            'expiry_date' => $validated['expiry_date'] ?? null,
            'supplier_id' => $validated['supplier_id'] ?? null,
            'receipt_reference' => $validated['receipt_reference'] ?? null,
            'batch_status' => $validated['batch_status'] ?? 'available',
        ]);

        StockLedger::create([
            'product_id' => $batch->product_id,
            'warehouse_id' => $batch->warehouse_id,
            'batch_id' => $batch->batch_id,
            'movement_type' => 'stock-in',
            'quantity' => $batch->available_quantity,
            'balance_after' => $batch->available_quantity,
            'reference_type' => 'goods_receipt',
            'reference_id' => null,
            'transaction_date' => now(),
            'created_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'data' => $batch], 201);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = StockLedger::with(['product', 'warehouse', 'batch']);

        if ($request->filled('type') || $request->filled('movement_type')) {
            $query->where('movement_type', $request->input('movement_type', $request->input('type')));
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
                $q->where('reference_type', 'like', "%{$search}%")
                  ->orWhere('movement_type', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('product_name', 'like', "%{$search}%");
                  });
            });
        }

        $movements = $query->orderByDesc('transaction_date')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $movements]);
    }

    public function adjustments(Request $request): JsonResponse
    {
        $query = StockAdjustment::with(['product', 'warehouse', 'batch']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $adjustments = $query->latest('created_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $adjustments]);
    }

    public function storeAdjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'batch_id' => 'required|exists:stock_batches,batch_id',
            'adjustment_type' => 'required|string|in:increase,decrease',
            'quantity' => 'required|numeric|min:0.01',
            'reason_code' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'supporting_document' => 'nullable|string|max:500',
        ]);

        $batch = StockBatch::findOrFail($validated['batch_id']);
        $signedQty = $validated['adjustment_type'] === 'decrease'
            ? -abs($validated['quantity'])
            : abs($validated['quantity']);
        $quantityAfter = (float) $batch->available_quantity + $signedQty;

        if ($quantityAfter < 0) {
            return response()->json(['success' => false, 'message' => 'Adjustment would result in negative stock.'], 422);
        }

        $adjustment = StockAdjustment::create([
            'product_id' => $validated['product_id'],
            'warehouse_id' => $validated['warehouse_id'],
            'batch_id' => $validated['batch_id'],
            'adjustment_type' => $validated['adjustment_type'],
            'quantity' => abs($validated['quantity']),
            'reason_code' => $validated['reason_code'] ?? null,
            'description' => $validated['description'] ?? null,
            'supporting_document' => $validated['supporting_document'] ?? null,
            'status' => 'pending',
            'requested_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'data' => $adjustment], 201);
    }

    public function approveAdjustment(int $id, Request $request): JsonResponse
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Adjustment is not pending.'], 422);
        }

        $batch = StockBatch::findOrFail($adjustment->batch_id);
        $signedQty = $adjustment->adjustment_type === 'decrease'
            ? -abs((float) $adjustment->quantity)
            : abs((float) $adjustment->quantity);
        $quantityAfter = (float) $batch->available_quantity + $signedQty;

        if ($quantityAfter < 0) {
            return response()->json(['success' => false, 'message' => 'Adjustment would result in negative stock.'], 422);
        }

        $adjustment->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        $batch->update(['available_quantity' => $quantityAfter]);

        StockLedger::create([
            'product_id' => $adjustment->product_id,
            'warehouse_id' => $adjustment->warehouse_id,
            'batch_id' => $adjustment->batch_id,
            'movement_type' => 'adjustment',
            'quantity' => $signedQty,
            'balance_after' => $quantityAfter,
            'reference_type' => 'stock_adjustment',
            'reference_id' => $adjustment->adjustment_id,
            'transaction_date' => now(),
            'created_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'data' => $adjustment->fresh()]);
    }

    public function reorderAlerts(): JsonResponse
    {
        $rules = ReorderRule::with(['product', 'warehouse'])
            ->where('alert_enabled', true)
            ->get();
        $batches = StockBatch::all();

        $alerts = $rules->map(function ($rule) use ($batches) {
            $productBatches = $batches
                ->where('product_id', $rule->product_id)
                ->where('warehouse_id', $rule->warehouse_id);
            $totalStock = $productBatches->sum('available_quantity');

            if ($totalStock <= (float) $rule->reorder_point) {
                return [
                    'product' => $rule->product,
                    'warehouse' => $rule->warehouse,
                    'total_stock' => $totalStock,
                    'reorder_point' => $rule->reorder_point,
                    'minimum_stock_level' => $rule->minimum_stock_level,
                    'reorder_quantity' => $rule->reorder_quantity,
                ];
            }

            return null;
        })->filter()->values();

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
        $query = DamagedGood::with(['product', 'warehouse', 'batch']);

        if ($request->filled('status') || $request->filled('disposition_status')) {
            $query->where(
                'disposition_status',
                $request->input('disposition_status', $request->input('status'))
            );
        }

        $goods = $query->latest('created_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $goods]);
    }

    public function storeDamagedGood(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'batch_id' => 'required|exists:stock_batches,batch_id',
            'quantity' => 'required|numeric|min:0.01',
            'damage_reason' => 'required|string|max:255',
            'supporting_photos' => 'nullable|string|max:1000',
        ]);

        $record = DamagedGood::create([
            ...$validated,
            'disposition_status' => 'pending',
            'reported_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'data' => $record], 201);
    }

    public function approveDamagedGood(int $id, Request $request): JsonResponse
    {
        $damaged = DamagedGood::findOrFail($id);

        if ($damaged->disposition_status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Record is not pending.'], 422);
        }

        $batch = StockBatch::findOrFail($damaged->batch_id);
        $newQuantity = (float) $batch->available_quantity - (float) $damaged->quantity;

        if ($newQuantity < 0) {
            return response()->json(['success' => false, 'message' => 'Insufficient stock to write off.'], 422);
        }

        $batch->update(['available_quantity' => $newQuantity]);

        StockLedger::create([
            'product_id' => $damaged->product_id,
            'warehouse_id' => $damaged->warehouse_id,
            'batch_id' => $damaged->batch_id,
            'movement_type' => 'write-off',
            'quantity' => -$damaged->quantity,
            'balance_after' => $newQuantity,
            'reference_type' => 'damaged_goods',
            'reference_id' => $damaged->damaged_goods_id,
            'transaction_date' => now(),
            'created_by' => $request->user()?->id,
        ]);

        $damaged->update([
            'disposition_status' => 'approved',
            'approved_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'data' => $damaged->fresh()]);
    }

    public function rejectDamagedGood(int $id, Request $request): JsonResponse
    {
        $damaged = DamagedGood::findOrFail($id);

        if ($damaged->disposition_status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Record is not pending.'], 422);
        }

        $damaged->update([
            'disposition_status' => 'rejected',
            'approved_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'data' => $damaged->fresh()]);
    }

    public function expiryMonitor(): JsonResponse
    {
        $batches = StockBatch::with(['product', 'warehouse'])
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '>=', now())
            ->where('available_quantity', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        $expiring90 = $batches->filter(fn ($b) => $b->expiry_date->diffInDays(now()) <= 90);
        $expiring60 = $batches->filter(fn ($b) => $b->expiry_date->diffInDays(now()) <= 60);
        $expiring30 = $batches->filter(fn ($b) => $b->expiry_date->diffInDays(now()) <= 30);

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
        $batches = StockBatch::with(['product', 'warehouse'])->get();

        $byProduct = $batches->groupBy('product_id')->map(function ($productBatches, $productId) {
            $product = Product::find($productId);
            $totalQty = $productBatches->sum('available_quantity');
            $totalValue = $productBatches->sum(fn ($b) => $b->available_quantity * $b->unit_cost);

            return [
                'product' => $product,
                'total_quantity' => $totalQty,
                'total_value' => $totalValue,
                'avg_cost' => $totalQty > 0 ? $totalValue / $totalQty : 0,
                'batch_count' => $productBatches->count(),
            ];
        })->filter()->values();

        $byWarehouse = $batches->groupBy('warehouse_id')->map(function ($whBatches, $whId) {
            $warehouse = Warehouse::find($whId);

            return [
                'warehouse' => $warehouse,
                'total_quantity' => $whBatches->sum('available_quantity'),
                'total_value' => $whBatches->sum(fn ($b) => $b->available_quantity * $b->unit_cost),
                'batch_count' => $whBatches->count(),
            ];
        })->filter()->values();

        $totalValue = $batches->sum(fn ($b) => $b->available_quantity * $b->unit_cost);

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
