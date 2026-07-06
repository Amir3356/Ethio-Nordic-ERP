import { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{title}</h1>
          {subtitle && <p className="activate-subtitle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
