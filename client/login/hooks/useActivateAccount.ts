import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services';
import { getAuthErrorMessage } from '../utils';

export function useActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // After successful activation, auto-redirect to 2FA setup
  useEffect(() => {
    if (!success || !token) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate(`/setup-2fa?token=${encodeURIComponent(token!)}`, { replace: true });
    }, 2000);

    return () => window.clearTimeout(redirectTimer);
  }, [success, token, navigate]);

  const handleActivate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      await api.post('/auth/activate', { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    token,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    loading,
    success,
    handleActivate,
  };
}
