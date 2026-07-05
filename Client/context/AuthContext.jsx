import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const data = response.data;

    if (data.requires_two_factor) {
      setRequiresTwoFactor(true);
      setTwoFactorEmail(email);
      return { requiresTwoFactor: true };
    }

    localStorage.setItem('user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    setRequiresTwoFactor(false);
    return { success: true };
  };

  const verifyTwoFactor = async (code) => {
    const response = await authService.verifyTwoFactor(twoFactorEmail, code);
    const data = response.data;

    localStorage.setItem('user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    setRequiresTwoFactor(false);
    setTwoFactorEmail('');
    return { success: true };
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore
    }
    localStorage.removeItem('user');
    setUser(null);
    setRequiresTwoFactor(false);
  };

  const hasRole = (roleSlug) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.slug === roleSlug);
  };

  const hasPermission = (permissionSlug) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) =>
      r.permissions && r.permissions.some((p) => p.slug === permissionSlug)
    );
  };

  const canPerform = (module, action) => {
    return hasPermission(`${module}.${action}`);
  };

  const isAdmin = () => hasRole('admin');

  const value = {
    user,
    loading,
    login,
    logout,
    verifyTwoFactor,
    requiresTwoFactor,
    hasRole,
    hasPermission,
    canPerform,
    isAdmin,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
