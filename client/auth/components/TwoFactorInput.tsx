import { Shield } from 'lucide-react';

interface TwoFactorInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TwoFactorInput({ value, onChange }: TwoFactorInputProps) {
  return (
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
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
          className="tfa-code-input"
        />
      </div>
    </div>
  );
}
