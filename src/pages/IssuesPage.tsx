import { useState, useMemo } from 'react';
import { useAuthStore, useBranchStore } from '@/shared/lib/store';
import {
  useIssueReportStore,
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABEL,
  PRIORITY_META,
  STATUS_META,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  IssueReport,
} from '@/shared/lib/issueReportStore';
import { ROLE_LABELS } from '@/shared/types/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertTriangle, Plus, Search, MessageSquare, Send, Building2,
  Wrench, Cpu, Wifi, Monitor, Keyboard, AppWindow, HelpCircle, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORY_ICON: Record<IssueCategory, React.ComponentType<{ className?: string }>> = {
  gpu: Cpu,
  seat: Wrench,
  pc: Monitor,
  network: Wifi,
  peripheral: Keyboard,
  software: AppWindow,
  other: HelpCircle,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function IssuesPage() {
  const { user } = useAuthStore();
  const { branches } = useBranchStore();
  const { issues, createIssue, addReply, updateStatus, deleteIssue } = useIssueReportStore();

  const [tab, setTab] = useState<'all' | IssueStatus>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  if (!user) return null;

  const isOwner = user.role === 'cafe_owner';
  const isStaff = user.role === 'super_admin' || user.role === 'admin';

  // Cafe owner: only own branches' issues. Staff: see all.
  const ownerBranchIds = useMemo(
    () => branches.filter((b) => b.cafeOwnerId === user.id).map((b) => b.id),
    [branches, user.id]
  );

  const visibleIssues = useMemo(() => {
    let list = issues;
    if (isOwner) list = list.filter((i) => ownerBranchIds.includes(i.branchId) || i.reportedById === user.id);
    if (tab !== 'all') list = list.filter((i) => i.status === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.branchName.toLowerCase().includes(q) ||
          i.reportedByName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [issues, isOwner, ownerBranchIds, user.id, tab, search]);

  const counts = useMemo(() => {
    const base = isOwner ? issues.filter((i) => ownerBranchIds.includes(i.branchId) || i.reportedById === user.id) : issues;
    return {
      all: base.length,
      open: base.filter((i) => i.status === 'open').length,
      in_progress: base.filter((i) => i.status === 'in_progress').length,
      resolved: base.filter((i) => i.status === 'resolved').length,
    };
  }, [issues, isOwner, ownerBranchIds, user.id]);

  const openIssue = openIssueId ? issues.find((i) => i.id === openIssueId) || null : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issue Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isOwner
              ? 'Report hardware, network, or software problems at your branches.'
              : 'Track and respond to issues reported by cafe owners across all branches.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <AlertTriangle className="h-3 w-3 mr-1" /> {counts.open} Open
          </Badge>
          {isOwner && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Report Issue
                </Button>
              </DialogTrigger>
              <CreateIssueDialog
                onClose={() => setCreateOpen(false)}
                ownerBranches={branches.filter((b) => b.cafeOwnerId === user.id)}
                onSubmit={(values) => {
                  const branch = branches.find((b) => b.id === values.branchId);
                  if (!branch) return;
                  createIssue({
                    ...values,
                    branchName: branch.name,
                    reportedById: user.id,
                    reportedByName: user.name || user.email,
                    reportedByRole: user.role,
                  });
                  toast.success('Issue reported');
                  setCreateOpen(false);
                }}
              />
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search issues by title, branch or reporter..."
          className="border-0 bg-transparent focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All <Badge variant="secondary" className="text-[10px]">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-2">
            Open <Badge variant="secondary" className="text-[10px]">{counts.open}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-2">
            In Progress <Badge variant="secondary" className="text-[10px]">{counts.in_progress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            Resolved <Badge variant="secondary" className="text-[10px]">{counts.resolved}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="grid gap-3">
            {visibleIssues.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No issues to show</p>
              </div>
            )}
            {visibleIssues.map((iss) => {
              const Icon = CATEGORY_ICON[iss.category];
              return (
                <Card
                  key={iss.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => { setOpenIssueId(iss.id); setReplyText(''); }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{iss.title}</p>
                            <Badge variant="outline" className={cn('text-[10px]', STATUS_META[iss.status].className)}>
                              {STATUS_META[iss.status].label}
                            </Badge>
                            <Badge variant="outline" className={cn('text-[10px]', PRIORITY_META[iss.priority].className)}>
                              {PRIORITY_META[iss.priority].label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {ISSUE_CATEGORY_LABEL[iss.category]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{iss.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2 flex-wrap">
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{iss.branchName}</span>
                            <span>By {iss.reportedByName} · {ROLE_LABELS[iss.reportedByRole]}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{iss.replies.length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">Updated</p>
                        <p className="text-xs font-medium">{formatDate(iss.updatedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!openIssue} onOpenChange={(o) => { if (!o) { setOpenIssueId(null); setReplyText(''); } }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {openIssue && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6">{openIssue.title}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 flex-wrap pt-1">
                  <Badge variant="outline" className={cn('text-[10px]', STATUS_META[openIssue.status].className)}>
                    {STATUS_META[openIssue.status].label}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[10px]', PRIORITY_META[openIssue.priority].className)}>
                    {PRIORITY_META[openIssue.priority].label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{ISSUE_CATEGORY_LABEL[openIssue.category]}</Badge>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-muted/40 border border-border/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{openIssue.branchName}</span>
                    <span>{formatDate(openIssue.createdAt)}</span>
                  </div>
                  <p className="text-sm">{openIssue.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Reported by <span className="text-foreground font-medium">{openIssue.reportedByName}</span> · {ROLE_LABELS[openIssue.reportedByRole]}
                  </p>
                </div>

                {isStaff && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Select
                      value={openIssue.status}
                      onValueChange={(v) => { updateStatus(openIssue.id, v as IssueStatus); toast.success('Status updated'); }}
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    {user.role === 'super_admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto text-destructive hover:text-destructive"
                        onClick={() => { deleteIssue(openIssue.id); setOpenIssueId(null); toast.info('Issue deleted'); }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Conversation ({openIssue.replies.length})
                  </p>
                  {openIssue.replies.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No replies yet.</p>
                  )}
                  {openIssue.replies.map((rep) => {
                    const mine = rep.authorId === user.id;
                    return (
                      <div key={rep.id} className={cn('flex flex-col gap-1', mine && 'items-end')}>
                        <div
                          className={cn(
                            'rounded-2xl px-3 py-2 max-w-[85%] text-sm',
                            mine
                              ? 'bg-primary text-primary-foreground'
                              : rep.authorRole === 'cafe_owner'
                                ? 'bg-muted'
                                : 'bg-accent text-accent-foreground border border-border'
                          )}
                        >
                          {rep.message}
                        </div>
                        <p className="text-[10px] text-muted-foreground px-1">
                          {rep.authorName} · {ROLE_LABELS[rep.authorRole]} · {formatDate(rep.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isStaff ? 'Reply to cafe owner...' : 'Add a follow-up...'}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={!replyText.trim()}
                      onClick={() => {
                        addReply(openIssue.id, {
                          authorId: user.id,
                          authorName: user.name || user.email,
                          authorRole: user.role,
                          message: replyText.trim(),
                        });
                        setReplyText('');
                        toast.success('Reply sent');
                      }}
                    >
                      <Send className="h-4 w-4" /> Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CreateIssueDialog({
  onClose,
  onSubmit,
  ownerBranches,
}: {
  onClose: () => void;
  onSubmit: (v: { category: IssueCategory; title: string; description: string; priority: IssuePriority; branchId: string }) => void;
  ownerBranches: { id: string; name: string }[];
}) {
  const [category, setCategory] = useState<IssueCategory>('gpu');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [branchId, setBranchId] = useState(ownerBranches[0]?.id ?? '');

  const valid = title.trim().length >= 4 && description.trim().length >= 10 && branchId;

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Report an Issue</DialogTitle>
        <DialogDescription>
          Describe the problem so admins can review and respond quickly.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Branch</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {ownerBranches.length === 0 ? (
                  <SelectItem value="none" disabled>No branches assigned</SelectItem>
                ) : ownerBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ISSUE_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary (e.g. Seat 5 PC won't boot)"
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's wrong, when it started, troubleshooting tried..."
            rows={5}
            maxLength={2000}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!valid}
          onClick={() => onSubmit({ category, title: title.trim(), description: description.trim(), priority, branchId })}
        >
          Submit Report
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
