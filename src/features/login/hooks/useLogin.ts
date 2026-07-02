import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { AuthService } from '@/services/auth.service';
import { POC_MODE, POC_ALLOWED_ROLES } from '@/shared/lib/pocConfig';
import { User } from '@/shared/types/auth';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);

  const login = async (email: string, password: string) => {
    setError('');
    setLoading(true);

    try {
      const data = await AuthService.login(email, password);
      const { user: apiUser, token } = data;

      // POC role restriction — check before setting any auth state
      if (POC_MODE && !POC_ALLOWED_ROLES.has(apiUser.role)) {
        setError('This account is not available in the demo. Use the Cafe Owner or Manager account.');
        setLoading(false);
        return;
      }

      // Map backend API user shape to the frontend User type
      // The API returns: { id, name, role, branch_id }
      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        role: apiUser.role,
        email: email, // email is not returned by API, use the one entered
        createdBy: null,
        assignedScope: apiUser.branch_id ? [apiUser.branch_id] : [],
        is2FAEnabled: false, // 2FA state managed separately once 2FA API is integrated
        twoFAMethod: null,
        createdAt: new Date().toISOString(),
      };

      setAuthDetails({ user, token, isAuthenticated: true, is2FAVerified: true });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};
