<?php

namespace App\Services\AI;

use App\Models\DamagedGood;
use App\Models\Product;
use App\Models\ReorderRule;
use App\Models\StockAdjustment;
use App\Models\StockBatch;
use App\Models\StockLedger;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIForecastingService
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.api_key');
        $this->apiUrl = config('services.openrouter.api_url');
        $this->model = config('services.openrouter.model');
    }

    /**
     * Generate demand forecast for products
     */
    public function forecastDemand(): JsonResponse
    {
        try {
            $inventoryData = $this->gatherInventoryData();

            $prompt = $this->buildDemandForecastPrompt($inventoryData);

            $response = $this->callOpenAI($prompt);

            return response()->json([
                'success' => true,
                'data' => [
                    'forecast' => $response,
                    'generated_at' => now()->toISOString(),
                    'inventory_snapshot' => $inventoryData['summary'],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AI Forecasting Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate forecast: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate reorder recommendations
     */
    public function reorderRecommendations(): JsonResponse
    {
        try {
            $inventoryData = $this->gatherInventoryData();
            $reorderRules = ReorderRule::with(['product', 'warehouse'])->get()->toArray();

            $prompt = $this->buildReorderPrompt($inventoryData, $reorderRules);

            $response = $this->callOpenAI($prompt);

            return response()->json([
                'success' => true,
                'data' => [
                    'recommendations' => $response,
                    'generated_at' => now()->toISOString(),
                    'active_rules' => count($reorderRules),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AI Reorder Recommendations Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate recommendations: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get inventory health analysis
     */
    public function inventoryHealth(): JsonResponse
    {
        try {
            $inventoryData = $this->gatherInventoryData();

            $prompt = $this->buildHealthPrompt($inventoryData);

            $response = $this->callOpenAI($prompt);

            return response()->json([
                'success' => true,
                'data' => [
                    'health_analysis' => $response,
                    'generated_at' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AI Health Analysis Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate health analysis: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Gather all inventory data for AI analysis
     */
    private function gatherInventoryData(): array
    {
        $products = Product::where('status', 'active')->get();
        $warehouses = Warehouse::where('status', 'active')->get();
        $batches = StockBatch::with(['product', 'warehouse'])->get();
        $ledger = StockLedger::orderByDesc('transaction_date')->limit(200)->get();
        $adjustments = StockAdjustment::latest('created_at')->limit(50)->get();
        $rules = ReorderRule::with(['product', 'warehouse'])->get();
        $damaged = DamagedGood::latest('created_at')->limit(30)->get();

        $totalStock = $batches->sum('available_quantity');
        $totalValue = $batches->sum(fn($b) => $b->available_quantity * $b->unit_cost);
        $lowStockCount = $rules->filter(fn($r) => $this->isLowStock($r, $batches))->count();
        $expiringSoon = $batches->filter(fn($b) => $this->isExpiringSoon($b))->count();

        return [
            'products' => $products->toArray(),
            'warehouses' => $warehouses->toArray(),
            'batches' => $batches->toArray(),
            'recent_movements' => $ledger->toArray(),
            'adjustments' => $adjustments->toArray(),
            'reorder_rules' => $rules->toArray(),
            'damaged_goods' => $damaged->toArray(),
            'summary' => [
                'total_products' => $products->count(),
                'total_warehouses' => $warehouses->count(),
                'total_batches' => $batches->count(),
                'total_stock_units' => $totalStock,
                'total_inventory_value' => round($totalValue, 2),
                'low_stock_products' => $lowStockCount,
                'expiring_batches' => $expiringSoon,
                'pending_adjustments' => $adjustments->where('status', 'pending')->count(),
            ],
        ];
    }

    private function isLowStock(ReorderRule $rule, $batches): bool
    {
        $currentStock = $batches
            ->where('product_id', $rule->product_id)
            ->where('warehouse_id', $rule->warehouse_id)
            ->sum('available_quantity');

        return $currentStock < $rule->minimum_stock_level;
    }

    private function isExpiringSoon(StockBatch $batch): bool
    {
        if (!$batch->expiry_date) return false;
        return Carbon::parse($batch->expiry_date)->diffInDays(now()) <= 90;
    }

    /**
     * Build demand forecast prompt
     */
    private function buildDemandForecastPrompt(array $data): string
    {
        $productsList = collect($data['products'])->map(fn($p) =>
            "- {$p['product_name']} (Code: {$p['product_code']})"
        )->join("\n");

        $batchesList = collect($data['batches'])->map(fn($b) =>
            "- Product ID: {$b['product_id']}, Warehouse ID: {$b['warehouse_id']}, " .
            "Available Qty: {$b['available_quantity']}, Unit Cost: {$b['unit_cost']}, " .
            "Expiry: " . ($b['expiry_date'] ?? 'N/A')
        )->join("\n");

        $movementsList = collect($data['recent_movements'])->take(50)->map(fn($m) =>
            "- Type: {$m['movement_type']}, Product ID: {$m['product_id']}, " .
            "Qty: {$m['quantity']}, Date: {$m['transaction_date']}"
        )->join("\n");

        return <<<PROMPT
You are an inventory forecasting AI for Ethio Nordic Trading PLC, a pharmaceutical distribution company in Ethiopia.

TASK: Analyze the following inventory data and provide a 30-day demand forecast.

INVENTORY SUMMARY:
- Total Products: {$data['summary']['total_products']}
- Total Stock Units: {$data['summary']['total_stock_units']}
- Total Inventory Value: {$data['summary']['total_inventory_value']} ETB
- Low Stock Products: {$data['summary']['low_stock_products']}
- Expiring Batches (90 days): {$data['summary']['expiring_batches']}

PRODUCTS:
{$productsList}

CURRENT STOCK LEVELS:
{$batchesList}

RECENT MOVEMENTS (Last 50):
{$movementsList}

Please provide:
1. Demand forecast for the next 30 days per product category
2. Products likely to run out of stock
3. Recommended reorder quantities
4. Seasonal trends if detectable
5. Risk areas requiring attention

Format your response as a structured analysis with clear sections.
PROMPT;
    }

    /**
     * Build reorder recommendations prompt
     */
    private function buildReorderPrompt(array $data, array $rules): string
    {
        $rulesList = collect($rules)->map(fn($r) =>
            "- Product ID: {$r['product_id']}, Warehouse ID: {$r['warehouse_id']}, " .
            "Min Stock: {$r['minimum_stock_level']}, Reorder Point: {$r['reorder_point']}, " .
            "Reorder Qty: {$r['reorder_quantity']}, Auto: " . ($r['auto_purchase_request'] ? 'Yes' : 'No')
        )->join("\n");

        $batchesList = collect($data['batches'])->map(fn($b) =>
            "- Product ID: {$b['product_id']}, Warehouse ID: {$b['warehouse_id']}, " .
            "Available: {$b['available_quantity']}, Expiry: " . ($b['expiry_date'] ?? 'N/A')
        )->join("\n");

        return <<<PROMPT
You are an inventory reorder optimization AI for Ethio Nordic Trading PLC.

TASK: Analyze current stock levels against reorder rules and provide actionable recommendations.

CURRENT STOCK LEVELS:
{$batchesList}

ACTIVE REORDER RULES:
{$rulesList}

DAMAGED GOODS (Pending): {$data['summary']['pending_adjustments']}

Please provide:
1. Products that need immediate reorder (below minimum stock)
2. Products approaching reorder point (within 20% of reorder point)
3. Recommended order quantities based on current stock and lead times
4. Priority ranking for reorder actions
5. Cost estimates for recommended reorders

Consider:
- FEFO compliance (first expiry, first out)
- Pharmaceutical shelf life constraints
- Warehouse capacity
- Seasonal demand patterns

Format as actionable recommendations with priority levels.
PROMPT;
    }

    /**
     * Build health analysis prompt
     */
    private function buildHealthPrompt(array $data): string
    {
        $damagedList = collect($data['damaged_goods'])->map(fn($d) =>
            "- Product ID: {$d['product_id']}, Qty: {$d['quantity']}, " .
            "Reason: {$d['damage_reason']}, Status: {$d['disposition_status']}"
        )->join("\n");

        return <<<PROMPT
You are an inventory health analyst for Ethio Nordic Trading PLC.

TASK: Provide a comprehensive inventory health analysis.

INVENTORY SUMMARY:
- Total Products: {$data['summary']['total_products']}
- Total Stock Units: {$data['summary']['total_stock_units']}
- Total Inventory Value: {$data['summary']['total_inventory_value']} ETB
- Low Stock Products: {$data['summary']['low_stock_products']}
- Expiring Batches (90 days): {$data['summary']['expiring_batches']}

DAMAGED GOODS (Recent):
{$damagedList}

Please analyze:
1. Overall inventory health score (1-100)
2. Stock efficiency metrics
3. Waste reduction opportunities (damaged/expired goods)
4. Warehouse utilization assessment
5. Critical issues requiring immediate attention
6. Recommendations for improvement

Provide specific, actionable insights for a pharmaceutical distributor.
PROMPT;
    }

    /**
     * Call OpenRouter API with reasoning enabled
     */
    private function callOpenAI(string $prompt): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post($this->apiUrl, [
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'reasoning' => ['enabled' => true],
        ]);

        if ($response->failed()) {
            throw new \Exception('API request failed with status: ' . $response->status());
        }

        $result = $response->json();

        if (!isset($result['choices'][0]['message'])) {
            throw new \Exception('Invalid API response format');
        }

        $message = $result['choices'][0]['message'];

        return [
            'content' => $message['content'] ?? '',
            'reasoning' => $message['reasoning_details'] ?? null,
        ];
    }
}
