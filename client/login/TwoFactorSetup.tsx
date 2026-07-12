import { CheckCircle, Shield } from 'lucide-react';
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
      <AuthCard title="Ethio Nordic Trading PLC" subtitle="2FA Enabled">
        <div className="tfa-success">
          <CheckCircle size={48} color="#22c55e" className="tfa-success-icon" />
          <h2 className="tfa-success-title">Two-Factor Authentication Enabled!</h2>
          <p className="tfa-success-text">
            Your account is now secured. Redirecting to dashboard...
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Ethio Nordic Trading PLC" subtitle="Set Up Two-Factor Authentication">
      <form className="login-form" onSubmit={handleVerify}>
        {error && <AuthError message={error} />}

        {step === 'scan' && (
          <div className="tfa-scan-section">
            <Shield size={40} color="#4f46e5" className="tfa-scan-icon" />
            <p className="form-hint">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
            <QRCodeDisplay url={qrCodeUrl} />
            <TwoFactorInput value={verifyCode} onChange={setVerifyCode} />

            <button
              type="submit"
              className="login-btn"
              disabled={verifyCode.length !== 6}
            >
              Verify
            </button>
          </div>
        )}
      </form>
    </AuthCard>
  );
}
