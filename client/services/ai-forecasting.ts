import { api } from './client';

export interface AIForecastResponse {
  success: boolean;
  data: {
    forecast: {
      content: string;
    };
    generated_at: string;
    inventory_snapshot: {
      total_products: number;
      total_warehouses: number;
      total_batches: number;
      total_stock_units: number;
      total_inventory_value: number;
      low_stock_products: number;
      expiring_batches: number;
      pending_adjustments: number;
    };
  };
}

export interface AIReorderResponse {
  success: boolean;
  data: {
    recommendations: {
      content: string;
    };
    generated_at: string;
    active_rules: number;
  };
}

export interface AIHealthResponse {
  success: boolean;
  data: {
    health_analysis: {
      content: string;
    };
    generated_at: string;
  };
}

export const aiForecastingAPI = {
  getDemandForecast: () =>
    api.get<AIForecastResponse>('/ai-forecasting/demand-forecast'),

  getReorderRecommendations: () =>
    api.get<AIReorderResponse>('/ai-forecasting/reorder-recommendations'),

  getInventoryHealth: () =>
    api.get<AIHealthResponse>('/ai-forecasting/inventory-health'),
};
