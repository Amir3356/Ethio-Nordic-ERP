import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, Bell, User, Settings, ChevronDown, LogOut
} from 'lucide-react';
import UserAccessManagementSidebar from './UserAccessManagementSidebar';
import './AdminLayout.css';

const routeTitles = {
  '/users': 'User Management',
  '/roles': 'Roles & Permissions',
  '/login-activity': 'Login Activity',
  '/audit-logs': 'Audit Trail',
  '/sessions': 'Session Management',
};

function getUserInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = routeTitles[location.pathname] || 'Ethio Nordic ERP';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <UserAccessManagementSidebar />

      <div className="layout-main">
        <header className="layout-header">
          <div className="layout-header-left">
            <h2 className="layout-page-title">{pageTitle}</h2>
          </div>
          <div className="layout-header-right">
            <div className="layout-search-bar">
              <Search size={18} className="layout-search-icon" />
              <input
                type="text"
                placeholder="Search..."
                className="layout-search-input"
              />
            </div>
            <button className="layout-icon-btn" title="Notifications">
              <Bell size={20} />
              <span className="layout-notification-dot"></span>
            </button>
            <div className="layout-dropdown-container" ref={dropdownRef}>
              <button
                className="layout-dropdown-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="layout-header-avatar">
                  {getUserInitials(user?.name)}
                </div>
                <span className="layout-header-username">{user?.name}</span>
                <ChevronDown size={16} className={`layout-chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="layout-dropdown-menu">
                  <div className="layout-dropdown-header">
                    <div className="layout-dropdown-avatar">{getUserInitials(user?.name)}</div>
                    <div>
                      <div className="layout-dropdown-name">{user?.name}</div>
                      <div className="layout-dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="layout-dropdown-divider"></div>
                  <button className="layout-dropdown-item" onClick={() => navigate('/profile')}>
                    <User size={18} /> Profile
                  </button>
                  <button className="layout-dropdown-item" onClick={() => navigate('/settings')}>
                    <Settings size={18} /> Settings
                  </button>
                  <div className="layout-dropdown-divider"></div>
                  <button className="layout-dropdown-item layout-dropdown-item--logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
