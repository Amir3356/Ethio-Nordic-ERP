import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { useTwoFactorSetup } from './hooks/useTwoFactorSetup';
import AuthCard from './components/AuthCard';
import AuthError from './components/AuthError';
import QRCodeDisplay from './components/QRCodeDisplay';
import TwoFactorInput from './components/TwoFactorInput';
import './TwoFactorSetup.css';

export default function TwoFactorSetup() {
  const {
    token,
    step,
    qrCodeUrl,
    verifyCode,
    setVerifyCode,
    error,
    loading,
    handleVerify,
  } = useTwoFactorSetup();

  if (!token || step === 'error') {
    return (
      <AuthCard title="Ethio Nordic Trading PLC">
        <AuthError message={error || 'Invalid setup link. Please activate your account first.'} />
      </AuthCard>
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
      <AuthCard title="Ethio Nordic Trading PLC">
        <div className="tfa-already-setup">
          <CheckCircle size={48} color="#22c55e" className="tfa-already-setup-icon" />
          <h2 className="tfa-already-setup-title">2FA Already Enabled</h2>
          <p className="tfa-already-setup-text">
            Two-factor authentication is already set up for this account.
          </p>
        </div>
      </AuthCard>
    );
  }

  if (step === 'success') {
    return (
      <AuthCard title="Ethio Nordic Trading PLC">
        <div className="tfa-success">
          <CheckCircle size={48} color="#22c55e" className="tfa-success-icon" />
          <h2 className="tfa-success-title">Your two-factor authentication has been enabled successfully</h2>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Ethio Nordic Trading PLC" subtitle="Set Up Two-Factor Authentication">
      <div className="login-form">
        {error && <AuthError message={error} />}

        {step === 'scan' && (
          <>
            <div className="tfa-scan-header">
              <Shield size={40} color="#4f46e5" className="tfa-scan-icon" />
              <p className="tfa-scan-instructions">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <QRCodeDisplay url={qrCodeUrl} />
            </div>

            <form onSubmit={handleVerify}>
              <TwoFactorInput value={verifyCode} onChange={setVerifyCode} />

              <button
                type="submit"
                className="tfa-verify-btn"
                disabled={loading || verifyCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Submit'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthCard>
  );
}
