export type Role = 'super_admin' | 'admin' | 'cafe_owner' | 'manager';
export type TwoFAMethod = 'authenticator' | 'sms' | 'email' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdBy: string | null;
  assignedScope: string[];
  avatar?: string;
  is2FAEnabled: boolean;
  twoFAMethod: TwoFAMethod;
  phone?: string;
  address?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  is2FAVerified: boolean;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  login: (email: string, password: string) => { success: boolean; requires2FA: boolean; error?: string };
  verify2FA: (code: string) => boolean;
  logout: () => void;
  toggleTheme: () => void;
  enable2FA: (method: TwoFAMethod, phone?: string) => void;
  disable2FA: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'address' | 'logoUrl'>>) => void;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; error?: string };
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  cafe_owner: 'Cafe Owner',
  manager: 'Manager',
};

export const ROLE_HIERARCHY: Record<Role, Role | null> = {
  super_admin: null,
  admin: 'super_admin',
  cafe_owner: 'admin',
  manager: 'cafe_owner',
};

export const CHILD_ROLE: Record<Role, Role | null> = {
  super_admin: 'admin',
  admin: 'cafe_owner',
  cafe_owner: 'manager',
  manager: null,
};

export const ROLE_RANK: Record<Role, number> = {
  super_admin: 0,
  admin: 1,
  cafe_owner: 2,
  manager: 3,
};
