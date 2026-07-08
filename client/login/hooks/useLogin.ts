import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services';
import { storeAuth, getAuthErrorMessage } from '../utils';

export function useLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@ethionordic.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setError(''), 4000);
    }
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, [error]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [requiresTwoFactorSetup, setRequiresTwoFactorSetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(email, password, confirmPassword, requiresTwoFactor || requiresTwoFactorSetup ? twoFactorCode : null);
      const body = response.data;
      const payload = body.data;

      if (payload?.requires_2fa_setup) {
        setRequiresTwoFactorSetup(true);
        setQrCodeUrl(payload.qr_code_url || '');
        setLoading(false);
        return;
      }

      if (payload?.requires_2fa) {
        setRequiresTwoFactor(true);
        setLoading(false);
        return;
      }

      storeAuth(payload);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
      setRequiresTwoFactor(false);
      setRequiresTwoFactorSetup(false);
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  const resetTwoFactor = () => {
    setRequiresTwoFactor(false);
    setRequiresTwoFactorSetup(false);
    setTwoFactorCode('');
    setQrCodeUrl('');
    setError('');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    twoFactorCode,
    setTwoFactorCode,
    error,
    loading,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    requiresTwoFactor,
    requiresTwoFactorSetup,
    qrCodeUrl,
    handleLogin,
    resetTwoFactor,
  };
}
