// POC mode — hides non-essential features for the Pilot Cafe Demo.
// Set to false to restore the full application surface.
export const POC_MODE = true;

// Routes available in POC mode (paths must match those in rbac.ts / App.tsx).
export const POC_ALLOWED_PATHS = new Set<string>([
  '/dashboard',
  '/branches',
  '/seats',
  '/billing/session',
  '/billing/settlements',
  '/notifications',
  '/settings',
  '/gpu-nodes',
  '/users',
  '/analytics',
  '/monitoring',
  '/bookings',
  '/issues',
  '/deletion-requests',
]);

// Roles that can sign in during the POC demo.
// Allowed: super_admin and cafe_owner. Other roles are restricted without deleting their code.
export const POC_ALLOWED_ROLES = new Set<string>(['super_admin', 'cafe_owner']);

export function isPocPathAllowed(path: string): boolean {
  if (!POC_MODE) return true;
  return POC_ALLOWED_PATHS.has(path);
}
