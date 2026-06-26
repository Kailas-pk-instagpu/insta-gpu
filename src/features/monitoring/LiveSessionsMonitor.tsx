import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_BRANCHES, MOCK_SEATS } from '@/shared/lib/mock-data';
import { Activity, Search, RefreshCw, Cpu, Wallet, Users, Building2, Zap, Eye, FilterX, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import LiveSessionInspectorDrawer from './LiveSessionInspectorDrawer';
import TablePagination from '@/shared/ui/molecules/TablePagination';
import TableSkeletonRows from '@/shared/ui/molecules/TableSkeletonRows';
import EmptyState from '@/shared/ui/molecules/EmptyState';
import { useDeferredLoading } from '@/shared/lib/useDeferredLoading';
import LastUpdated from '@/shared/ui/atoms/LastUpdated';

interface LiveSession {
  id: string;
  player: string;
  branchId: string;
  branchName: string;
  cafeId: string;
  seatNumber: number;
  gpu: string;
  startedAt: Date;
  durationMin: number;
  ratePerMin: number;
  spent: number;
  walletBalance: number;
  gpuLoad: number;
  health: 'healthy' | 'degraded' | 'critical';
}

const HEALTH_STYLES: Record<LiveSession['health'], string> = {
  healthy: 'bg-success/10 text-success border-success/30',
  degraded: 'bg-warning/10 text-warning border-warning/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

function buildSessions(): LiveSession[] {
  const occupied = MOCK_SEATS.filter((s) => s.status === 'occupied');
  return occupied.map((s, i) => {
    const branch = MOCK_BRANCHES.find((b) => b.id === s.branchId)!;
    const startedAt = new Date(Date.now() - (15 + (i * 17) % 180) * 60 * 1000);
    const durationMin = Math.round((Date.now() - startedAt.getTime()) / 60000);
    const ratePerMin = branch.billing.costPerMinute;
    const spent = +(durationMin * ratePerMin).toFixed(2);
    const walletBalance = +(spent + 20 + (i * 13) % 200).toFixed(2);
    const load = 30 + (i * 11) % 70;
    const health: LiveSession['health'] = load > 92 ? 'critical' : load > 80 ? 'degraded' : 'healthy';
    return {
      id: `SES-${(40010 + i).toString(36).toUpperCase()}`,
      player: s.playerName ?? `Guest ${i + 1}`,
      branchId: branch.id,
      branchName: branch.name,
      cafeId: branch.cafeId,
      seatNumber: s.number,
      gpu: s.gpuModel,
      startedAt,
      durationMin,
      ratePerMin,
      spent,
      walletBalance,
      gpuLoad: load,
      health,
    };
  });
}

const formatDuration = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
};

export default function LiveSessionsMonitor() {
  const [sessions, setSessions] = useState<LiveSession[]>(() => buildSessions());
  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [tick, setTick] = useState(0);
  const [inspected, setInspected] = useState<LiveSession | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  // live ticking — update durations + spent every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => {
          const durationMin = Math.round((Date.now() - s.startedAt.getTime()) / 60000);
          const spent = +(durationMin * s.ratePerMin).toFixed(2);
          return { ...s, durationMin, spent };
        }),
      );
      setTick((t) => t + 1);
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (branchFilter !== 'all' && s.branchId !== branchFilter) return false;
      if (healthFilter !== 'all' && s.health !== healthFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!s.player.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q) && !s.branchName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sessions, query, branchFilter, healthFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // reset page when filters shrink result set below current page
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(1);
  }, [filtered.length, page, pageSize]);

  const filtersActive = query.trim() !== '' || branchFilter !== 'all' || healthFilter !== 'all';
  const isLoading = useDeferredLoading([query, branchFilter, healthFilter, page, pageSize]);

  const clearFilters = () => {
    setQuery('');
    setBranchFilter('all');
    setHealthFilter('all');
  };

  const stats = useMemo(() => {
    const totalRevenue = sessions.reduce((a, b) => a + b.spent, 0);
    const branches = new Set(sessions.map((s) => s.branchId)).size;
    const avgLoad = sessions.length ? Math.round(sessions.reduce((a, b) => a + b.gpuLoad, 0) / sessions.length) : 0;
    const lowWallet = sessions.filter((s) => s.walletBalance - s.spent < 20).length;
    return { active: sessions.length, totalRevenue, branches, avgLoad, lowWallet };
  }, [sessions]);

  const handleRefresh = () => {
    setSessions(buildSessions());
    setLastUpdated(new Date());
    toast.success('Live sessions refreshed');
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI icon={Zap} label="Active sessions" value={stats.active.toString()} tone="text-info" bg="bg-info/10" />
        <KPI icon={Building2} label="Branches live" value={`${stats.branches}/${MOCK_BRANCHES.length}`} tone="text-primary" bg="bg-primary/10" />
        <KPI icon={Wallet} label="Live revenue" value={`RM ${stats.totalRevenue.toFixed(2)}`} tone="text-success" bg="bg-success/10" />
        <KPI icon={Cpu} label="Avg GPU load" value={`${stats.avgLoad}%`} tone="text-warning" bg="bg-warning/10" />
        <KPI icon={Users} label="Low wallet" value={stats.lowWallet.toString()} tone="text-destructive" bg="bg-destructive/10" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Live Sessions
                <span className="flex items-center gap-1.5 text-[11px] font-normal text-success ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Live · refreshed every 5s
                </span>
              </CardTitle>
              <CardDescription>Real-time view of every active session across all cafes.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <LastUpdated timestamp={lastUpdated} />
              <Button size="sm" variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player, session ID, or branch..."
                className="pl-8 h-9"
              />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {MOCK_BRANCHES.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All health</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Session</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Player</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Branch / Seat</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">GPU</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Duration</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Spent / Wallet</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider w-[160px]">GPU Load</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider">Health</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wider text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows rows={Math.min(pageSize, 8)} columns={9} />
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        icon={filtersActive ? FilterX : Inbox}
                        tone={filtersActive ? 'warning' : 'info'}
                        title={filtersActive ? 'No sessions match your filters' : 'No live sessions right now'}
                        description={
                          filtersActive
                            ? 'Try widening the search, switching branches, or resetting the health filter.'
                            : 'Once players start a session at any cafe, they’ll appear here in real time.'
                        }
                        actionLabel={filtersActive ? 'Clear filters' : 'Refresh'}
                        onAction={filtersActive ? clearFilters : handleRefresh}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((s) => {
                    const remaining = +(s.walletBalance - s.spent).toFixed(2);
                    const lowWallet = remaining < 20;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="py-2.5 font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="py-2.5 text-sm font-medium">{s.player}</TableCell>
                        <TableCell className="py-2.5 text-sm">
                          <div className="flex flex-col">
                            <span>{s.branchName}</span>
                            <span className="text-[11px] text-muted-foreground">Seat #{s.seatNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground">{s.gpu}</TableCell>
                        <TableCell className="py-2.5 text-sm tabular-nums">{formatDuration(s.durationMin)}</TableCell>
                        <TableCell className="py-2.5 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium tabular-nums">RM {s.spent.toFixed(2)}</span>
                            <span className={cn('text-[11px] tabular-nums', lowWallet ? 'text-destructive' : 'text-muted-foreground')}>
                              {lowWallet ? `Low: RM ${remaining.toFixed(2)} left` : `RM ${remaining.toFixed(2)} left`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={s.gpuLoad} className="h-1.5 w-24" />
                            <span className="text-[11px] text-muted-foreground tabular-nums w-8">{s.gpuLoad}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={cn('capitalize text-[11px]', HEALTH_STYLES[s.health])}>
                            {s.health}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setInspected(s)}>
                            <Eye className="h-3.5 w-3.5" /> Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            itemLabel="sessions"
          />
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-right">Tick #{tick}</p>

      <LiveSessionInspectorDrawer
        session={inspected}
        open={!!inspected}
        onOpenChange={(o) => !o && setInspected(null)}
      />
    </div>
  );
}

function KPI({ icon: Icon, label, value, tone, bg }: { icon: typeof Activity; label: string; value: string; tone: string; bg: string }) {
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
