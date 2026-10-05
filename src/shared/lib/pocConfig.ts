// POC mode disabled — all features and pages are enabled for all user roles.
export const POC_MODE = false;

// All application routes available
export const POC_ALLOWED_PATHS = new Set<string>([
  '/dashboard',
  '/users',
  '/gpu-nodes',
  '/branches',
  '/seats',
  '/bookings',
  '/billing/session',
  '/billing/settlements',
  '/monitoring',
  '/issues',
  '/deletion-requests',
  '/analytics',
  '/notifications',
  '/settings',
]);

// All roles permitted to sign in and use the platform
export const POC_ALLOWED_ROLES = new Set<string>([
  'super_admin',
  'admin',
  'cafe_owner',
  'manager',
]);

export function isPocPathAllowed(_path: string): boolean {
  return true;
}
