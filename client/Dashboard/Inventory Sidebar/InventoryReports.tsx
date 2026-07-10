import { useState, useMemo } from 'react';
import { Download, FileText, BarChart3 } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

export default function InventoryReports({ inventory }: Props) {
  const { data } = inventory;
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const stockSummary = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<string, { product: string; warehouse: string; totalQty: number; totalValue: number; batches: number }>();

    data.stock_batches.forEach((batch) => {
      const product = data.products.find((p) => String(p.product_id) === String(batch.product_id));
      const warehouse = data.warehouses.find((w) => String(w.warehouse_id) === String(batch.warehouse_id));
      const key = `${batch.product_id}-${batch.warehouse_id}`;

      if (warehouseFilter && String(batch.warehouse_id) !== warehouseFilter) return;

      const existing = grouped.get(key);
      if (existing) {
        existing.totalQty += Number(batch.available_quantity);
        existing.totalValue += Number(batch.available_quantity) * Number(batch.unit_cost);
        existing.batches += 1;
      } else {
        grouped.set(key, {
          product: product?.product_name || String(batch.product_id),
          warehouse: warehouse?.warehouse_name || String(batch.warehouse_id),
          totalQty: Number(batch.available_quantity),
          totalValue: Number(batch.available_quantity) * Number(batch.unit_cost),
          batches: 1,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [data, warehouseFilter]);

  const totals = useMemo(() => {
    return stockSummary.reduce(
      (acc, row) => ({
        totalQty: acc.totalQty + row.totalQty,
        totalValue: acc.totalValue + row.totalValue,
        totalBatches: acc.totalBatches + row.batches,
      }),
      { totalQty: 0, totalValue: 0, totalBatches: 0 }
    );
  }, [stockSummary]);

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const params: Record<string, string> = { format };
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      const res = await inventoryAPI.exportStockReport(params);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-report.${format === 'csv' ? 'csv' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="reports">
      <div className="content-section-header">
        <h2>Reports & Export</h2>
      </div>

      <p className="content-description">
        Generate inventory reports and export stock data for analysis.
      </p>

      <div className="inv-toolbar">
        <select
          className="inv-filter-select"
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
        >
          <option value="">All Warehouses</option>
          {data.warehouses.map((w) => (
            <option key={w.warehouse_id} value={String(w.warehouse_id)}>
              {w.warehouse_name}
            </option>
          ))}
        </select>
        <button
          className="inv-btn inv-btn-secondary"
          onClick={() => handleExport('csv')}
          disabled={exporting}
        >
          <Download size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
        <button
          className="inv-btn inv-btn-secondary"
          onClick={() => handleExport('pdf')}
          disabled={exporting}
        >
          <FileText size={14} /> Export PDF
        </button>
      </div>

      <div className="inv-report-summary">
        <div className="inv-report-card">
          <BarChart3 size={20} className="inv-report-icon" />
          <div>
            <span className="inv-report-value">{totals.totalBatches}</span>
            <span className="inv-report-label">Total Batches</span>
          </div>
        </div>
        <div className="inv-report-card">
          <BarChart3 size={20} className="inv-report-icon" />
          <div>
            <span className="inv-report-value">{totals.totalQty.toLocaleString()}</span>
            <span className="inv-report-label">Total Quantity</span>
          </div>
        </div>
        <div className="inv-report-card">
          <BarChart3 size={20} className="inv-report-icon" />
          <div>
            <span className="inv-report-value">${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="inv-report-label">Total Value</span>
          </div>
        </div>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Batches</th>
              <th>Total Qty</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {stockSummary.map((row, i) => (
              <tr key={i}>
                <td className="inv-table-name">{row.product}</td>
                <td>{row.warehouse}</td>
                <td>{row.batches}</td>
                <td>{row.totalQty.toLocaleString()}</td>
                <td>${row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {stockSummary.length === 0 && (
              <tr><td colSpan={5} className="inv-empty">No stock data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
