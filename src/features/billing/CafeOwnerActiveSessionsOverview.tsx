import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity, Building2, Monitor, Clock, User as UserIcon, Wallet,
  ChevronRight, Receipt, Search, AlertTriangle,
} from 'lucide-react';
import { useAuthStore, useBranchStore, useSeatStore } from '@/shared/lib/store';
import { MOCK_CUSTOMER_WALLETS } from '@/shared/lib/mock-data';
import EmptyState from '@/shared/ui/molecules/EmptyState';

function formatRelative(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

// Stable pseudo-random session start (2-180 min ago) seeded by customer id
function startTimeFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const minutesAgo = (hash % 180) + 2;
  return new Date(Date.now() - minutesAgo * 60_000);
}

type SortKey = 'recent' | 'duration' | 'usage' | 'name';

export default function CafeOwnerActiveSessionsOverview() {
  const { user } = useAuthStore();
  const branches = useBranchStore((s) => s.branches);
  const seats = useSeatStore((s) => s.seats);
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';

  const ownerBranches = useMemo(() => {
    if (!user) return [];
    if (user.role === 'manager') return branches.filter((b) => b.managerId === user.id);
    return branches.filter((b) => b.cafeOwnerId === user.id);
  }, [branches, user]);

  const allSessions = useMemo(() => {
    return ownerBranches.flatMap((branch) => {
      const branchSeats = seats.filter((s) => s.branchId === branch.id);
      const customers = MOCK_CUSTOMER_WALLETS.filter((c) => c.branchId === branch.id);
      return customers.map((c, idx) => {
        const seat = branchSeats[idx % Math.max(branchSeats.length, 1)];
        const start = startTimeFor(c.id);
        const durationMin = Math.max(1, Math.floor((Date.now() - start.getTime()) / 60_000));
        const usage = Math.min(c.lockedAmount, +(durationMin * branch.billing.costPerMinute).toFixed(2));
        const usagePct = Math.min(100, (usage / c.lockedAmount) * 100);
        return {
          id: c.id,
          customer: c,
          branch,
          seat,
          start,
          durationMin,
          usage,
          usagePct,
        };
      });
    });
  }, [ownerBranches, seats]);

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [sort, setSort] = useState<SortKey>('recent');

  const filtered = useMemo(() => {
    let list = allSessions;
    if (branchFilter !== 'all') list = list.filter((s) => s.branch.id === branchFilter);
    if (statusFilter !== 'all') {
      list = list.filter((s) =>
        statusFilter === 'critical' ? s.usagePct >= 80
        : statusFilter === 'warning' ? s.usagePct >= 50 && s.usagePct < 80
        : s.usagePct < 50
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.customer.name.toLowerCase().includes(q) ||
          s.customer.phone.toLowerCase().includes(q) ||
          s.branch.name.toLowerCase().includes(q) ||
          String(s.seat?.number ?? '').includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'duration': return b.durationMin - a.durationMin;
        case 'usage': return b.usagePct - a.usagePct;
        case 'name': return a.customer.name.localeCompare(b.customer.name);
        case 'recent':
        default: return b.start.getTime() - a.start.getTime();
      }
    });
    return sorted;
  }, [allSessions, branchFilter, statusFilter, search, sort]);

  const totalActive = allSessions.length;
  const totalUsage = allSessions.reduce((a, s) => a + s.usage, 0);
  const critical = allSessions.filter((s) => s.usagePct >= 80).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Active Billing Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isManager
              ? 'Live view of every customer currently using a seat at your branch.'
              : 'Live overview of all running sessions across your branches.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/billing/settlements')}>
          <Receipt className="h-4 w-4" /> View Settlements
        </Button>
      </div>

      {/* KPI strip */}
      <div className={`grid grid-cols-2 ${isManager ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-3`}>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Activity className="h-3.5 w-3.5" /> Active
            </div>
            <p className="font-mono text-2xl font-bold">{totalActive}</p>
          </CardContent>
        </Card>
        {!isManager && (
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
                <Building2 className="h-3.5 w-3.5" /> Branches
              </div>
              <p className="font-mono text-2xl font-bold">{ownerBranches.length}</p>
            </CardContent>
          </Card>
        )}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Wallet className="h-3.5 w-3.5" /> Live Usage
            </div>
            <p className="font-mono text-2xl font-bold">RM {totalUsage.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Near Limit
            </div>
            <p className="font-mono text-2xl font-bold">{critical}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar */}
      <Card className="border-border/60">
        <CardContent className="p-3 flex flex-col lg:flex-row gap-2 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customer, phone, branch, or seat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {!isManager && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {ownerBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="normal">Normal (&lt;50%)</SelectItem>
                <SelectItem value="warning">Warning (50-80%)</SelectItem>
                <SelectItem value="critical">Near limit (80%+)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="duration">Longest duration</SelectItem>
                <SelectItem value="usage">Highest usage</SelectItem>
                <SelectItem value="name">Customer name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Result summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of {totalActive} sessions
        </span>
        {(search || branchFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setBranchFilter('all'); setStatusFilter('all'); }}
            className="text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Sessions grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No active sessions"
          description={totalActive === 0 ? "There are no live sessions right now." : "No sessions match your filters."}
        />
      ) : (
        <div
          className={
            isManager
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
          }
        >
          {filtered.map((s) => {
            const tone =
              s.usagePct >= 80 ? 'destructive'
              : s.usagePct >= 50 ? 'warning'
              : 'success';
            const statusLabel =
              tone === 'destructive' ? 'Near limit'
              : tone === 'warning' ? 'Warning'
              : 'Normal';
            const statusClasses =
              tone === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/30'
              : tone === 'warning' ? 'bg-warning/10 text-warning border-warning/30'
              : 'bg-success/10 text-success border-success/30';

            if (isManager) {
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    navigate(`/billing/session?branchId=${s.branch.id}&customerId=${s.customer.id}`)
                  }
                  className="group text-left rounded-xl border border-border/60 bg-card p-3 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_25px_hsl(var(--primary)/0.12)] hover:-translate-y-0.5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <UserIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate leading-tight">{s.customer.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.customer.phone}</p>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/30 font-medium text-[10px] px-1.5 py-0 h-5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse" />
                      Live
                    </Badge>
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                    <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                      <Monitor className="h-3 w-3 shrink-0" />
                      <span className="truncate">Seat #{s.seat?.number ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground min-w-0 justify-end">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatRelative(s.start)}</span>
                    </div>
                  </div>

                  {/* Usage + status */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold">
                        RM {s.usage.toFixed(2)}
                        <span className="text-muted-foreground"> / {s.customer.lockedAmount.toFixed(0)}</span>
                      </span>
                      <Badge variant="outline" className={`font-medium text-[9px] px-1.5 py-0 h-4 ${statusClasses}`}>
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          tone === 'destructive' ? 'bg-destructive'
                          : tone === 'warning' ? 'bg-warning'
                          : 'bg-success'
                        }`}
                        style={{ width: `${s.usagePct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.round(s.usagePct)}% used • tap to manage
                    </p>
                  </div>
                </button>
              );
            }


            return (
              <button
                key={s.id}
                onClick={() =>
                  navigate(`/billing/session?branchId=${s.branch.id}&customerId=${s.customer.id}`)
                }
                className="group text-left rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_25px_hsl(var(--primary)/0.12)] hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{s.customer.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {s.branch.name}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/30 font-medium text-[10px] px-1.5 py-0 h-5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse" />
                    Live
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                    <Monitor className="h-3 w-3 shrink-0" />
                    <span className="truncate">Seat #{s.seat?.number ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground min-w-0 justify-end">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{formatRelative(s.start)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-mono font-semibold">
                      RM {s.usage.toFixed(2)}
                      <span className="text-muted-foreground"> / {s.customer.lockedAmount.toFixed(0)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        tone === 'destructive' ? 'bg-destructive'
                        : tone === 'warning' ? 'bg-warning'
                        : 'bg-success'
                      }`}
                      style={{ width: `${s.usagePct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 mt-2 text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ChevronRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
