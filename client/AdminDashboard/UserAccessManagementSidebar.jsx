import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users, Shield, ClipboardList, FileText, Monitor, LogOut, Zap, UserPlus
} from 'lucide-react';
import './UserAccessManagementSidebar.css';

const navItems = [
  { path: '/users', label: 'Users', icon: Users },
  { path: '/roles', label: 'Roles & Permissions', icon: Shield },
  { path: '/login-activity', label: 'Login Activity', icon: ClipboardList },
  { path: '/audit-trail', label: 'Audit Trail', icon: FileText },
  { path: '/sessions', label: 'Sessions', icon: Monitor },
];

function getUserInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function UserAccessManagementSidebar({ onAddUser }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="uam-sidebar">
      <div className="uam-sidebar-header">
        <Zap className="uam-logo-icon" size={24} />
        <div className="uam-logo-text">
          <h1>Ethio Nordic ERP</h1>
          <span>User & Access Management</span>
        </div>
      </div>

      <nav className="uam-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `uam-nav-item ${isActive ? 'uam-nav-item--active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="uam-sidebar-bottom">
        <button className="uam-add-user-btn" onClick={onAddUser}>
          <UserPlus size={18} />
          <span>Add User</span>
        </button>

        <div className="uam-user-info">
          <div className="uam-user-avatar">
            {getUserInitials(user?.full_name)}
          </div>
          <div className="uam-user-details">
            <span className="uam-user-name">{user?.full_name || 'Guest'}</span>
            <span className="uam-user-role">{user?.roles?.[0]?.name || 'No Role'}</span>
          </div>
        </div>

        <button className="uam-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
