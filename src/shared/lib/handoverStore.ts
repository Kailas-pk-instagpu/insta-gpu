import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '../types/auth';

export type HandoverPriority = 'info' | 'attention' | 'urgent';

export interface HandoverNote {
  id: string;
  branchId: string;
  branchName: string;
  shiftLabel: string;
  summary: string;
  pendingTasks: string;
  incidents: string;
  cashNotes: string;
  priority: HandoverPriority;
  authorId: string;
  authorName: string;
  authorRole: Role;
  createdAt: string;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
}

export const PRIORITY_META: Record<HandoverPriority, { label: string; className: string }> = {
  info: { label: 'Info', className: 'bg-muted text-muted-foreground border-border' },
  attention: { label: 'Needs Attention', className: 'bg-warning/10 text-warning border-warning/20' },
  urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

interface HandoverState {
  notes: HandoverNote[];
  createNote: (n: Omit<HandoverNote, 'id' | 'createdAt' | 'acknowledgedById' | 'acknowledgedByName' | 'acknowledgedAt'>) => HandoverNote;
  acknowledge: (id: string, userId: string, userName: string) => void;
  deleteNote: (id: string) => void;
}

const now = () => new Date().toISOString();

const seed: HandoverNote[] = [
  {
    id: 'hn-seed-1',
    branchId: 'branch-1',
    branchName: 'Downtown Hub',
    shiftLabel: 'Morning Shift (9:00 AM – 5:00 PM)',
    summary: 'Steady traffic all day, tournament group booked seats 10–15 for tomorrow evening.',
    pendingTasks: 'Restock energy drinks fridge. Replace mouse pad at seat 4.',
    incidents: 'Seat 7 GPU crashed twice — issue logged in Issue Reports.',
    cashNotes: 'Float reconciled, RM 1,240 deposited to safe.',
    priority: 'attention',
    authorId: '5',
    authorName: 'Jamie Lin',
    authorRole: 'manager',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

export const useHandoverStore = create<HandoverState>()(
  persist(
    (set) => ({
      notes: seed,
      createNote: (n) => {
        const created: HandoverNote = {
          ...n,
          id: `hn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: now(),
        };
        set((s) => ({ notes: [created, ...s.notes] }));
        return created;
      },
      acknowledge: (id, userId, userName) => set((s) => ({
        notes: s.notes.map((n) => n.id === id
          ? { ...n, acknowledgedById: userId, acknowledgedByName: userName, acknowledgedAt: now() }
          : n),
      })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    { name: 'gpu-cloud-handover-notes' }
  )
);
