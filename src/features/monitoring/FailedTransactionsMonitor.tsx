import { useEffect, useMemo, useState } from 'react';
import TablePagination from '@/shared/ui/molecules/TablePagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { MOCK_BRANCHES } from '@/shared/lib/mock-data';
import { AlertTriangle, RotateCcw, Search, Ban, CircleX, Wallet, Building2, Eye, Copy, ShieldAlert, FilterX, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import TableSkeletonRows from '@/shared/ui/molecules/TableSkeletonRows';
import EmptyState from '@/shared/ui/molecules/EmptyState';
import { useDeferredLoading } from '@/shared/lib/useDeferredLoading';
import LastUpdated from '@/shared/ui/atoms/LastUpdated';

type FailureReason = 'gateway_timeout' | 'insufficient_balance' | 'signature_mismatch' | 'rate_limited' | 'wallet_locked' | 'network_error';
type TxType = 'Lock' | 'Deduct' | 'Release' | 'Topup';
type RetryState = 'pending' | 'retried' | 'failed' | 'resolved';

interface FailedTx {
  id: string;
  type: TxType;
  amount: number;
  player: string;
  branchId: string;
  branchName: string;
  reason: FailureReason;
  message: string;
  attempts: number;
  occurredAt: Date;
  retry: RetryState;
  http?: number;
}

const REASON_LABEL: Record<FailureReason, string> = {
  gateway_timeout: 'Gateway timeout',
  insufficient_balance: 'Insufficient balance',
  signature_mismatch: 'Signature mismatch',
  rate_limited: 'Rate limited',
  wallet_locked: 'Wallet locked',
  network_error: 'Network error',
};

const REASON_TONE: Record<FailureReason, string> = {
  gateway_timeout: 'border-warning/30 text-warning bg-warning/10',
  insufficient_balance: 'border-destructive/30 text-destructive bg-destructive/10',
  signature_mismatch: 'border-destructive/30 text-destructive bg-destructive/10',
  rate_limited: 'border-warning/30 text-warning bg-warning/10',
  wallet_locked: 'border-primary/30 text-primary bg-primary/10',
  network_error: 'border-warning/30 text-warning bg-warning/10',
};

const RETRY_TONE: Record<RetryState, string> = {
  pending: 'border-warning/30 text-warning bg-warning/10',
  retried: 'border-primary/30 text-primary bg-primary/10',
  failed: 'border-destructive/30 text-destructive bg-destructive/10',
  resolved: 'border-success/30 text-success bg-success/10',
};

const seedFailed = (): FailedTx[] => {
  const types: TxType[] = ['Lock', 'Deduct', 'Release', 'Topup'];
  const reasons: FailureReason[] = ['gateway_timeout', 'insufficient_balance', 'signature_mismatch', 'rate_limited', 'wallet_locked', 'network_error'];
  const players = ['Aiden Cole', 'Maya Lin', 'Derek Shaw', 'Priya Nair', 'Leo Tanaka', 'Sara Ahmed', 'Omar Hassan', 'Nina Park'];
  const retries: RetryState[] = ['pending', 'failed', 'pending', 'retried', 'failed', 'pending'];
  const now = Date.now();
  return Array.from({ length: 18 }).map((_, i) => {
    const reason = reasons[i % reasons.length];
    const branch = MOCK_BRANCHES[i % MOCK_BRANCHES.length];
    const type = types[i % types.length];
    const messages: Record<FailureReason, string> = {
      gateway_timeout: 'E2Link gateway did not respond within 8s.',
      insufficient_balance: 'Wallet balance below required lock amount.',
      signature_mismatch: 'HMAC signature mismatch on confirmation payload.',
      rate_limited: 'Received HTTP 429 from billing gateway.',
      wallet_locked: 'Wallet is locked by another concurrent session.',
      network_error: 'TCP reset between edge node and billing service.',
    };
    return {
      id: `TX-${(72100 + i).toString(36).toUpperCase()}`,
      type,
      amount: Math.round((Math.random() * 90 + 5) * 100) / 100,
      player: players[i % players.length],
      branchId: branch.id,
      branchName: branch.name,
      reason,
      message: messages[reason],
      attempts: (i % 3) + 1,
      occurredAt: new Date(now - i * 1000 * 60 * 11),
      retry: retries[i % retries.length],
      http: reason === 'rate_limited' ? 429 : reason === 'gateway_timeout' ? 504 : reason === 'network_error' ? 502 : undefined,
    };
  });
};

const fmt = (d: Date) => d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });

