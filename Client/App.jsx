import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/UserManagement/UserManagement';
import RoleManagement from './components/RoleManagement/RoleManagement';
import LoginActivity from './components/LoginActivity/LoginActivity';
import AuditTrail from './components/AuditTrail/AuditTrail';
import SessionManagement from './components/SessionManagement/SessionManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="users"
              element={
                <ProtectedRoute permission="users.view">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <ProtectedRoute permission="roles.view">
                  <RoleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="login-activity"
              element={
                <ProtectedRoute permission="login-activity.view">
                  <LoginActivity />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute permission="audit-logs.view">
                  <AuditTrail />
                </ProtectedRoute>
              }
            />
            <Route
              path="sessions"
              element={
                <ProtectedRoute permission="sessions.view">
                  <SessionManagement />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
