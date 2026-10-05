import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { AuthService } from '@/services/auth.service';
import { POC_MODE, POC_ALLOWED_ROLES } from '@/shared/lib/pocConfig';
import { MOCK_USERS } from '@/shared/lib/mock-data';
import { User } from '@/shared/types/auth';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);

  const clearError = () => setError('');

  const login = async (email: string, password: string) => {
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const cleanEmail = trimmedEmail.toLowerCase();

    // 1. Attempt API authentication with the backend
    let apiUser: any = null;
    let apiToken: string | null = null;
    let backendErrorMessage: string | null = null;

    try {
      const data = await AuthService.login(trimmedEmail, password);
      if (data?.user) {
        apiUser = data.user;
        apiToken = data.token;
      }
    } catch (err: any) {
      backendErrorMessage = err?.message || 'Login failed';
    }

    // 2. If backend authenticated successfully
    if (apiUser) {
      if (POC_MODE && !POC_ALLOWED_ROLES.has(apiUser.role)) {
        setError('Access restricted. Only Super Admin and Cafe Owner accounts can sign in.');
        setLoading(false);
        return;
      }

      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        role: apiUser.role,
        email: trimmedEmail,
        createdBy: null,
        assignedScope: apiUser.branch_id ? [apiUser.branch_id] : ['*'],
        is2FAEnabled: false,
        twoFAMethod: null,
        createdAt: new Date().toISOString(),
      };

      setAuthDetails({ user, token: apiToken || `token-${Date.now()}`, isAuthenticated: true, is2FAVerified: true });
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    // 3. Fallback to mock / demo users (e.g. superadmin@gpucloud.io, owner@gpucloud.io)
    const matchedMockUser = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (cleanEmail.startsWith('superadmin') && u.role === 'super_admin') ||
        (cleanEmail.startsWith('owner') && u.role === 'cafe_owner') ||
        (cleanEmail.startsWith('admin') && u.role === 'admin') ||
        (cleanEmail.startsWith('manager') && u.role === 'manager')
    );

    if (matchedMockUser) {
      // Role check for mock accounts — only super_admin and cafe_owner permitted
      if (POC_MODE && !POC_ALLOWED_ROLES.has(matchedMockUser.role)) {
        setError('Access restricted. Only Super Admin and Cafe Owner accounts can sign in.');
        setLoading(false);
        return;
      }

      const user: User = {
        ...matchedMockUser,
        email: trimmedEmail,
      };

      const token = `mock-jwt-${matchedMockUser.id}-${Date.now()}`;
      setAuthDetails({ user, token, isAuthenticated: true, is2FAVerified: true });
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    // 4. If neither backend nor mock matched, display error
    setError(backendErrorMessage || 'Invalid credentials');
    setLoading(false);
  };

  return { login, loading, error, setError, clearError };
};
