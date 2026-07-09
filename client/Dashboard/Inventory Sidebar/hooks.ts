import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
      const response = await axios.get<InventoryData>('/inventory.json');
      setData(response.data);
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
    (id: string): Product | undefined => data?.products.find((p) => p.id === id),
    [data]
  );

  const getWarehouse = useCallback(
    (id: string): Warehouse | undefined => data?.warehouses.find((w) => w.id === id),
    [data]
  );

  const getBatchesForProduct = useCallback(
    (productId: string): StockBatch[] =>
      data?.stock_batches.filter((b) => b.product_id === productId) || [],
    [data]
  );

  const getLowStockProducts = useCallback((): Array<{ product: Product; totalStock: number; warehouseStocks: Array<{ warehouse: Warehouse; quantity: number }> }> => {
    if (!data) return [];
    return data.products
      .map((product) => {
        const batches = data.stock_batches.filter(
          (b) => b.product_id === product.id && b.status === 'active'
        );
        const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (totalStock <= product.reorder_level) {
          const warehouseMap = new Map<string, number>();
          batches.forEach((b) => {
            warehouseMap.set(b.warehouse_id, (warehouseMap.get(b.warehouse_id) || 0) + b.quantity);
          });
          const warehouseStocks = Array.from(warehouseMap.entries()).map(([wid, qty]) => ({
            warehouse: data.warehouses.find((w) => w.id === wid)!,
            quantity: qty,
          }));
          return { product, totalStock, warehouseStocks };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [data]);

  const getExpiringBatches = useCallback(
    (daysThreshold: number = 90): StockBatch[] => {
      if (!data) return [];
      const now = new Date();
      const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
      return data.stock_batches.filter(
        (b) =>
          b.status === 'active' &&
          new Date(b.expiry_date) <= threshold &&
          new Date(b.expiry_date) >= now
      );
    },
    [data]
  );

  const getInventoryValue = useCallback((): number => {
    if (!data) return 0;
    return data.stock_batches
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + b.quantity * b.unit_cost, 0);
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
