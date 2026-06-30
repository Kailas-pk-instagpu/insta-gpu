// POC mode — hides non-essential features for the Pilot Cafe Demo.
// Set to false to restore the full application surface.
export const POC_MODE = true;

// Routes available in POC mode (paths must match those in rbac.ts / App.tsx).
export const POC_ALLOWED_PATHS = new Set<string>([
  '/dashboard',
  '/branches',
  '/seats',
  '/billing/session',
  '/notifications',
  '/settings',
]);

// Roles that can sign in during the POC demo.
export const POC_ALLOWED_ROLES = new Set<string>(['cafe_owner', 'manager']);

export function isPocPathAllowed(path: string): boolean {
  if (!POC_MODE) return true;
  return POC_ALLOWED_PATHS.has(path);
}
