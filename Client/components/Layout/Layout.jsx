import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Shield, ClipboardList,
  FileText, Monitor, LogOut, Search, Bell, User, Settings,
  ChevronDown, Zap
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/roles', label: 'Roles & Permissions', icon: Shield },
  { path: '/login-activity', label: 'Login Activity', icon: ClipboardList },
  { path: '/audit-trail', label: 'Audit Trail', icon: FileText },
  { path: '/sessions', label: 'Sessions', icon: Monitor },
];

const routeTitles = {
  '/': 'Dashboard',
  '/users': 'User Management',
  '/roles': 'Roles & Permissions',
  '/login-activity': 'Login Activity',
  '/audit-trail': 'Audit Trail',
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Zap className="logo-icon" size={24} />
            {!sidebarCollapsed && (
              <div className="logo-text">
                <h1>Ethio Nordic ERP</h1>
                <span>User & Access Management</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon"><item.icon size={20} /></span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {getUserInitials(user?.name)}
            </div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">{user?.name || 'Guest'}</span>
                <span className="user-role">
                  {user?.roles?.[0]?.name || 'No Role'}
                </span>
              </div>
            )}
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} className="logout-icon" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={`main-area ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="top-header">
          <div className="header-left">
            <h2 className="page-title">{pageTitle}</h2>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
              />
            </div>
            <button className="header-icon-btn" title="Notifications">
              <Bell size={20} className="bell-icon" />
              <span className="notification-dot"></span>
            </button>
            <div className="user-dropdown-container" ref={dropdownRef}>
              <button
                className="user-dropdown-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="header-user-avatar">
                  {getUserInitials(user?.name)}
                </div>
                <span className="header-user-name">{user?.name}</span>
                <span className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`}><ChevronDown size={16} /></span>
              </button>
              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{getUserInitials(user?.name)}</div>
                    <div>
                      <div className="dropdown-name">{user?.name}</div>
                      <div className="dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => navigate('/profile')}>
                    <User size={18} /> Profile
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/settings')}>
                    <Settings size={18} /> Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
