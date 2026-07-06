export interface LoginState {
  email: string;
  password: string;
  twoFactorCode: string;
  error: string;
  loading: boolean;
  showPassword: boolean;
  requiresTwoFactor: boolean;
}

export interface ActivateAccountState {
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
  success: boolean;
}

export interface TwoFactorSetupState {
  step: 'loading' | 'error' | 'already_setup' | 'scan' | 'success';
  qrCodeUrl: string;
  secret: string;
  recoveryCodes: string[];
  verifyCode: string;
  error: string;
  loading: boolean;
}
