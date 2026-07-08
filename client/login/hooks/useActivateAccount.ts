import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services';
import { getAuthErrorMessage } from '../utils';

export function useActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Validate confirm password matches
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/activate', { token, password, confirm_password: confirmPassword });
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
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    error,
    loading,
    success,
    handleActivate,
  };
}
