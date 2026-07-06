import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';
import './TwoFactorSetup.css';

type SetupStep = 'loading' | 'error' | 'already_setup' | 'scan' | 'success';

export default function TwoFactorSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState<SetupStep>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStep('error');
      return;
    }
    fetchSetup();
  }, [token]);

  const fetchSetup = async () => {
    try {
      const response = await authAPI.setupTwoFactorOnboarding(token!);
      const data = response.data;

      if (data.data?.already_setup) {
        setStep('already_setup');
        return;
      }

      setQrCodeUrl(data.data?.qr_code_url || '');
      setSecret(data.data?.secret || '');
      setRecoveryCodes(data.data?.recovery_codes || []);
      setStep('scan');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to load 2FA setup.');
      setStep('error');
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyTwoFactorOnboarding(token!, verifyCode);
      setStep('success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await authAPI.skipTwoFactorOnboarding(token!);
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  const getQrCodeDataUrl = (url: string) => {
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
          <Link to="/login" className="tfa-error-link">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="login-page">
        <div className="tfa-loading-card">
          <p className="tfa-loading-text">Loading 2FA setup...</p>
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
          <div className="tfa-already-setup">
            <CheckCircle size={48} color="#22c55e" className="tfa-already-setup-icon" />
            <h2 className="tfa-already-setup-title">2FA Already Enabled</h2>
            <p className="tfa-already-setup-text">
              Two-factor authentication is already set up for this account.
            </p>
            <Link to="/login" className="tfa-already-setup-btn">
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
          <div className="tfa-success">
            <CheckCircle size={48} color="#22c55e" className="tfa-success-icon" />
            <h2 className="tfa-success-title">2FA Enabled!</h2>
            <p className="tfa-success-text">
              Two-factor authentication has been set up successfully. You can now log in.
            </p>
            <Link to="/login" className="tfa-success-btn">
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
          <p className="tfa-subtitle">Set Up Two-Factor Authentication</p>
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
              <div className="tfa-scan-header">
                <Shield size={40} color="#4f46e5" className="tfa-scan-icon" />
                <p className="tfa-scan-instructions">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>

                <div className="tfa-qr-wrapper">
                  <div className="tfa-qr-box">
                    <img
                      src={getQrCodeDataUrl(qrCodeUrl)}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                      className="tfa-qr-image"
                    />
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
                      className="tfa-code-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="tfa-verify-btn"
                  disabled={loading || verifyCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <button
                type="button"
                onClick={handleSkip}
                className="tfa-skip-btn"
              >
                Skip for now
              </button>

              {recoveryCodes.length > 0 && (
                <div className="tfa-recovery-codes">
                  <p className="tfa-recovery-codes-title">
                    Save your recovery codes:
                  </p>
                  <div className="tfa-recovery-codes-list">
                    {recoveryCodes.map((code, i) => (
                      <span key={i} className="tfa-recovery-code">{code}</span>
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
