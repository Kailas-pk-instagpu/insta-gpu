import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '../types/auth';

export type IssueCategory = 'gpu' | 'seat' | 'pc' | 'network' | 'peripheral' | 'software' | 'other';
export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface IssueReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  message: string;
  createdAt: string;
}

export interface IssueReport {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  branchId: string;
  branchName: string;
  reportedById: string;
  reportedByName: string;
  reportedByRole: Role;
  createdAt: string;
  updatedAt: string;
  replies: IssueReply[];
}

export const ISSUE_CATEGORIES: { id: IssueCategory; label: string }[] = [
  { id: 'gpu', label: 'GPU Issue' },
  { id: 'seat', label: 'Seat Damage' },
  { id: 'pc', label: 'PC Issue' },
  { id: 'network', label: 'Network Issue' },
  { id: 'peripheral', label: 'Peripheral (Keyboard/Mouse/Headset)' },
  { id: 'software', label: 'Software / OS' },
  { id: 'other', label: 'Other' },
];

export const ISSUE_CATEGORY_LABEL: Record<IssueCategory, string> =
  ISSUE_CATEGORIES.reduce((m, c) => ({ ...m, [c.id]: c.label }), {} as Record<IssueCategory, string>);

export const PRIORITY_META: Record<IssuePriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-primary/10 text-primary border-primary/20' },
  high: { label: 'High', className: 'bg-warning/10 text-warning border-warning/20' },
  critical: { label: 'Critical', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export const STATUS_META: Record<IssueStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-warning/10 text-warning border-warning/20' },
  in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary border-primary/20' },
  resolved: { label: 'Resolved', className: 'bg-success/10 text-success border-success/20' },
};

interface IssueReportState {
  issues: IssueReport[];
  createIssue: (i: Omit<IssueReport, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'replies'>) => IssueReport;
  addReply: (issueId: string, reply: Omit<IssueReply, 'id' | 'createdAt'>) => void;
  updateStatus: (issueId: string, status: IssueStatus) => void;
  deleteIssue: (issueId: string) => void;
}

const now = () => new Date().toISOString();

const seed: IssueReport[] = [
  {
    id: 'iss-seed-1',
    category: 'gpu',
    title: 'Seat 7 GPU crashing under load',
    description: 'RTX 4070 throws driver timeout after ~15 min of gameplay. Tried reboot, persists.',
    priority: 'high',
    status: 'in_progress',
    branchId: 'branch-1',
    branchName: 'Downtown Hub',
    reportedById: '4',
    reportedByName: 'Sam Rivera',
    reportedByRole: 'cafe_owner',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    replies: [
      {
        id: 'rep-1',
        authorId: '1',
        authorName: 'Alex Mercer',
        authorRole: 'super_admin',
        message: 'Acknowledged. Dispatching driver rollback remotely — please keep seat 7 offline for 30 min.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
    ],
  },
  {
    id: 'iss-seed-2',
    category: 'network',
    title: 'Intermittent packet loss on uplink',
    description: 'Customers reporting lag spikes between 7–9pm. Ping to game servers jumps to 250ms.',
    priority: 'medium',
    status: 'open',
    branchId: 'branch-2',
    branchName: 'Uptown Arena',
    reportedById: '4',
    reportedByName: 'Sam Rivera',
    reportedByRole: 'cafe_owner',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    replies: [],
  },
];

export const useIssueReportStore = create<IssueReportState>()(
  persist(
    (set) => ({
      issues: seed,
      createIssue: (i) => {
        const created: IssueReport = {
          ...i,
          id: `iss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          status: 'open',
          createdAt: now(),
          updatedAt: now(),
          replies: [],
        };
        set((s) => ({ issues: [created, ...s.issues] }));
        return created;
      },
      addReply: (issueId, reply) => set((s) => ({
        issues: s.issues.map((iss) =>
          iss.id === issueId
            ? {
                ...iss,
                updatedAt: now(),
                replies: [
                  ...iss.replies,
                  {
                    ...reply,
                    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    createdAt: now(),
                  },
                ],
                status: iss.status === 'open' && reply.authorRole !== 'cafe_owner' ? 'in_progress' : iss.status,
              }
            : iss
        ),
      })),
      updateStatus: (issueId, status) => set((s) => ({
        issues: s.issues.map((iss) => iss.id === issueId ? { ...iss, status, updatedAt: now() } : iss),
      })),
      deleteIssue: (issueId) => set((s) => ({ issues: s.issues.filter((i) => i.id !== issueId) })),
    }),
    { name: 'gpu-cloud-issues' }
  )
);
