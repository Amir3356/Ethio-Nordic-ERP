import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useActivateAccount } from './hooks/useActivateAccount';
import AuthCard from './components/AuthCard';
import AuthError from './components/AuthError';
import PasswordInput from './components/PasswordInput';
import './ActivateAccount.css';

export default function ActivateAccount() {
  const {
    token,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    loading,
    success,
    handleActivate,
  } = useActivateAccount();

  if (!token) {
    return (
      <AuthCard title="Ethio Nordic Trading PLC">
        <AuthError message="Invalid activation link. No token provided." />
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard title="Ethio Nordic Trading PLC">
        <div className="activate-success">
          <CheckCircle size={48} color="#22c55e" className="activate-success-icon" />
          <h2 className="activate-success-title">Account Activated!</h2>
          <p className="activate-success-text">
            Your permanent password has been saved. You are being redirected to set up Two-Factor Authentication now.
          </p>
          <Link to={`/setup-2fa?token=${token}`} className="activate-success-btn">
            Continue to 2FA Setup
          </Link>
          <Link to="/login" className="activate-skip-link">
            Skip for now
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Ethio Nordic Trading PLC" subtitle="Activate Your Account">
      <form className="login-form" onSubmit={handleActivate}>
        {error && <AuthError message={error} />}

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggleShow={() => setShowPassword(!showPassword)}
            placeholder="Enter your new password"
            autoFocus
          />
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Activating...' : 'Activate Account'}
        </button>

       
      </form>
    </AuthCard>
  );
}
