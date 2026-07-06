import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@ethionordic.com');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password, requiresTwoFactor ? twoFactorCode : null);
      const data = response.data;

      // Check if 2FA is required
      if (data.requires_2fa) {
        setRequiresTwoFactor(true);
        setLoading(false);
        return;
      }

      // Store auth token and user data
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Redirect to dashboard
      navigate('/admin-dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please try again.';
      setError(msg);
      setRequiresTwoFactor(false);
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Ethio Nordic ERP</h1>
          <p className="login-subtitle">User & Access Management System</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div className="login-error">
              <AlertTriangle className="error-icon" size={20} />
              <span>{error}</span>
            </div>
          )}

          {!requiresTwoFactor ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="twoFactorCode">Two-Factor Code</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="twoFactorCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.slice(0, 6))}
                  maxLength="6"
                  required
                  autoFocus
                />
              </div>
              <p className="form-hint">Check your authenticator app for the code</p>
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (requiresTwoFactor ? 'Verifying...' : 'Signing in...') : (requiresTwoFactor ? 'Verify' : 'Sign In')}
          </button>

          {requiresTwoFactor && (
            <button
              type="button"
              className="login-btn-back"
              onClick={() => {
                setRequiresTwoFactor(false);
                setTwoFactorCode('');
                setError('');
              }}
            >
              Back to Login
            </button>
          )}
        </form>

        <div className="login-footer">
          <p className="login-footer-text">Default Admin: admin@ethionordic.com</p>
        </div>
      </div>
    </div>
  );
}