export default function FailedTransactionsMonitor() {
  const [items, setItems] = useState<FailedTx[]>(() => seedFailed());
  const [query, setQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [retryFilter, setRetryFilter] = useState<string>('all');
  const [selected, setSelected] = useState<FailedTx | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  // bump lastUpdated whenever the underlying items change (retry, retryAll, ignore)
  useEffect(() => {
    setLastUpdated(new Date());
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (reasonFilter !== 'all' && t.reason !== reasonFilter) return false;
      if (branchFilter !== 'all' && t.branchId !== branchFilter) return false;
      if (retryFilter !== 'all' && t.retry !== retryFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!t.id.toLowerCase().includes(q) && !t.player.toLowerCase().includes(q) && !t.branchName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, query, reasonFilter, branchFilter, retryFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(1);
  }, [filtered.length, page, pageSize]);

  const filtersActive =
    query.trim() !== '' || reasonFilter !== 'all' || branchFilter !== 'all' || retryFilter !== 'all';
  const isLoading = useDeferredLoading([query, reasonFilter, branchFilter, retryFilter, page, pageSize]);

  const clearFilters = () => {
    setQuery('');
    setReasonFilter('all');
    setBranchFilter('all');
    setRetryFilter('all');
  };

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((t) => t.retry === 'pending').length;
    const failed = items.filter((t) => t.retry === 'failed').length;
    const lostValue = items.filter((t) => t.retry !== 'resolved').reduce((a, b) => a + b.amount, 0);
    const branches = new Set(items.filter((t) => t.retry !== 'resolved').map((t) => t.branchId)).size;
    return { total, pending, failed, lostValue, branches };
  }, [items]);

  const retryOne = async (id: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, retry: 'retried', attempts: t.attempts + 1 } : t)));
    await new Promise((r) => setTimeout(r, 800));
    setItems((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const ok = Math.random() > 0.3;
        return { ...t, retry: ok ? 'resolved' : 'failed' };
      }),
    );
    toast.success(`Retry triggered for ${id}`);
  };

  const retryAll = async () => {
    setRetryingAll(true);
    const ids = items.filter((t) => t.retry === 'pending' || t.retry === 'failed').map((t) => t.id);
    if (ids.length === 0) {
      toast.info('Nothing to retry');
      setRetryingAll(false);
      return;
    }
    setItems((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, retry: 'retried', attempts: t.attempts + 1 } : t)));
    await new Promise((r) => setTimeout(r, 1100));
    setItems((prev) =>
      prev.map((t) => {
        if (!ids.includes(t.id)) return t;
        const ok = Math.random() > 0.25;
        return { ...t, retry: ok ? 'resolved' : 'failed' };
      }),
    );
    toast.success(`Retried ${ids.length} transactions`);
    setRetryingAll(false);
  };

  const ignore = (id: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, retry: 'resolved' } : t)));
    toast.info(`${id} marked as resolved`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI icon={CircleX} label="Total failures" value={stats.total.toString()} tone="text-destructive" bg="bg-destructive/10" />
        <KPI icon={ShieldAlert} label="Pending retry" value={stats.pending.toString()} tone="text-warning" bg="bg-warning/10" />
        <KPI icon={AlertTriangle} label="Hard failed" value={stats.failed.toString()} tone="text-destructive" bg="bg-destructive/10" />
        <KPI icon={Wallet} label="Value at risk" value={`RM ${stats.lostValue.toFixed(2)}`} tone="text-primary" bg="bg-primary/10" />
        <KPI icon={Building2} label="Branches affected" value={`${stats.branches}/${MOCK_BRANCHES.length}`} tone="text-info" bg="bg-info/10" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Failed Transactions
              </CardTitle>
              <CardDescription>Review, inspect, and retry failed billing operations across the network.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <LastUpdated timestamp={lastUpdated} />
              <Button size="sm" onClick={retryAll} disabled={retryingAll} className="gap-2">
                <RotateCcw className={cn('h-3.5 w-3.5', retryingAll && 'animate-spin')} />
                {retryingAll ? 'Retrying...' : 'Retry all eligible'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search TX ID, player, or branch..."
                className="pl-8 h-9"
              />
            </div>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All reasons</SelectItem>
                {Object.entries(REASON_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {MOCK_BRANCHES.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={retryFilter} onValueChange={setRetryFilter}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All retry</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="retried">Retried</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Transaction</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Type</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Player / Branch</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Reason</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Attempts</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Time</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Retry</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows rows={Math.min(pageSize, 8)} columns={9} />
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        icon={filtersActive ? FilterX : ShieldCheck}
                        tone={filtersActive ? 'warning' : 'success'}
                        title={filtersActive ? 'No failures match your filters' : 'All clear — no failed transactions'}
                        description={
                          filtersActive
                            ? 'Adjust the reason, branch, or retry status, or clear the search to see more results.'
                            : 'Billing is healthy across the network. Any future failures will surface here for review.'
                        }
                        actionLabel={filtersActive ? 'Clear filters' : undefined}
                        onAction={filtersActive ? clearFilters : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
                      <TableCell className="py-2.5 font-mono text-xs">{t.id}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[11px]">{t.type}</Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums font-medium">RM {t.amount.toFixed(2)}</TableCell>
                      <TableCell className="py-2.5 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{t.player}</span>
                          <span className="text-[11px] text-muted-foreground">{t.branchName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={cn('text-[11px]', REASON_TONE[t.reason])}>
                          {REASON_LABEL[t.reason]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-sm tabular-nums">{t.attempts}</TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmt(t.occurredAt)}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={cn('text-[11px] capitalize', RETRY_TONE[t.retry])}>
                          {t.retry}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelected(t)} title="Inspect">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => retryOne(t.id)}
                            disabled={t.retry === 'resolved' || t.retry === 'retried'}
                            title="Retry"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => ignore(t.id)}
                            disabled={t.retry === 'resolved'}
                            title="Mark resolved"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            itemLabel="transactions"
          />
        </CardContent>
      </Card>

      {/* Inspector */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Failure detail
                </SheetTitle>
                <SheetDescription>
                  <span className="font-mono">{selected.id}</span> · {selected.type} · RM {selected.amount.toFixed(2)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 text-sm">
                <Row label="Player" value={selected.player} />
                <Row label="Branch" value={selected.branchName} />
                <Row label="Occurred" value={fmt(selected.occurredAt)} />
                <Row label="Attempts" value={selected.attempts.toString()} />
                <Row
                  label="Reason"
                  value={
                    <Badge variant="outline" className={cn('text-[11px]', REASON_TONE[selected.reason])}>
                      {REASON_LABEL[selected.reason]}
                    </Badge>
                  }
                />
                {selected.http && <Row label="HTTP" value={<span className="font-mono">{selected.http}</span>} />}
                <Row
                  label="Retry"
                  value={
                    <Badge variant="outline" className={cn('text-[11px] capitalize', RETRY_TONE[selected.retry])}>
                      {selected.retry}
                    </Badge>
                  }
                />

                <Separator />

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Error message</p>
                  <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">{selected.message}</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => { retryOne(selected.id); setSelected(null); }}
                    disabled={selected.retry === 'resolved' || selected.retry === 'retried'}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retry now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => { navigator.clipboard.writeText(selected.id); toast.success('Copied'); }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy ID
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KPI({ icon: Icon, label, value, tone, bg }: { icon: typeof AlertTriangle; label: string; value: string; tone: string; bg: string }) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className={cn('p-2 rounded-md', bg, tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="text-base font-semibold tabular-nums truncate">{value}</p>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
