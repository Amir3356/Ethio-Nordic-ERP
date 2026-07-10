import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../../services/inventory';
import type {
  InventoryData,
  Product,
  Warehouse,
  StockBatch,
} from './types';

export function useInventory() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getOverview();
      const payload = response.data?.data ?? response.data;
      setData({
        products: payload.products ?? [],
        warehouses: payload.warehouses ?? [],
        stock_batches: payload.stock_batches ?? [],
        stock_ledger: payload.stock_ledger ?? [],
        stock_adjustments: payload.stock_adjustments ?? [],
        reorder_rules: payload.reorder_rules ?? [],
        damaged_goods: payload.damaged_goods ?? [],
      });
      setError('');
    } catch (err) {
      setError('Failed to load inventory data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getProduct = useCallback(
    (id: string): Product | undefined =>
      data?.products.find((p) => String(p.product_id) === String(id)),
    [data]
  );

  const getWarehouse = useCallback(
    (id: string): Warehouse | undefined =>
      data?.warehouses.find((w) => String(w.warehouse_id) === String(id)),
    [data]
  );

  const getBatchesForProduct = useCallback(
    (productId: string): StockBatch[] =>
      data?.stock_batches.filter((b) => String(b.product_id) === String(productId)) || [],
    [data]
  );

  const getLowStockProducts = useCallback((): Array<{
    product: Product;
    totalStock: number;
    warehouseStocks: Array<{ warehouse: Warehouse; quantity: number }>;
  }> => {
    if (!data) return [];

    const rulesByProduct = new Map<string, number>();
    data.reorder_rules.forEach((rule) => {
      const key = String(rule.product_id);
      const current = rulesByProduct.get(key);
      if (current === undefined || Number(rule.reorder_point) < current) {
        rulesByProduct.set(key, Number(rule.reorder_point));
      }
    });

    return data.products
      .map((product) => {
        const batches = data.stock_batches.filter(
          (b) => String(b.product_id) === String(product.product_id)
        );
        const totalStock = batches.reduce((sum, b) => sum + Number(b.available_quantity), 0);
        const reorderPoint = rulesByProduct.get(String(product.product_id));
        if (reorderPoint === undefined || totalStock > reorderPoint) {
          return null;
        }

        const warehouseMap = new Map<string, number>();
        batches.forEach((b) => {
          const wid = String(b.warehouse_id);
          warehouseMap.set(wid, (warehouseMap.get(wid) || 0) + Number(b.available_quantity));
        });
        const warehouseStocks = Array.from(warehouseMap.entries()).map(([wid, qty]) => ({
          warehouse: data.warehouses.find((w) => String(w.warehouse_id) === wid)!,
          quantity: qty,
        }));
        return { product, totalStock, warehouseStocks };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [data]);

  const getExpiringBatches = useCallback(
    (daysThreshold: number = 90): StockBatch[] => {
      if (!data) return [];
      const now = new Date();
      const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
      return data.stock_batches.filter((b) => {
        if (!b.expiry_date) return false;
        const expiry = new Date(b.expiry_date);
        return expiry <= threshold && expiry >= now && Number(b.available_quantity) > 0;
      });
    },
    [data]
  );

  const getInventoryValue = useCallback((): number => {
    if (!data) return 0;
    return data.stock_batches.reduce(
      (sum, b) => sum + Number(b.available_quantity) * Number(b.unit_cost),
      0
    );
  }, [data]);

  return {
    data,
    loading,
    error,
    getProduct,
    getWarehouse,
    getBatchesForProduct,
    getLowStockProducts,
    getExpiringBatches,
    getInventoryValue,
    refetch: fetchData,
  };
}
