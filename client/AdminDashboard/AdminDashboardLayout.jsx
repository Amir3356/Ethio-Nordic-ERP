import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, User, Package, AlertTriangle } from 'lucide-react';
import { authAPI } from '../services/api';
import UserManagement from './User Management Sidebar/User Management';
import Sessions from './User Management Sidebar/Sessions';
import AuditTrailLogging from './User Management Sidebar/Audit Trail Logging';
import PeriodicAccessReview from './User Management Sidebar/Periodic Access Review';
import './AdminDashboardLayout.css';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('users');
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-title">Admin Dashboard</h1>
          {currentUser && <p className="sidebar-user">Welcome, {currentUser.name}</p>}
        </div>

        <section className="sidebar-section">
          <ul className="sidebar-links">
            <li>
              <a
                href="#users"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('users');
                }}
                className={activeSection === 'users' ? 'active' : ''}
              >
                <Users size={16} /> User Management
              </a>
            </li>
            <li>
              <a
                href="#inventory"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('inventory');
                }}
                className={activeSection === 'inventory' ? 'active' : ''}
              >
                <Package size={16} /> Inventory
              </a>
            </li>
          </ul>
        </section>

        <div className="sidebar-bottom">
          <a href="/profile" onClick={(e) => e.preventDefault()} className="sidebar-bottom-link">
            <User size={16} />
            <span>Profile</span>
          </a>
          <button
            onClick={handleLogout}
            className="sidebar-bottom-link sidebar-logout"
            type="button"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="layout-main">
        {error && (
          <div className="layout-error">
            <AlertTriangle size={20} />
            <p>{error}</p>
            <button onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

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
            <p className="content-description">Inventory management features coming soon.</p>
          </section>
        )}
      </main>
    </div>
  );
}
