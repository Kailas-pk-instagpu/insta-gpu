import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { Role } from '@/shared/types/auth';
import { POC_MODE, POC_ALLOWED_PATHS } from '@/shared/lib/pocConfig';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (POC_MODE && !POC_ALLOWED_PATHS.has(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
