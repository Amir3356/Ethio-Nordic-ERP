import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './AdminDashboard/AdminDashboardLayout';
import Login from './auth/Login';
import Logout from './auth/Logout';
import Activate from './auth/Activate';
import UserManagement from './AdminDashboard/New user create';
import RoleManagement from './AdminDashboard/Role & Permission Assignment';
import LoginActivity from './AdminDashboard/LoginActivity';
import AuditTrail from './AdminDashboard/AuditTrail';
import SessionManagement from './AdminDashboard/SessionManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="login-activity" element={<LoginActivity />} />
            <Route path="audit-trail" element={<AuditTrail />} />
            <Route path="sessions" element={<SessionManagement />} />
          </Route>
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
