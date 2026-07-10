<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\AIForecastingService;
use Illuminate\Http\JsonResponse;

class AIForecastingController extends Controller
{
    public function __construct(
        private readonly AIForecastingService $aiForecasting
    ) {}

    /**
     * Generate demand forecast
     */
    public function forecastDemand(): JsonResponse
    {
        return $this->aiForecasting->forecastDemand();
    }

    /**
     * Generate reorder recommendations
     */
    public function reorderRecommendations(): JsonResponse
    {
        return $this->aiForecasting->reorderRecommendations();
    }

    /**
     * Get inventory health analysis
     */
    public function inventoryHealth(): JsonResponse
    {
        return $this->aiForecasting->inventoryHealth();
    }
}
