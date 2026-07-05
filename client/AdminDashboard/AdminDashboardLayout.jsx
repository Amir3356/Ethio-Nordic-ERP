import { useState } from 'react';
import { Users, LogOut, User, Package } from 'lucide-react';
import UserManagement from './User Management Sidebar/User Management';
import Sessions from './User Management Sidebar/Sessions';
import AuditTrailLogging from './User Management Sidebar/Audit Trail Logging';
import PeriodicAccessReview from './User Management Sidebar/Periodic Access Review';
import './AdminDashboardLayout.css';

export default function Layout({ children }) {
  const [activeSection, setActiveSection] = useState('users');
  const [inventory, setInventory] = useState(null);

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-title">Admin Dashboard</h1>
        </div>

        <section className="sidebar-section">
          <ul className="sidebar-links">
            <li><a href="#users" onClick={(e) => { e.preventDefault(); setActiveSection('users'); }} className={activeSection === 'users' ? 'active' : ''}><Users size={16} /> User Management</a></li>
            <li><a href="#inventory" onClick={(e) => { e.preventDefault(); setActiveSection('inventory'); }} className={activeSection === 'inventory' ? 'active' : ''}><Package size={16} /> Inventory</a></li>
          </ul>
        </section>

        <div className="sidebar-bottom">
          <a href="/profile" onClick={(e) => e.preventDefault()} className="sidebar-bottom-link">
            <User size={16} />
            <span>Profile</span>
          </a>
          <a href="/logout" className="sidebar-bottom-link sidebar-logout">
            <LogOut size={16} />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <main className="layout-main">
        {activeSection === 'users' && (
          <>
            <UserManagement />
            <Sessions />
            <AuditTrailLogging />
            <PeriodicAccessReview />
          </>
        )}

        {activeSection === 'inventory' && (
          <section className="content-section" id="inventory">
            <div className="content-section-header">
              <h2>Inventory Management</h2>
            </div>

            {inventory ? (
              <>
                <p className="content-description">{inventory.description}</p>

                <h3 className="content-subtitle">Functional Scope</h3>
                <div className="content-grid">
                  {inventory.functionalScope.map((item) => (
                    <div key={item.title} className="content-card">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>

                <h3 className="content-subtitle">Workflow Steps</h3>
                <div className="content-workflow">
                  {inventory.detailedWorkflow.map((step) => (
                    <div key={step.step} className="content-workflow-item">
                      <span className="content-workflow-step">{step.step}</span>
                      <p>{step.description}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="content-loading">Loading inventory data...</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
