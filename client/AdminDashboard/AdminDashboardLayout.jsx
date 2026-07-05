import { useLocation } from 'react-router-dom';
import UserAccessManagementSidebar from './UserAccessManagementSidebar';
import './AdminDashboardLayout.css';

const routeTitles = {
  '/users': 'User Management',
  '/roles': 'Roles & Permissions',
  '/login-activity': 'Login Activity',
  '/audit-trail': 'Audit Trail',
  '/sessions': 'Session Management',
};

export default function Layout({ children }) {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || 'Ethio Nordic ERP';

  return (
    <div className="layout">
      <UserAccessManagementSidebar />

      <div className="layout-main">
        <header className="layout-header">
          <div className="layout-header-left">
            <h2 className="layout-page-title">{pageTitle}</h2>
          </div>
        </header>

        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
