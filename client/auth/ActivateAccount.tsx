import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import './ActivateAccount.css';

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

  useEffect(() => {
    if (!success || !token) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate(`/setup-2fa?token=${token}`, { replace: true });
    }, 1200);

    return () => window.clearTimeout(redirectTimer);
  }, [success, token, navigate]);

  const handleActivate = async (e: FormEvent) => {
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

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least 1 uppercase letter.');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least 1 lowercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least 1 number.');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password must contain at least 1 special character.');
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
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
          <Link to="/login" className="activate-error-link">
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
          <div className="activate-success">
            <CheckCircle size={48} color="#22c55e" className="activate-success-icon" />
            <h2 className="activate-success-title">Account Activated!</h2>
            <p className="activate-success-text">
              Your permanent password has been saved. You are being redirected to set up Two-Factor Authentication now.
            </p>
            <Link
              to={`/setup-2fa?token=${token}`}
              className="activate-success-btn"
            >
              Continue to 2FA Setup
            </Link>
            <Link
              to="/login"
              className="activate-skip-link"
            >
              Skip for now
            </Link>
            </div>
            <div className="password-policy">
              <p className="password-policy-title">Password must contain:</p>
              <ul className="password-policy-list">
                <li>At least 8 characters</li>
                <li>At least 1 uppercase letter</li>
                <li>At least 1 lowercase letter</li>
                <li>At least 1 number</li>
                <li>At least 1 special character (!@#$%^&amp;*...)</li>
              </ul>
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
          <p className="activate-subtitle">Activate Your Account</p>
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
            className="activate-back-link"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
