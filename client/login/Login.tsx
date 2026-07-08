import { Mail, Shield } from 'lucide-react';
import { useLogin } from './hooks/useLogin';
import AuthCard from './components/AuthCard';
import AuthError from './components/AuthError';
import PasswordInput from './components/PasswordInput';
import QRCodeDisplay from './components/QRCodeDisplay';
import TwoFactorInput from './components/TwoFactorInput';
import './Login.css';

export default function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    twoFactorCode,
    setTwoFactorCode,
    error,
    loading,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    requiresTwoFactor,
    requiresTwoFactorSetup,
    qrCodeUrl,
    handleLogin,
    resetTwoFactor,
  } = useLogin();

  const showLoginFields = !requiresTwoFactor && !requiresTwoFactorSetup;

  return (
    <AuthCard title="Ethio Nordic Trading PLC">
      <form className="login-form" onSubmit={handleLogin}>
        {error && <AuthError message={error} />}

        {showLoginFields && (
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                showPassword={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                placeholder="Re-enter your password"
              />
            </div>
          </>
        )}

        {requiresTwoFactorSetup && (
          <div className="tfa-scan-section">
            <Shield size={40} color="#4f46e5" className="tfa-scan-icon" />
            <p className="form-hint">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
            <QRCodeDisplay url={qrCodeUrl} />
            <TwoFactorInput value={twoFactorCode} onChange={setTwoFactorCode} />
          </div>
        )}

        {requiresTwoFactor && !requiresTwoFactorSetup && (
          <TwoFactorInput value={twoFactorCode} onChange={setTwoFactorCode} />
        )}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading
            ? requiresTwoFactor || requiresTwoFactorSetup
              ? 'Verifying...'
              : 'Signing in...'
            : requiresTwoFactor || requiresTwoFactorSetup
              ? 'Verify'
              : 'Sign In'}
        </button>

        {(requiresTwoFactor || requiresTwoFactorSetup) && (
          <button type="button" className="login-btn-back" onClick={resetTwoFactor}>
            Back to Login
          </button>
        )}
      </form>
    </AuthCard>
  );
}
