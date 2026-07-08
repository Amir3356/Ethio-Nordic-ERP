import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services';
import { getAuthErrorMessage } from '../utils';

type SetupStep = 'loading' | 'error' | 'already_setup' | 'scan' | 'success';

export function useTwoFactorSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState<SetupStep>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStep('error');
      return;
    }
    fetchSetup();
  }, [token]);

  const fetchSetup = async () => {
    try {
      const response = await authAPI.setupTwoFactorOnboarding(token!);
      const data = response.data;

      if (data.data?.already_setup) {
        setStep('already_setup');
        return;
      }

      setQrCodeUrl(data.data?.qr_code_url || '');
      setStep('scan');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
      setStep('error');
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyTwoFactorOnboarding(token!, verifyCode);
      const data = response.data;
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('refreshToken', data.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    token,
    step,
    qrCodeUrl,
    verifyCode,
    setVerifyCode,
    error,
    loading,
    handleVerify,
  };
}
