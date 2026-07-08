import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Dashboard/AdminDashboardLayout';
import Login from './login/Login';
import Logout from './login/Logout';
import ActivateAccount from './login/ActivateAccount';
import TwoFactorSetup from './login/TwoFactorSetup';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/activate-account" element={<ActivateAccount />} />
        <Route path="/setup-2fa" element={<TwoFactorSetup />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
