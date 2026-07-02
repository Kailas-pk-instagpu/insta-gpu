import { User, Role } from '../types/auth';

export const MOCK_USERS: User[] = [
  { id: '1', email: 'superadmin@gpucloud.io', name: 'Alex Mercer', role: 'super_admin', createdBy: null, assignedScope: ['*'], is2FAEnabled: true, twoFAMethod: 'authenticator', createdAt: '2024-01-01' },
  { id: '2', email: 'admin@gpucloud.io', name: 'Jordan Lee', role: 'admin', createdBy: '1', assignedScope: ['cafe-1', 'cafe-2', 'cafe-3'], is2FAEnabled: true, twoFAMethod: 'authenticator', createdAt: '2024-02-15' },
  { id: '3', email: 'admin2@gpucloud.io', name: 'Taylor Kim', role: 'admin', createdBy: '1', assignedScope: ['cafe-4', 'cafe-5'], is2FAEnabled: true, twoFAMethod: 'email', createdAt: '2024-03-01' },
  { id: '4', email: 'owner@gpucloud.io', name: 'Sam Rivera', role: 'cafe_owner', createdBy: '2', assignedScope: ['cafe-1'], is2FAEnabled: true, twoFAMethod: 'sms', phone: '+1555123456', createdAt: '2024-04-10' },
  { id: '5', email: 'owner2@gpucloud.io', name: 'Casey Park', role: 'cafe_owner', createdBy: '2', assignedScope: ['cafe-2'], is2FAEnabled: false, twoFAMethod: null, createdAt: '2024-04-15' },
  { id: '6', email: 'manager@gpucloud.io', name: 'Riley Chen', role: 'manager', createdBy: '4', assignedScope: ['branch-1'], is2FAEnabled: false, twoFAMethod: null, createdAt: '2024-05-01' },
  { id: '7', email: 'manager2@gpucloud.io', name: 'Morgan Tran', role: 'manager', createdBy: '4', assignedScope: ['branch-2'], is2FAEnabled: false, twoFAMethod: null, createdAt: '2024-05-10' },
];




export interface BranchBilling {
  costPerMinute: number; // in MYR (RM)
  lockedAmount: number; // default reserved amount
  currency: 'MYR';
}

export interface Branch {
  id: string;
  name: string;
  cafeId: string;
  address: string;
  totalSeats: number;
  activeSeats: number;
  status: 'active' | 'maintenance' | 'inactive';
  adminId?: string;
  cafeOwnerId?: string;
  managerId?: string;
  billing: BranchBilling;
}

export interface Seat {
  id: string;
  branchId: string;
  number: number;
  status: 'available' | 'occupied' | 'maintenance';
  playerName?: string;
  startTime?: string;
  endTime?: string;
  gpuModel: string;
  label?: string;
}

export const GPU_MODEL_OPTIONS = [
  'RTX 4090',
  'RTX 4080',
  'RTX 4070 Ti',
  'RTX 4070',
  'RTX 4060 Ti',
  'RTX 3090',
  'RTX 3080',
  'RTX 3070',
] as const;

export type GPUNodeStatus = 'online' | 'offline' | 'warning' | 'maintenance' | 'overloaded';
export type GPUHealth = 'healthy' | 'degraded' | 'critical';

export interface GPUNode {
  id: string;
  name: string;
  status: GPUNodeStatus;
  gpuModel: string;
  temperature: number;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  location: string;
  branchId: string;
  health: GPUHealth;
  uptimeHours: number;
  powerDrawW: number;
  fanSpeed: number;
  driverVersion: string;
  cudaVersion: string;
  vbiosVersion: string;
  serialNumber: string;
  ipAddress: string;
  lastMaintenance: string;
  installedAt: string;
  activeSessions: number;
  totalSessions: number;
  avgSessionMinutes: number;
  clockMhz: number;
  memoryClockMhz: number;
  pcieGen: string;
}

