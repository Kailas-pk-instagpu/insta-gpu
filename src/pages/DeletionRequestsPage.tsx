import { useState, useMemo } from 'react';
import { useAuthStore, useDeletionRequestStore, DeletionRequest } from '@/shared/lib/store';
import { ROLE_LABELS } from '@/shared/types/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, UserMinus, Check, X, Clock, ShieldAlert, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function DeletionRequestsPage() {
  const { user } = useAuthStore();
  const { requests, approveRequest, rejectRequest } = useDeletionRequestStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actioning, setActioning] = useState<{ req: DeletionRequest; mode: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');

  const filtered = useMemo(() => requests
    .filter(r => r.status === tab)
    .filter(r => {
      const q = search.toLowerCase();
      return !q || r.targetName.toLowerCase().includes(q) || r.targetEmail.toLowerCase().includes(q) || r.requestedByName.toLowerCase().includes(q);
    }),
    [requests, tab, search]);

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  if (!user || user.role !== 'super_admin') return null;

  const confirm = () => {
    if (!actioning) return;
    if (actioning.mode === 'approve') {
      approveRequest(actioning.req.id, note.trim() || undefined);
      toast.success(`Account "${actioning.req.targetName}" deleted`);
    } else {
      rejectRequest(actioning.req.id, note.trim() || undefined);
      toast.info(`Request for "${actioning.req.targetName}" rejected`);
    }
    setActioning(null);
    setNote('');
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Deletion Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and approve account deletion requests submitted by cafe owners</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" /> {counts.pending} Pending
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by user or requester..."
          className="border-0 bg-transparent focus-visible:ring-0"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending <Badge variant="secondary" className="text-[10px]">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Approved <Badge variant="secondary" className="text-[10px]">{counts.approved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejected <Badge variant="secondary" className="text-[10px]">{counts.rejected}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="grid gap-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UserMinus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No {tab} requests</p>
              </div>
            )}
            {filtered.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold gradient-primary text-primary-foreground shrink-0">
                        {req.targetName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{req.targetName}</p>
                          <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[req.targetRole]}</Badge>
                          {req.isSelf && (
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Self-request</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3 w-3" /> {req.targetEmail}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Submitted</p>
                      <p className="text-xs font-medium">{formatDate(req.createdAt)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 border border-border/50 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>Requested by</span>
                      <span className="text-foreground font-medium">{req.requestedByName}</span>
                      <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[req.requestedByRole]}</Badge>
                    </div>
                    {req.reason && (
                      <div className="flex items-start gap-2 text-xs">
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-foreground/80">{req.reason}</p>
                      </div>
                    )}
                  </div>

                  {req.status !== 'pending' && (
                    <div className="text-xs text-muted-foreground">
                      {req.status === 'approved' ? 'Approved' : 'Rejected'} on {req.resolvedAt ? formatDate(req.resolvedAt) : '—'}
                      {req.resolutionNote && <span className="block mt-1 italic">"{req.resolutionNote}"</span>}
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => { setActioning({ req, mode: 'reject' }); setNote(''); }}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => { setActioning({ req, mode: 'approve' }); setNote(''); }}
                      >
                        <Check className="h-4 w-4" /> Approve & Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!actioning} onOpenChange={(o) => { if (!o) { setActioning(null); setNote(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actioning?.mode === 'approve' ? 'Approve & Delete Account' : 'Reject Deletion Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actioning?.mode === 'approve' ? (
                <>This will permanently delete <strong>{actioning?.req.targetName}</strong>'s account. This action cannot be undone.</>
              ) : (
                <>The request to delete <strong>{actioning?.req.targetName}</strong>'s account will be rejected.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={actioning?.mode === 'approve' ? 'Reason for approval...' : 'Reason for rejection...'}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm}
              className={actioning?.mode === 'approve' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {actioning?.mode === 'approve' ? 'Approve & Delete' : 'Reject Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
