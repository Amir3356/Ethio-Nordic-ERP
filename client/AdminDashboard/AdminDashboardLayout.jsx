import { ShieldCheck } from 'lucide-react';
import './AdminDashboardLayout.css';

export default function Layout() {
  return (
    <div className="layout">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Ethio Nordic ERP</p>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Centralized operations for security, access, and inventory control.</p>
        </div>
      </header>

      <div className="dashboard-sidebars">
        <section className="dashboard-sidebar-panel">
          <div className="dashboard-sidebar-header">
            <ShieldCheck size={18} />
            <h2>User & Access Management</h2>
          </div>
          <p className="dashboard-sidebar-desc">
            Manage users, roles, permissions, and access control across the ERP system.
          </p>
          <ul className="dashboard-sidebar-links">
            <li><a href="/users" onClick={(e) => e.preventDefault()}>User Directory</a></li>
            <li><a href="/roles" onClick={(e) => e.preventDefault()}>Role Management</a></li>
            <li><a href="/permissions" onClick={(e) => e.preventDefault()}>Permissions</a></li>
            <li><a href="/sessions" onClick={(e) => e.preventDefault()}>Session Monitoring</a></li>
          </ul>
        </section>

        <section className="dashboard-sidebar-panel">
          <div className="dashboard-sidebar-header">
            <span className="dashboard-sidebar-icon-inventory">📦</span>
            <h2>Inventory Management</h2>
          </div>
          <p className="dashboard-sidebar-desc">
            Track stock levels, manage warehouse operations, and monitor inventory workflows.
          </p>
          <ul className="dashboard-sidebar-links">
            <li><a href="/inventory" onClick={(e) => e.preventDefault()}>Overview</a></li>
            <li><a href="/inventory/alerts" onClick={(e) => e.preventDefault()}>Alerts</a></li>
            <li><a href="/inventory/valuation" onClick={(e) => e.preventDefault()}>Valuation</a></li>
            <li><a href="/inventory/workflow" onClick={(e) => e.preventDefault()}>Workflow</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
