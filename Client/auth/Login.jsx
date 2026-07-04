import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login, verifyTwoFactor, requiresTwoFactor, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [twoFactorCode, setTwoFactorCode] = useState(['', '', '', '', '', '']);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const codeRefs = useRef([]);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (requiresTwoFactor && codeRefs.current[0]) {
      codeRefs.current[0].focus();
    }
  }, [requiresTwoFactor]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.requiresTwoFactor) {
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...twoFactorCode];
    newCode[index] = value.slice(-1);
    setTwoFactorCode(newCode);
    setTwoFactorError('');

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !twoFactorCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
      const newCode = [...twoFactorCode];
      newCode[index - 1] = '';
      setTwoFactorCode(newCode);
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...twoFactorCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setTwoFactorCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    codeRefs.current[focusIndex]?.focus();
  };

  const handleVerifyTwoFactor = async (e) => {
    e.preventDefault();
    const code = twoFactorCode.join('');
    if (code.length !== 6) {
      setTwoFactorError('Please enter the complete 6-digit code.');
      return;
    }

    setTwoFactorLoading(true);
    setTwoFactorError('');

    try {
      await verifyTwoFactor(code);
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid verification code. Please try again.';
      setTwoFactorError(msg);
      setTwoFactorCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Ethio Nordic ERP</h1>
        </div>

        {!requiresTwoFactor ? (
          <form className="login-form" onSubmit={handleLogin}>
            {error && (
              <div className="login-error">
                <AlertTriangle className="error-icon" size={20} />
                <span>{error}</span>
              </div>
            )}

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

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        ) : (
          <form className="login-form two-factor-form" onSubmit={handleVerifyTwoFactor}>
            <div className="two-factor-header">
              <Shield className="tfa-icon" size={48} />
              <h2>Two-Factor Authentication</h2>
              <p>Enter the 6-digit code from your authenticator app.</p>
            </div>

            {twoFactorError && (
              <div className="login-error">
                <AlertTriangle className="error-icon" size={20} />
                <span>{twoFactorError}</span>
              </div>
            )}

            <div className="code-inputs" onPaste={handleCodePaste}>
              {twoFactorCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (codeRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="code-input"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={twoFactorLoading}
            >
              {twoFactorLoading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>

            <button
              type="button"
              className="back-to-login"
              onClick={() => window.location.reload()}
            >
              ← Back to login
            </button>
          </form>
        )}


      </div>
    </div>
  );
}
