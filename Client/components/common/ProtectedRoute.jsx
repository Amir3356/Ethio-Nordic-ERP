import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldOff } from 'lucide-react';
import './ProtectedRoute.css';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="spinner-text">Verifying authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="protected-route-loading">
        <div className="access-denied">
          <ShieldOff className="access-denied-icon" size={48} />
          <h2>Access Denied</h2>
          <p>You don't have the required permission to access this page.</p>
          <p className="access-denied-perm">Required: <code>{permission}</code></p>
        </div>
      </div>
    );
  }

  return children;
}
