import { useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Hourglass,
  Lock,
  PlugZap,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SyncStatus = 'synced' | 'pending' | 'failed';
type TxType = 'Lock' | 'Deduct' | 'Release';

interface SyncTx {
  id: string;
  type: TxType;
  amount: number;
  status: SyncStatus;
  timestamp: Date;
}

interface ErrorLog {
  id: string;
  time: Date;
  message: string;
  retry: 'pending' | 'retried' | 'failed' | 'resolved';
}

const seedTransactions = (): SyncTx[] => {
  const now = Date.now();
  const types: TxType[] = ['Lock', 'Deduct', 'Release'];
  const statuses: SyncStatus[] = ['synced', 'synced', 'synced', 'pending', 'failed', 'synced'];
  return Array.from({ length: 14 }).map((_, i) => ({
    id: `E2L-TX-${(98231 + i).toString(36).toUpperCase()}`,
    type: types[i % types.length],
    amount: Math.round((Math.random() * 80 + 5) * 100) / 100,
    status: statuses[i % statuses.length],
    timestamp: new Date(now - i * 1000 * 60 * 7),
  }));
};

const seedErrors = (): ErrorLog[] => {
  const now = Date.now();
  return [
    { id: 'err-1', time: new Date(now - 1000 * 60 * 4), message: 'Timeout while syncing TX-98245 (deduct).', retry: 'pending' },
    { id: 'err-2', time: new Date(now - 1000 * 60 * 22), message: 'Signature mismatch on lock confirmation.', retry: 'failed' },
    { id: 'err-3', time: new Date(now - 1000 * 60 * 58), message: 'Rate limit (429) from E2Link gateway.', retry: 'retried' },
    { id: 'err-4', time: new Date(now - 1000 * 60 * 90), message: 'Wallet snapshot drift resolved on retry.', retry: 'resolved' },
  ];
};

const formatTime = (d: Date) => d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
const formatAmount = (n: number) => `RM ${n.toFixed(2)}`;

const statusBadge = (s: SyncStatus) => {
  if (s === 'synced')
    return (
      <Badge variant="outline" className="gap-1 border-success/30 text-success bg-success/10">
        <CheckCircle2 className="h-3 w-3" /> Synced
      </Badge>
    );
  if (s === 'pending')
    return (
      <Badge variant="outline" className="gap-1 border-warning/30 text-warning bg-warning/10">
        <Hourglass className="h-3 w-3" /> Pending
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive bg-destructive/10">
      <CircleX className="h-3 w-3" /> Failed
    </Badge>
  );
};

const typeBadge = (t: TxType) => {
  const map: Record<TxType, string> = {
    Lock: 'border-primary/30 text-primary bg-primary/10',
    Deduct: 'border-destructive/30 text-destructive bg-destructive/10',
    Release: 'border-success/30 text-success bg-success/10',
  };
  const Icon = t === 'Lock' ? Lock : t === 'Deduct' ? Activity : RotateCcw;
  return (
    <Badge variant="outline" className={cn('gap-1', map[t])}>
      <Icon className="h-3 w-3" /> {t}
    </Badge>
  );
};

const retryBadge = (r: ErrorLog['retry']) => {
  const map: Record<ErrorLog['retry'], { label: string; cls: string }> = {
    pending: { label: 'Pending retry', cls: 'border-warning/30 text-warning bg-warning/10' },
    retried: { label: 'Retried', cls: 'border-primary/30 text-primary bg-primary/10' },
    failed: { label: 'Failed', cls: 'border-destructive/30 text-destructive bg-destructive/10' },
    resolved: { label: 'Resolved', cls: 'border-success/30 text-success bg-success/10' },
  };
  const m = map[r];
  return (
    <Badge variant="outline" className={cn('text-[11px]', m.cls)}>
      {m.label}
    </Badge>
  );
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accountId: string;
  status: 'connected' | 'disconnected' | 'sync_issue';
}

export default function E2LinkDetailsDrawer({ open, onOpenChange, accountId, status }: Props) {
  const [transactions, setTransactions] = useState<SyncTx[]>(() => seedTransactions());
  const [errors, setErrors] = useState<ErrorLog[]>(() => seedErrors());
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const counts = useMemo(() => {
    return {
      synced: transactions.filter((t) => t.status === 'synced').length,
      pending: transactions.filter((t) => t.status === 'pending').length,
      failed: transactions.filter((t) => t.status === 'failed').length,
    };
  }, [transactions]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setTransactions(seedTransactions());
      setErrors(seedErrors());
      toast.success('E2Link data refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryFailed = async () => {
    if (retrying) return;
    const failedCount = transactions.filter((t) => t.status === 'failed').length;
    if (failedCount === 0) {
      toast.info('No failed transactions to retry');
      return;
    }
    setRetrying(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setTransactions((prev) =>
        prev.map((t) => (t.status === 'failed' ? { ...t, status: 'synced' as SyncStatus } : t)),
      );
      setErrors((prev) =>
        prev.map((e) => (e.retry === 'failed' || e.retry === 'pending' ? { ...e, retry: 'resolved' as const } : e)),
      );
      toast.success(`Retried ${failedCount} failed transaction${failedCount > 1 ? 's' : ''}`);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <PlugZap className="h-5 w-5 text-primary" />
                E2Link Details
              </SheetTitle>
              <SheetDescription className="mt-1">
                Account <span className="font-mono">{accountId}</span> · live sync activity
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 capitalize',
                status === 'connected' && 'border-success/30 text-success bg-success/10',
                status === 'sync_issue' && 'border-warning/30 text-warning bg-warning/10',
                status === 'disconnected' && 'border-destructive/30 text-destructive bg-destructive/10',
              )}
            >
              {status === 'connected' && <CheckCircle2 className="h-3.5 w-3.5" />}
              {status === 'sync_issue' && <AlertTriangle className="h-3.5 w-3.5" />}
              {status === 'disconnected' && <CircleX className="h-3.5 w-3.5" />}
              {status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              {refreshing ? 'Refreshing...' : 'Refresh data'}
            </Button>
            <Button
              size="sm"
              onClick={handleRetryFailed}
              disabled={retrying || counts.failed === 0}
              className="gap-2"
            >
              <RotateCcw className={cn('h-4 w-4', retrying && 'animate-spin')} />
              {retrying ? 'Retrying...' : `Retry Failed Sync${counts.failed > 0 ? ` (${counts.failed})` : ''}`}
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Summary chips */}
            <div className="grid grid-cols-3 gap-3">
              <SummaryChip icon={CheckCircle2} label="Synced" value={counts.synced} tone="text-success" bg="bg-success/10" />
              <SummaryChip icon={Hourglass} label="Pending" value={counts.pending} tone="text-warning" bg="bg-warning/10" />
              <SummaryChip icon={CircleX} label="Failed" value={counts.failed} tone="text-destructive" bg="bg-destructive/10" />
            </div>

            {/* Transactions */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Transaction Sync</h3>
                  <p className="text-xs text-muted-foreground">Recent wallet operations relayed to E2Link.</p>
                </div>
                <span className="text-xs text-muted-foreground">{transactions.length} entries</span>
              </div>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider">Transaction ID</TableHead>
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider">Type</TableHead>
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider text-right">Amount</TableHead>
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider">Status</TableHead>
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="py-2.5 font-mono text-xs">{tx.id}</TableCell>
                        <TableCell className="py-2.5">{typeBadge(tx.type)}</TableCell>
                        <TableCell className="py-2.5 text-right font-medium">{formatAmount(tx.amount)}</TableCell>
                        <TableCell className="py-2.5">{statusBadge(tx.status)}</TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(tx.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <Separator />

            {/* Error logs */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Error Logs
                  </h3>
                  <p className="text-xs text-muted-foreground">Recent sync failures and their retry status.</p>
                </div>
                <span className="text-xs text-muted-foreground">{errors.length} entries</span>
              </div>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider w-[160px]">Time</TableHead>
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider">Error message</TableHead>
                      <TableHead className="h-9 text-[11px] uppercase tracking-wider w-[140px]">Retry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                          No errors recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      errors.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(e.time)}
                          </TableCell>
                          <TableCell className="py-2.5 text-sm">{e.message}</TableCell>
                          <TableCell className="py-2.5">{retryBadge(e.retry)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SummaryChip({
  icon: Icon,
  label,
  value,
  tone,
  bg,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  tone: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className={cn('p-2 rounded-md', bg, tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
