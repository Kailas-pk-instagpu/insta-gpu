import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { AuthService } from '@/services/auth.service';
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
    try {
      const data = await AuthService.login(trimmedEmail, password);
      if (data?.user) {
        const apiUser = data.user;
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

        setAuthDetails({
          user,
          token: data.token || `token-${Date.now()}`,
          isAuthenticated: true,
          is2FAVerified: true,
        });
        navigate('/dashboard');
        return;
      }
    } catch (err: any) {
      // 2. Fallback to mock / demo accounts if backend rejects or is offline
      const matchedMockUser = MOCK_USERS.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail ||
          (cleanEmail.startsWith('superadmin') && u.role === 'super_admin') ||
          (cleanEmail.startsWith('admin') && u.role === 'admin') ||
          (cleanEmail.startsWith('owner') && u.role === 'cafe_owner') ||
          (cleanEmail.startsWith('manager') && u.role === 'manager')
      );

      if (matchedMockUser) {
        const user: User = {
          ...matchedMockUser,
          email: trimmedEmail,
        };
        const token = `mock-jwt-${matchedMockUser.id}-${Date.now()}`;
        setAuthDetails({
          user,
          token,
          isAuthenticated: true,
          is2FAVerified: true,
        });
        navigate('/dashboard');
        return;
      }

      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error, clearError };
};
