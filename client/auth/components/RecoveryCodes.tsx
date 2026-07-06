interface RecoveryCodesProps {
  codes: string[];
}

export default function RecoveryCodes({ codes }: RecoveryCodesProps) {
  if (codes.length === 0) return null;

  return (
    <div className="tfa-recovery-codes">
      <p className="tfa-recovery-codes-title">Save your recovery codes:</p>
      <div className="tfa-recovery-codes-list">
        {codes.map((code, i) => (
          <span key={i} className="tfa-recovery-code">{code}</span>
        ))}
      </div>
    </div>
  );
}
