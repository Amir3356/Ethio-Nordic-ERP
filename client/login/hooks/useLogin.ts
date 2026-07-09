import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services';
import { storeAuth, getAuthErrorMessage } from '../utils';

export function useLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [requiresTwoFactorSetup, setRequiresTwoFactorSetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      const response = await authAPI.login(email, password, requiresTwoFactor || requiresTwoFactorSetup ? twoFactorCode : null);
      const body = response.data;
      const contentType = response.headers?.['content-type'] || '';

      if (!body || typeof body !== 'object') {
        console.error('Unexpected response:', {
          status: response.status,
          contentType,
          type: typeof body,
          preview: String(body).slice(0, 200),
        });
        throw new TypeError(
          `Server returned ${response.status} ${response.statusText} (${contentType}). ` +
          `Expected JSON, got ${typeof body}.`
        );
      }

      const payload = (body as Record<string, unknown>).data;

      if (payload && typeof payload === 'object') {
        const p = payload as Record<string, unknown>;

        if (p.requires_2fa_setup) {
          setRequiresTwoFactorSetup(true);
          setQrCodeUrl(typeof p.qr_code_url === 'string' ? p.qr_code_url : '');
          setLoading(false);
          return;
        }

        if (p.requires_2fa) {
          setRequiresTwoFactor(true);
          setLoading(false);
          return;
        }
      }

      if (payload && typeof payload === 'object') {
        storeAuth(payload as { token?: string; refresh_token?: string; user?: Record<string, unknown> });
        navigate('/dashboard', { replace: true });
      } else {
        throw new TypeError('Login succeeded but no user data was returned.');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
      if (!requiresTwoFactor && !requiresTwoFactorSetup) {
        setRequiresTwoFactor(false);
        setRequiresTwoFactorSetup(false);
      }
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
    twoFactorCode,
    setTwoFactorCode,
    error,
    loading,
    showPassword,
    setShowPassword,
    requiresTwoFactor,
    requiresTwoFactorSetup,
    qrCodeUrl,
    handleLogin,
    resetTwoFactor,
  };
}
