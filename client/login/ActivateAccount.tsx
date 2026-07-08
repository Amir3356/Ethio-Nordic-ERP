import { Shield } from 'lucide-react';
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
      <AuthCard title="Ethio Nordic Trading PLC" subtitle="Account Activated">
        <div className="activate-success">
          <Shield size={48} color="#4f46e5" className="activate-success-icon" />
          <h2 className="activate-success-title">Account Activated!</h2>
          <p className="activate-success-text">
            Your password has been set. Redirecting to Two-Factor Authentication setup...
          </p>
          <div className="activate-loading-bar">
            <div className="activate-loading-bar-fill" />
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Ethio Nordic Trading PLC">
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
