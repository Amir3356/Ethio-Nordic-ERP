import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useLogin } from './hooks/useLogin';
import AuthCard from './components/AuthCard';
import AuthError from './components/AuthError';
import PasswordInput from './components/PasswordInput';
import './Login.css';

export default function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    twoFactorCode,
    setTwoFactorCode,
    error,
    loading,
    showPassword,
    setShowPassword,
    requiresTwoFactor,
    handleLogin,
    resetTwoFactor,
  } = useLogin();

  return (
    <AuthCard title="Ethio Nordic ERP">
      <form className="login-form" onSubmit={handleLogin}>
        {error && <AuthError message={error} />}

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
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
              />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label htmlFor="twoFactorCode">Two-Factor Code</label>
            <div className="input-wrapper">
              <input
                id="twoFactorCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <p className="form-hint">Check your authenticator app for the code</p>
          </div>
        )}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading
            ? requiresTwoFactor
              ? 'Verifying...'
              : 'Signing in...'
            : requiresTwoFactor
              ? 'Verify'
              : 'Sign In'}
        </button>

        {requiresTwoFactor && (
        )}
      </form>
    </AuthCard>
  );
}
