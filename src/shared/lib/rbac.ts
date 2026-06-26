import { Role, ROLE_RANK, CHILD_ROLE } from '../types/auth';

export function canCreateRole(creatorRole: Role): Role | null {
  return CHILD_ROLE[creatorRole];
}

export function canManageUser(creatorRole: Role, targetRole: Role): boolean {
  return ROLE_RANK[creatorRole] < ROLE_RANK[targetRole];
}

export function getVisibleUsers(currentRole: Role, currentUserId: string, allUsers: { role: Role; createdBy: string | null }[]): typeof allUsers {
  if (currentRole === 'super_admin') return allUsers;
  return allUsers.filter(u => u.createdBy === currentUserId || canManageUser(currentRole, u.role));
}

export interface RouteConfig {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
}

export const ROUTES: RouteConfig[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['super_admin', 'admin', 'cafe_owner', 'manager'] },
  { path: '/users', label: 'User Management', icon: 'Users', roles: ['super_admin', 'admin', 'cafe_owner'] },
  { path: '/gpu-nodes', label: 'GPU Nodes', icon: 'Cpu', roles: ['super_admin'] },
  { path: '/branches', label: 'Branches', icon: 'Building2', roles: ['super_admin', 'admin', 'cafe_owner'] },
  { path: '/seats', label: 'Seat Management', icon: 'Monitor', roles: ['manager'] },
  { path: '/bookings', label: 'Pre-Booking', icon: 'CalendarCheck', roles: ['cafe_owner', 'manager'] },
  { path: '/billing/session', label: 'Billing Session', icon: 'Wallet', roles: ['super_admin', 'admin', 'cafe_owner', 'manager'] },
  { path: '/monitoring', label: 'Monitoring', icon: 'Radar', roles: ['super_admin'] },
  { path: '/issues', label: 'Issue Reports', icon: 'AlertTriangle', roles: ['super_admin', 'admin', 'cafe_owner'] },
  { path: '/deletion-requests', label: 'Deletion Requests', icon: 'UserMinus', roles: ['super_admin'] },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart3', roles: ['super_admin', 'admin', 'cafe_owner'] },
  { path: '/notifications', label: 'Notifications', icon: 'Bell', roles: ['super_admin', 'admin', 'cafe_owner', 'manager'] },
  { path: '/settings', label: 'Settings', icon: 'Settings', roles: ['super_admin', 'admin', 'cafe_owner', 'manager'] },
];

export function getRoutesForRole(role: Role): RouteConfig[] {
  return ROUTES.filter(r => r.roles.includes(role));
}
