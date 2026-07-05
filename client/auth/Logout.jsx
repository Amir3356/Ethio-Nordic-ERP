import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut } from 'lucide-react';
import './Logout.css';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
});

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // ignore
      }
      localStorage.removeItem('user');
      navigate('/login');
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

export default Logout;
