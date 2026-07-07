import { LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services';
import './Logout.css';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await authAPI.logout();
      } catch {
        // ignore
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    };
    performLogout();
  }, [navigate]);

  return (
    <div className="logout-container">
      <div className="logout-card">
        <div className="logout-icon">
          <LogOut size={48} />
        </div>
        <h2 className="logout-title">Signing Out</h2>
        <p className="logout-message">Please wait while we log you out...</p>
      </div>
    </div>
  );
}
