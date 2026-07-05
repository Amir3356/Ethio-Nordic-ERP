import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  PackageSearch,
  Warehouse,
} from 'lucide-react';
import './InventorySidebar.css';

export default function InventorySidebar({ compact = false } = {}) {
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/inventory.json')
      .then((res) => setInventoryData(res.data || null))
      .catch((err) => console.error('Failed to load inventory data:', err))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const scopeCount = Array.isArray(inventoryData?.functionalScope) ? inventoryData.functionalScope.length : 0;
    const workflowCount = Array.isArray(inventoryData?.detailedWorkflow) ? inventoryData.detailedWorkflow.length : 0;
    return [
      { label: 'Functional Scope Items', value: String(scopeCount).padStart(2, '0') },
      { label: 'Workflow Steps', value: String(workflowCount).padStart(2, '0') },
      { label: 'Stock Strategy', value: 'FIFO / FEFO' },
    ];
  }, [inventoryData]);

  const safeScope = Array.isArray(inventoryData?.functionalScope) ? inventoryData.functionalScope : [];
  const safeWorkflow = Array.isArray(inventoryData?.detailedWorkflow) ? inventoryData.detailedWorkflow : [];

  return (
    <div className={compact ? 'inventory-layout inventory-embedded-panel' : 'inventory-layout'}>
      {!compact ? (
        <aside className="inventory-sidebar">
          <div className="inventory-sidebar-brand">
            <div className="inventory-sidebar-icon">
              <Warehouse size={18} />
            </div>
            <div>
              <p className="inventory-sidebar-label">Admin Dashboard</p>
              <h2 className="inventory-sidebar-title">Inventory Management</h2>
            </div>
          </div>

          <nav className="inventory-sidebar-nav" aria-label="Inventory navigation">
            <a className="inventory-sidebar-link inventory-sidebar-link-active" href="/inventory" onClick={(event) => event.preventDefault()}>
              <PackageSearch size={16} />
              Overview
            </a>
            <a className="inventory-sidebar-link" href="/inventory/alerts" onClick={(event) => event.preventDefault()}>
              <CircleAlert size={16} />
              Alerts
            </a>
            <a className="inventory-sidebar-link" href="/inventory/valuation" onClick={(event) => event.preventDefault()}>
              <Archive size={16} />
              Valuation
            </a>
          </nav>

          <div className="inventory-sidebar-note">
            <CheckCircle2 size={16} />
            <span>Static JSON is loaded from the Vite public folder with axios.</span>
          </div>
        </aside>
      ) : null}

      <main className={compact ? 'inventory-main inventory-main-embedded' : 'inventory-main'}>
        {compact ? (
          <div className="inventory-hero-copy">
            <p className="inventory-eyebrow">Inventory Control</p>
            <h2 className="inventory-title">
              {inventoryData?.module || 'Inventory Management'}
            </h2>
            <p className="inventory-description">
              {inventoryData?.description || 'Loading inventory module content from inventory.json...'}
            </p>
          </div>
        ) : null}

        <section className="inventory-hero">
          {!compact ? (
            <div className="inventory-hero-copy">
            <p className="inventory-eyebrow">Inventory Control</p>
            <h1 className="inventory-title">
              {inventoryData?.module || 'Inventory Management'}
            </h1>
            <p className="inventory-description">
              {inventoryData?.description || 'Loading inventory module content from inventory.json...'}
            </p>
          </div>
          ) : null}

          <div className="inventory-metrics">
            {metrics.map((metric) => (
              <article key={metric.label} className="inventory-metric-card">
                <span className="inventory-metric-value">{metric.value}</span>
                <span className="inventory-metric-label">{metric.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="inventory-grid">
          <article className="inventory-panel">
            <div className="inventory-panel-header">
              <h3>Functional Scope</h3>
              <span>{safeScope.length} items</span>
            </div>

            {loading ? (
              <p className="inventory-state">Loading functional scope...</p>
            ) : (
              <ul className="inventory-scope-list">
                {safeScope.map((item) => (
                  <li key={item.title} className="inventory-scope-item">
                    <div className="inventory-scope-icon">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="inventory-panel inventory-panel-wide">
            <div className="inventory-panel-header">
              <h3>Detailed Workflow</h3>
              <span>{safeWorkflow.length} steps</span>
            </div>

            {loading ? (
              <p className="inventory-state">Loading workflow details...</p>
            ) : (
              <div className="inventory-workflow-list">
                {safeWorkflow.map((step) => (
                  <div key={step.step} className="inventory-workflow-item">
                    <div className="inventory-workflow-step">
                      <Clock3 size={15} />
                      <span>{step.step}</span>
                    </div>
                    <p>{step.description}</p>
                    <ArrowRight size={16} className="inventory-workflow-arrow" />
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
