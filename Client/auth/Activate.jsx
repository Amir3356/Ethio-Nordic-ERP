import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { authService } from '../services/api';
import './Activate.css';

export default function Activate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No activation token provided.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await authService.verifyActivationToken(token);
        const data = res.data;
        setTokenValid(true);
        setUserName(data.data.full_name);
        setUserEmail(data.data.email);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired activation link.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const validateForm = () => {
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await authService.setPassword(token, password, confirmPassword);
      setSuccess('Account activated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="activate-page">
        <div className="activate-card">
          <div className="activate-loading">
            <div className="activate-spinner"></div>
            <p>Verifying activation link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="activate-page">
        <div className="activate-card">
          <div className="activate-header">
            <div className="activate-icon-wrapper activate-icon-error">
              <AlertTriangle size={32} />
            </div>
            <h1 className="activate-title">Activation Failed</h1>
          </div>
          <div className="activate-body">
            <p className="activate-error-text">{error}</p>
            <p className="activate-help-text">
              Please contact your administrator to get a new activation link.
            </p>
            <button className="activate-btn" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="activate-page">
        <div className="activate-card">
          <div className="activate-header">
            <div className="activate-icon-wrapper activate-icon-success">
              <CheckCircle size={32} />
            </div>
            <h1 className="activate-title">Account Activated!</h1>
          </div>
          <div className="activate-body">
            <p className="activate-success-text">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activate-page">
      <div className="activate-card">
        <div className="activate-header">
          <div className="activate-icon-wrapper">
            <Shield size={32} />
          </div>
          <h1 className="activate-title">Activate Your Account</h1>
          <p className="activate-subtitle">
            Welcome, <strong>{userName}</strong> ({userEmail})
          </p>
          <p className="activate-description">
            Set your password to activate your account and start using the system.
          </p>
        </div>

        <form className="activate-form" onSubmit={handleSubmit}>
          {error && (
            <div className="activate-error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="activate-form-group">
            <label htmlFor="password">New Password</label>
            <div className="activate-input-wrapper">
              <Lock size={18} className="activate-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                autoFocus
              />
              <button
                type="button"
                className="activate-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="activate-form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="activate-input-wrapper">
              <Lock size={18} className="activate-input-icon" />
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                required
              />
              <button
                type="button"
                className="activate-password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="activate-btn"
            disabled={submitting}
          >
            {submitting ? 'Activating...' : 'Activate Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
