import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  showPassword,
  onToggleShow,
  placeholder = 'Enter your password',
  autoFocus = false,
}: PasswordInputProps) {
  return (
    <div className="input-wrapper">
      <Lock size={18} className="input-icon" />
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={onToggleShow}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
