import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function FixedAssets({ finance }: Props) {
  const { data, getActiveFixedAssets, getTotalFixedAssetValue, getTotalMonthlyDepreciation } = finance;
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['Land and Buildings', 'Vehicles', 'Office Equipment'];

  const assets = useMemo(() => {
    if (!data) return [];
    let filtered = [...data.fixed_assets];
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.asset_code.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [data, search, categoryFilter]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'active' ? 'finance-badge-green' :
      status === 'disposed' ? 'finance-badge-gray' :
      'finance-badge-amber';
    return <span className={`finance-badge ${cls}`}>{status}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="fixed-assets">
      <div className="content-section-header">
        <h2>Fixed Assets</h2>
      </div>

      <p className="content-description">
        Asset register with depreciation scheduling and useful life tracking.
      </p>

      <div className="finance-asset-summary">
        <div className="finance-asset-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div>
            <span className="finance-asset-value">{getTotalFixedAssetValue.toLocaleString()} ETB</span>
            <span className="finance-asset-label">Net Book Value</span>
          </div>
        </div>
        <div className="finance-asset-card">
          <div className="finance-stat-icon finance-stat-icon-amber">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div>
            <span className="finance-asset-value">{getTotalMonthlyDepreciation.toLocaleString()} ETB</span>
            <span className="finance-asset-label">Monthly Depreciation</span>
          </div>
        </div>
        <div className="finance-asset-card">
          <div className="finance-stat-icon finance-stat-icon-green">
            <span style={{ fontSize: 18 }}>{getActiveFixedAssets().length}</span>
          </div>
          <div>
            <span className="finance-asset-value">{getActiveFixedAssets().length}</span>
            <span className="finance-asset-label">Active Assets</span>
          </div>
        </div>
      </div>

      <div className="finance-toolbar">
        <div className="finance-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, code, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="finance-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Asset Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Acquired</th>
              <th>Cost</th>
              <th>Useful Life</th>
              <th>Method</th>
              <th>Accum. Depr.</th>
              <th>Net Book Value</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td className="finance-table-name">{asset.asset_code}</td>
                <td>{asset.name}</td>
                <td>{asset.category}</td>
                <td>{asset.acquisition_date}</td>
                <td>{asset.acquisition_cost.toLocaleString()}</td>
                <td>{asset.useful_life_years} years</td>
                <td>
                  <span className="finance-badge finance-badge-blue">{asset.depreciation_method}</span>
                </td>
                <td className="finance-text-red">{asset.accumulated_depreciation.toLocaleString()}</td>
                <td className="finance-text-bold">{asset.net_book_value.toLocaleString()}</td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.location}</td>
                <td>{getStatusBadge(asset.status)}</td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr><td colSpan={11} className="finance-empty">No fixed assets found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