export const MOCK_BRANCHES: Branch[] = [
  { id: 'branch-1', name: 'Downtown Hub', cafeId: 'cafe-1', address: '123 Main St', totalSeats: 20, activeSeats: 14, status: 'active', adminId: '2', cafeOwnerId: '4', managerId: '6', billing: { costPerMinute: 2, lockedAmount: 100, currency: 'MYR' } },
  { id: 'branch-2', name: 'Uptown Arena', cafeId: 'cafe-1', address: '456 High St', totalSeats: 15, activeSeats: 10, status: 'active', adminId: '2', cafeOwnerId: '4', managerId: '7', billing: { costPerMinute: 3, lockedAmount: 150, currency: 'MYR' } },
  { id: 'branch-3', name: 'Westside Lounge', cafeId: 'cafe-2', address: '789 West Blvd', totalSeats: 25, activeSeats: 18, status: 'active', adminId: '2', cafeOwnerId: '5', billing: { costPerMinute: 2.5, lockedAmount: 120, currency: 'MYR' } },
  { id: 'branch-4', name: 'Eastside Den', cafeId: 'cafe-2', address: '321 East Ave', totalSeats: 12, activeSeats: 8, status: 'maintenance', adminId: '3', billing: { costPerMinute: 1.5, lockedAmount: 80, currency: 'MYR' } },
];

function generateSeatsForBranch(branchId: string, total: number, activeCount: number): Seat[] {
  const players = ['John D.', 'Sarah M.', 'Mike T.', 'Lisa K.', 'Dave W.', 'Amy R.', 'Chris L.', 'Nina P.', 'Tom B.', 'Zoe W.'];
  const gpus = ['RTX 4090', 'RTX 4080', 'RTX 4070 Ti'];
  return Array.from({ length: total }, (_, i) => ({
    id: `${branchId}-seat-${i + 1}`,
    branchId,
    number: i + 1,
    status: (i < activeCount ? 'occupied' : i === total - 1 && total > 3 ? 'maintenance' : 'available') as Seat['status'],
    playerName: i < activeCount ? players[i % players.length] : undefined,
    startTime: i < activeCount ? `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'} AM` : undefined,
    gpuModel: gpus[i % 3],
  }));
}

export const MOCK_SEATS: Seat[] = [
  ...generateSeatsForBranch('branch-1', 20, 14),
  ...generateSeatsForBranch('branch-2', 15, 10),
  ...generateSeatsForBranch('branch-3', 25, 18),
  ...generateSeatsForBranch('branch-4', 12, 8),
];

