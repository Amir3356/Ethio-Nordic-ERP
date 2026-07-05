import { useState } from 'react';
import { Users, Shield, Activity, ClipboardList, Monitor, ChevronRight } from 'lucide-react';
import UserManagement from './New user create';
import RoleManagement from './Role & Permission Assignment';
import LoginActivity from './LoginActivity';
import AuditTrail from './AuditTrail';
import SessionManagement from './SessionManagement';
import './UserAccessManagementSidebar.css';

const TABS = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'sessions', label: 'Sessions', icon: Monitor },
  { id: 'login-activity', label: 'Login Activity', icon: Activity },
  { id: 'audit', label: 'Audit Trail', icon: ClipboardList },
];

export default function UserAccessManagementSidebar() {
  const [activeTab, setActiveTab] = useState('users');

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'sessions':
        return <SessionManagement />;
      case 'login-activity':
        return <LoginActivity />;
      case 'audit':
        return <AuditTrail />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="uam-layout">
      <aside className="uam-sidebar">
        <div className="uam-sidebar-header">
          <h2 className="uam-sidebar-title">Access Management</h2>
        </div>
        <nav className="uam-nav">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`uam-nav-item ${isActive ? 'uam-nav-item--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {isActive && <ChevronRight size={16} className="uam-nav-arrow" />}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="uam-content">
        {renderContent()}
      </main>
    </div>
  );
}
