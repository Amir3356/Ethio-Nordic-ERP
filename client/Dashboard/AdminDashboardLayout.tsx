import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, Package, DollarSign, Briefcase } from 'lucide-react';
import { authAPI } from '../services';
import UserManagement from './User Management Sidebar/UserManagement/UserManagement';
import Sessions from './User Management Sidebar/Sessions/Sessions';
import AuditTrailLogging from './User Management Sidebar/AuditTrailLogging/AuditTrailLogging';
import PeriodicAccessReview from './User Management Sidebar/PeriodicAccessReview/PeriodicAccessReview';
import InventorySidebar from './Inventory Sidebar/InventorySidebar';
import FinanceSidebar from './Finance Accounting Sidebar/FinanceSidebar';
import HRSidebar from './Human Resource Sidebar/HRSidebar';
import './AdminDashboardLayout.css';

interface CurrentUser {
  name?: string;
  full_name?: string;
  email?: string;
}

export default function Layout() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('users');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

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
          {currentUser && <p className="sidebar-user">Welcome, {currentUser.name || currentUser.full_name}</p>}
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
            <li>
              <a
                href="#finance"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('finance');
                }}
                className={activeSection === 'finance' ? 'active' : ''}
              >
                <DollarSign size={16} /> Finance & Accounting
              </a>
            </li>
            <li>
              <a
                href="#hr"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('hr');
                }}
                className={activeSection === 'hr' ? 'active' : ''}
              >
                <Briefcase size={16} /> Human Resources
              </a>
            </li>
          </ul>
        </section>

        <div className="sidebar-bottom">
          <a href="/profile" onClick={(e) => e.preventDefault()} className="sidebar-bottom-link">
            <span>{currentUser?.name || currentUser?.full_name || 'Profile'}</span>
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
        {activeSection === 'users' && (
          <>
            <UserManagement />
            <Sessions />
            <AuditTrailLogging />
            <PeriodicAccessReview />
          </>
        )}

        {activeSection === 'inventory' && (
          <section id="inventory">
            <InventorySidebar />
          </section>
        )}

        {activeSection === 'finance' && (
          <section id="finance">
            <FinanceSidebar />
          </section>
        )}

        {activeSection === 'hr' && (
          <section id="hr">
            <HRSidebar />
          </section>
        )}
      </main>
    </div>
  );
}
