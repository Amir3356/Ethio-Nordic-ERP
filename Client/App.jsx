import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './AdminDashboard/AdminDashboardLayout';
import Login from './auth/Login';
import Logout from './auth/Logout';
import UserManagement from './AdminDashboard/User';
import RoleManagement from './AdminDashboard/RoleManagement';
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
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="login-activity" element={<LoginActivity />} />
            <Route path="audit-logs" element={<AuditTrail />} />
            <Route path="sessions" element={<SessionManagement />} />
          </Route>
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
