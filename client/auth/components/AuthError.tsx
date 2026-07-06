import { AlertTriangle } from 'lucide-react';

interface AuthErrorProps {
  message: string;
}

export default function AuthError({ message }: AuthErrorProps) {
  return (
    <div className="login-error">
      <AlertTriangle className="error-icon" size={20} />
      <span>{message}</span>
    </div>
  );
}