export const MOCK_GPU_NODES: GPUNode[] = [
  { id: 'gpu-1', name: 'Node Alpha', status: 'online', gpuModel: 'RTX 4090', temperature: 62, utilization: 78, memoryUsed: 18, memoryTotal: 24, location: 'Downtown Hub', branchId: 'branch-1', health: 'healthy', uptimeHours: 720, powerDrawW: 340, fanSpeed: 55, driverVersion: '550.78', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.A1', serialNumber: 'SN-4090-A001', ipAddress: '10.0.1.11', lastMaintenance: '2026-03-12', installedAt: '2024-09-01', activeSessions: 3, totalSessions: 1240, avgSessionMinutes: 92, clockMhz: 2520, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-2', name: 'Node Beta', status: 'online', gpuModel: 'RTX 4090', temperature: 58, utilization: 65, memoryUsed: 15, memoryTotal: 24, location: 'Downtown Hub', branchId: 'branch-1', health: 'healthy', uptimeHours: 690, powerDrawW: 310, fanSpeed: 48, driverVersion: '550.78', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.A1', serialNumber: 'SN-4090-A002', ipAddress: '10.0.1.12', lastMaintenance: '2026-03-12', installedAt: '2024-09-01', activeSessions: 2, totalSessions: 1110, avgSessionMinutes: 85, clockMhz: 2475, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-3', name: 'Node Gamma', status: 'overloaded', gpuModel: 'RTX 4080', temperature: 82, utilization: 95, memoryUsed: 15, memoryTotal: 16, location: 'Uptown Arena', branchId: 'branch-2', health: 'degraded', uptimeHours: 1450, powerDrawW: 320, fanSpeed: 92, driverVersion: '550.54', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.B0', serialNumber: 'SN-4080-B003', ipAddress: '10.0.2.13', lastMaintenance: '2026-01-22', installedAt: '2024-06-15', activeSessions: 5, totalSessions: 2105, avgSessionMinutes: 110, clockMhz: 2505, memoryClockMhz: 11200, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-4', name: 'Node Delta', status: 'offline', gpuModel: 'RTX 4080', temperature: 0, utilization: 0, memoryUsed: 0, memoryTotal: 16, location: 'Westside Lounge', branchId: 'branch-3', health: 'critical', uptimeHours: 0, powerDrawW: 0, fanSpeed: 0, driverVersion: '550.54', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.B0', serialNumber: 'SN-4080-B004', ipAddress: '10.0.3.14', lastMaintenance: '2026-04-05', installedAt: '2024-05-20', activeSessions: 0, totalSessions: 1830, avgSessionMinutes: 88, clockMhz: 0, memoryClockMhz: 0, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-5', name: 'Node Epsilon', status: 'online', gpuModel: 'RTX 4070 Ti', temperature: 55, utilization: 42, memoryUsed: 6, memoryTotal: 12, location: 'Eastside Den', branchId: 'branch-4', health: 'healthy', uptimeHours: 410, powerDrawW: 220, fanSpeed: 38, driverVersion: '550.78', cudaVersion: '12.4', vbiosVersion: '95.04.2A.00.C1', serialNumber: 'SN-4070-C005', ipAddress: '10.0.4.15', lastMaintenance: '2026-02-28', installedAt: '2024-11-10', activeSessions: 1, totalSessions: 520, avgSessionMinutes: 74, clockMhz: 2610, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-6', name: 'Node Zeta', status: 'maintenance', gpuModel: 'RTX 3090', temperature: 0, utilization: 0, memoryUsed: 0, memoryTotal: 24, location: 'Uptown Arena', branchId: 'branch-2', health: 'degraded', uptimeHours: 0, powerDrawW: 0, fanSpeed: 0, driverVersion: '545.23', cudaVersion: '12.3', vbiosVersion: '94.02.42.00.D0', serialNumber: 'SN-3090-D006', ipAddress: '10.0.2.16', lastMaintenance: '2026-05-15', installedAt: '2023-08-12', activeSessions: 0, totalSessions: 3210, avgSessionMinutes: 96, clockMhz: 0, memoryClockMhz: 0, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-7', name: 'Node Eta', status: 'warning', gpuModel: 'RTX 4070', temperature: 76, utilization: 88, memoryUsed: 10, memoryTotal: 12, location: 'Downtown Hub', branchId: 'branch-1', health: 'degraded', uptimeHours: 980, powerDrawW: 195, fanSpeed: 78, driverVersion: '550.54', cudaVersion: '12.4', vbiosVersion: '95.04.2A.00.E0', serialNumber: 'SN-4070-E007', ipAddress: '10.0.1.17', lastMaintenance: '2026-02-10', installedAt: '2024-07-22', activeSessions: 2, totalSessions: 1640, avgSessionMinutes: 80, clockMhz: 2475, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
];

export const REVENUE_DATA = [
  { name: 'Mon', revenue: 4200, sessions: 42 },
  { name: 'Tue', revenue: 3800, sessions: 38 },
  { name: 'Wed', revenue: 5100, sessions: 51 },
  { name: 'Thu', revenue: 4700, sessions: 47 },
  { name: 'Fri', revenue: 6300, sessions: 63 },
  { name: 'Sat', revenue: 7800, sessions: 78 },
  { name: 'Sun', revenue: 7200, sessions: 72 },
];

export const MONTHLY_REVENUE = [
  { name: 'Jan', revenue: 82000 },
  { name: 'Feb', revenue: 95000 },
  { name: 'Mar', revenue: 110000 },
  { name: 'Apr', revenue: 102000 },
  { name: 'May', revenue: 125000 },
  { name: 'Jun', revenue: 138000 },
];

export interface Booking {
  id: string;
  branchId: string;
  seatNumber: number;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show';
  gpuPreference?: string;
  notes?: string;
  createdBy: string; // userId
  createdAt: string;
}

export interface CustomerWallet {
  id: string;
  name: string;
  phone: string;
  branchId: string;
  balance: number; // total wallet balance in MYR (RM)
  lockedAmount: number; // currently reserved for an active session
}

export const MOCK_CUSTOMER_WALLETS: CustomerWallet[] = [
  { id: 'cw-1', name: 'Aiden Cole', phone: '+1555000111', branchId: 'branch-1', balance: 500, lockedAmount: 100 },
  { id: 'cw-2', name: 'Maya Lin', phone: '+1555000222', branchId: 'branch-1', balance: 1200, lockedAmount: 200 },
  { id: 'cw-3', name: 'Derek Shaw', phone: '+1555000333', branchId: 'branch-1', balance: 320, lockedAmount: 80 },
  { id: 'cw-4', name: 'Priya Nair', phone: '+1555000444', branchId: 'branch-2', balance: 750, lockedAmount: 150 },
  { id: 'cw-5', name: 'Leo Tanaka', phone: '+1555000555', branchId: 'branch-2', balance: 250, lockedAmount: 100 },
  { id: 'cw-6', name: 'Sara Ahmed', phone: '+1555000666', branchId: 'branch-3', balance: 900, lockedAmount: 120 },
  { id: 'cw-7', name: 'Omar Hassan', phone: '+1555000777', branchId: 'branch-3', balance: 450, lockedAmount: 100 },
  { id: 'cw-8', name: 'Nina Park', phone: '+1555000888', branchId: 'branch-4', balance: 600, lockedAmount: 80 },
];

export const MOCK_BOOKINGS: Booking[] = [
  { id: 'bk-1', branchId: 'branch-1', seatNumber: 3, customerName: 'Aiden Cole', customerPhone: '+1555000111', date: '2026-04-10', startTime: '10:00', endTime: '12:00', status: 'upcoming', gpuPreference: 'RTX 4090', createdBy: '6', createdAt: '2026-04-08' },
  { id: 'bk-2', branchId: 'branch-1', seatNumber: 7, customerName: 'Maya Lin', customerPhone: '+1555000222', date: '2026-04-10', startTime: '14:00', endTime: '17:00', status: 'upcoming', notes: 'VIP customer', createdBy: '6', createdAt: '2026-04-08' },
  { id: 'bk-3', branchId: 'branch-1', seatNumber: 1, customerName: 'Derek Shaw', customerPhone: '+1555000333', date: '2026-04-09', startTime: '09:00', endTime: '11:00', status: 'completed', gpuPreference: 'RTX 4080', createdBy: '4', createdAt: '2026-04-07' },
  { id: 'bk-4', branchId: 'branch-2', seatNumber: 5, customerName: 'Priya Nair', customerPhone: '+1555000444', date: '2026-04-11', startTime: '16:00', endTime: '19:00', status: 'upcoming', createdBy: '4', createdAt: '2026-04-08' },
  { id: 'bk-5', branchId: 'branch-1', seatNumber: 10, customerName: 'Leo Tanaka', customerPhone: '+1555000555', date: '2026-04-08', startTime: '13:00', endTime: '15:00', status: 'cancelled', createdBy: '6', createdAt: '2026-04-06' },
  { id: 'bk-6', branchId: 'branch-2', seatNumber: 2, customerName: 'Sara Ahmed', customerPhone: '+1555000666', date: '2026-04-09', startTime: '11:00', endTime: '14:00', status: 'no_show', createdBy: '7', createdAt: '2026-04-07' },
];
