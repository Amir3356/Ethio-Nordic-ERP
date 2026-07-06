import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import './Login.css';

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/activate', {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Activation failed. The link may have expired or is invalid.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Ethio Nordic ERP</h1>
          </div>
          <div className="login-error">
            <AlertTriangle className="error-icon" size={20} />
            <span>Invalid activation link. No token provided.</span>
          </div>
          <Link to="/login" className="login-btn" style={{ textAlign: 'center', marginTop: '1rem', display: 'block', textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Ethio Nordic ERP</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Account Activated!</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Your account has been activated successfully. You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="login-btn"
              style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Ethio Nordic ERP</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Activate Your Account</p>
        </div>

        <form className="login-form" onSubmit={handleActivate}>
          {error && (
            <div className="login-error">
              <AlertTriangle className="error-icon" size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
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
            <p className="form-hint" style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Min 8 characters, mixed case, numbers, and symbols
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="password_confirmation">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Activating...' : 'Activate Account'}
          </button>

          <Link
            to="/login"
            className="login-btn-back"
            style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem', textDecoration: 'none' }}
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
