import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Shield, Copy, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';
import './Login.css';

export default function TwoFactorSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setStep('error');
      return;
    }
    fetchSetup();
  }, [token]);

  const fetchSetup = async () => {
    try {
      const response = await authAPI.setupTwoFactorOnboarding(token);
      const data = response.data;

      if (data.data?.already_setup) {
        setStep('already_setup');
        return;
      }

      setQrCodeUrl(data.data?.qr_code_url || '');
      setSecret(data.data?.secret || '');
      setRecoveryCodes(data.data?.recovery_codes || []);
      setStep('scan');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load 2FA setup.');
      setStep('error');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyTwoFactorOnboarding(token, verifyCode);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await authAPI.skipTwoFactorOnboarding(token);
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQrCodeDataUrl = (url) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  if (!token || step === 'error') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Ethio Nordic ERP</h1>
          </div>
          <div className="login-error">
            <AlertTriangle className="error-icon" size={20} />
            <span>{error || 'Invalid setup link. Please activate your account first.'}</span>
          </div>
          <Link to="/login" className="login-btn" style={{ textAlign: 'center', marginTop: '1rem', display: 'block', textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#6b7280' }}>Loading 2FA setup...</p>
        </div>
      </div>
    );
  }

  if (step === 'already_setup') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Ethio Nordic ERP</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>2FA Already Enabled</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Two-factor authentication is already set up for this account.
            </p>
            <Link to="/login" className="login-btn" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Ethio Nordic ERP</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>2FA Enabled!</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Two-factor authentication has been set up successfully. You can now log in.
            </p>
            <Link to="/login" className="login-btn" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
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
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Set Up Two-Factor Authentication</p>
        </div>

        <div className="login-form">
          {error && (
            <div className="login-error">
              <AlertTriangle className="error-icon" size={20} />
              <span>{error}</span>
            </div>
          )}

          {step === 'scan' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <Shield size={40} color="#4f46e5" style={{ marginBottom: '0.5rem' }} />
                <p style={{ color: '#374151', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={{
                    padding: '12px',
                    background: '#fff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    display: 'inline-block',
                  }}>
                    <img
                      src={getQrCodeDataUrl(qrCodeUrl)}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>

                <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  Or enter this code manually:
                </p>
                <div
                  onClick={copySecret}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1f2937',
                    letterSpacing: '2px',
                  }}
                >
                  {secret}
                  <Copy size={14} color="#6b7280" />
                  {copied && <span style={{ fontSize: '12px', color: '#22c55e' }}>Copied!</span>}
                </div>
              </div>

              <form onSubmit={handleVerify}>
                <div className="form-group">
                  <label htmlFor="verify-code">Enter 6-digit code from your app</label>
                  <div className="input-wrapper">
                    <Shield size={18} className="input-icon" />
                    <input
                      id="verify-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoFocus
                      style={{
                        textAlign: 'center',
                        fontSize: '20px',
                        letterSpacing: '8px',
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading || verifyCode.length !== 6}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <button
                type="button"
                onClick={handleSkip}
                className="login-btn-back"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '0.75rem',
                  width: '100%',
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                Skip for now
              </button>

              {recoveryCodes.length > 0 && (
                <div style={{ marginTop: '1.25rem', padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: 600, marginBottom: '6px' }}>
                    Save your recovery codes:
                  </p>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#78350f', lineHeight: 1.8 }}>
                    {recoveryCodes.map((code, i) => (
                      <span key={i} style={{ marginRight: '12px' }}>{code}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
