import { AlertTriangle, CheckCircle, Shield, Copy, KeyRound } from 'lucide-react';
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
    secret,
    recoveryCodes,
    verifyCode,
    setVerifyCode,
    error,
    loading,
    handleVerify,
    handleSkip,
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
      <AuthCard title="Ethio Nordic Trading PLC" subtitle="2FA Enabled">
        <div className="tfa-success">
          <CheckCircle size={48} color="#22c55e" className="tfa-success-icon" />
          <h2 className="tfa-success-title">Two-Factor Authentication Enabled!</h2>
          <p className="tfa-success-text">
            Your account is now secured. Redirecting to login...
          </p>
          <div className="tfa-loading-bar">
            <div className="tfa-loading-bar-fill" />
          </div>
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

            {secret && (
              <div className="tfa-manual-entry">
                <p className="tfa-manual-entry-label">
                  <KeyRound size={14} /> Or enter this key manually:
                </p>
                <code className="tfa-secret-key">{secret}</code>
              </div>
            )}

            <form onSubmit={handleVerify}>
              <TwoFactorInput value={verifyCode} onChange={setVerifyCode} />

              <button
                type="submit"
                className="tfa-verify-btn"
                disabled={loading || verifyCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </form>

            {recoveryCodes.length > 0 && (
              <div className="tfa-recovery-codes">
                <p className="tfa-recovery-codes-title">
                  <AlertTriangle size={14} /> Save your recovery codes
                </p>
                <p className="tfa-recovery-codes-desc">
                  Store these codes somewhere safe. Each code can only be used once if you lose access to your authenticator app.
                </p>
                <div className="tfa-recovery-codes-grid">
                  {recoveryCodes.map((code, i) => (
                    <code key={i} className="tfa-recovery-code">{code}</code>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="tfa-skip-btn" onClick={handleSkip}>
              Skip for now
            </button>
          </>
        )}
      </div>
    </AuthCard>
  );
}
