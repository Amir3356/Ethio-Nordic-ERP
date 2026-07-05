import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { LogOut } from 'lucide-react';
import './Logout.css';

function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      navigate('/login');
    };
    performLogout();
  }, [logout, navigate]);

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

export default Logout;
