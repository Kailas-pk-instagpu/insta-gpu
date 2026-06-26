import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  ScrollText,
  Search,
  Pause,
  Play,
  Trash2,
  Download,
  Copy,
  Eye,
  Bug,
  Info,
  AlertTriangle,
  CircleX,
  CheckCircle2,
  Filter,
  FilterX,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import TablePagination from '@/shared/ui/molecules/TablePagination';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/shared/ui/molecules/EmptyState';
import { useDeferredLoading } from '@/shared/lib/useDeferredLoading';
import LastUpdated from '@/shared/ui/atoms/LastUpdated';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';
type LogSource =
  | 'auth'
  | 'billing'
  | 'sessions'
  | 'gpu-node'
  | 'e2link'
  | 'wallet'
  | 'api'
  | 'database'
  | 'webhook'
  | 'scheduler';

interface AppLog {
  id: string;
  ts: Date;
  level: LogLevel;
  source: LogSource;
  message: string;
  context?: Record<string, string | number | boolean>;
  trace?: string;
  requestId?: string;
}

const LEVEL_META: Record<LogLevel, { label: string; icon: typeof Info; cls: string; dot: string }> = {
  debug: { label: 'Debug', icon: Bug, cls: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
  info: { label: 'Info', icon: Info, cls: 'bg-info/10 text-info border-info/30', dot: 'bg-info' },
  warn: { label: 'Warn', icon: AlertTriangle, cls: 'bg-warning/10 text-warning border-warning/30', dot: 'bg-warning' },
  error: { label: 'Error', icon: CircleX, cls: 'bg-destructive/10 text-destructive border-destructive/30', dot: 'bg-destructive' },
  success: { label: 'Success', icon: CheckCircle2, cls: 'bg-success/10 text-success border-success/30', dot: 'bg-success' },
};

const SOURCES: LogSource[] = ['auth', 'billing', 'sessions', 'gpu-node', 'e2link', 'wallet', 'api', 'database', 'webhook', 'scheduler'];

const SAMPLE_TEMPLATES: Array<{ level: LogLevel; source: LogSource; message: string; context?: AppLog['context']; trace?: string }> = [
  { level: 'info', source: 'auth', message: 'User authenticated successfully', context: { userId: 'usr_8821', method: 'password' } },
  { level: 'success', source: 'billing', message: 'Wallet locked for session', context: { sessionId: 'SES-40012', amount: 5.0 } },
  { level: 'warn', source: 'e2link', message: 'E2Link sync delayed (>3s)', context: { endpoint: '/v2/sync', latencyMs: 3210 } },
  { level: 'error', source: 'webhook', message: 'Webhook signature mismatch', context: { provider: 'e2link', eventId: 'evt_9912' }, trace: 'SignatureError: HMAC-SHA256 mismatch\n  at verifySignature (webhooks.ts:42)\n  at handler (webhooks.ts:18)' },
  { level: 'debug', source: 'sessions', message: 'Session tick processed', context: { sessionId: 'SES-40015', durationMin: 27 } },
  { level: 'info', source: 'gpu-node', message: 'GPU node heartbeat received', context: { nodeId: 'gpu-kl-04', loadPct: 73 } },
  { level: 'warn', source: 'wallet', message: 'Low wallet balance detected', context: { userId: 'usr_5510', balance: 12.5 } },
  { level: 'error', source: 'api', message: 'Upstream gateway timeout', context: { route: 'POST /payments/charge', status: 504 }, trace: 'TimeoutError: 8000ms exceeded\n  at fetchUpstream (gateway.ts:91)' },
  { level: 'info', source: 'scheduler', message: 'Cron job completed: nightly-settlement', context: { durationMs: 4218, processed: 142 } },
  { level: 'debug', source: 'database', message: 'Query executed', context: { table: 'sessions', rows: 38, ms: 14 } },
  { level: 'success', source: 'billing', message: 'Settlement batch finalized', context: { batchId: 'STL-7732', total: 1284.5 } },
  { level: 'error', source: 'gpu-node', message: 'Node went offline unexpectedly', context: { nodeId: 'gpu-pj-02' } },
];

let LOG_SEQ = 1;
function makeLog(template = SAMPLE_TEMPLATES[Math.floor(Math.random() * SAMPLE_TEMPLATES.length)]): AppLog {
  return {
    id: `LOG-${(Date.now() + LOG_SEQ++).toString(36).toUpperCase()}`,
    ts: new Date(),
    requestId: `req_${Math.random().toString(36).slice(2, 10)}`,
    ...template,
  };
}

function seedLogs(n: number): AppLog[] {
  const out: AppLog[] = [];
  for (let i = 0; i < n; i++) {
    const t = SAMPLE_TEMPLATES[i % SAMPLE_TEMPLATES.length];
    out.push({
      id: `LOG-${(Date.now() - i * 1000 + LOG_SEQ++).toString(36).toUpperCase()}`,
      ts: new Date(Date.now() - i * (15_000 + (i * 911) % 45_000)),
      requestId: `req_${Math.random().toString(36).slice(2, 10)}`,
      ...t,
    });
  }
  return out.sort((a, b) => b.ts.getTime() - a.ts.getTime());
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + d.getMilliseconds().toString().padStart(3, '0');

export default function ApplicationLogsMonitor() {
  const [logs, setLogs] = useState<AppLog[]>(() => seedLogs(60));
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LogSource | 'all'>('all');
  const [inspected, setInspected] = useState<AppLog | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const listRef = useRef<HTMLDivElement | null>(null);

  // Live stream — push new logs every 2s when not paused
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setLogs((prev) => [makeLog(), ...prev].slice(0, 500));
      setLastUpdated(new Date());
    }, 2000);
    return () => clearInterval(id);
  }, [paused]);

  // Auto-scroll to top whenever new logs arrive (newest-first list)
  useEffect(() => {
    if (autoScroll && listRef.current) listRef.current.scrollTop = 0;
  }, [logs, autoScroll]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (levelFilter !== 'all' && l.level !== levelFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = `${l.message} ${l.source} ${l.id} ${l.requestId ?? ''} ${JSON.stringify(l.context ?? {})}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, query, levelFilter, sourceFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(1);
  }, [filtered.length, page, pageSize]);

  const filtersActive = query.trim() !== '' || levelFilter !== 'all' || sourceFilter !== 'all';
  const isLoading = useDeferredLoading([query, levelFilter, sourceFilter, page, pageSize]);

  const clearFilters = () => {
    setQuery('');
    setLevelFilter('all');
    setSourceFilter('all');
  };

  const counts = useMemo(() => {
    const c = { debug: 0, info: 0, warn: 0, error: 0, success: 0 } as Record<LogLevel, number>;
    logs.forEach((l) => (c[l.level] += 1));
    return c;
  }, [logs]);

  const handleClear = () => {
    setLogs([]);
    toast.success('Log buffer cleared');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} log entries`);
  };

  const handleCopy = (l: AppLog) => {
    navigator.clipboard.writeText(`[${fmtTime(l.ts)}] [${l.level.toUpperCase()}] [${l.source}] ${l.message} ${l.context ? JSON.stringify(l.context) : ''}`);
    toast.success('Log line copied');
  };

  return (
    <div className="space-y-4">
      {/* Level summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['error', 'warn', 'info', 'success', 'debug'] as LogLevel[]).map((lvl) => {
          const meta = LEVEL_META[lvl];
          const Icon = meta.icon;
          return (
            <Card key={lvl} className="p-3 flex items-center gap-3">
              <div className={cn('p-2 rounded-md border', meta.cls)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{meta.label}</p>
                <p className="text-base font-semibold tabular-nums">{counts[lvl]}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" />
                Application Logs
                <span className="flex items-center gap-1.5 text-[11px] font-normal ml-1">
                  <span className={cn('w-1.5 h-1.5 rounded-full', paused ? 'bg-muted-foreground' : 'bg-success animate-pulse')} />
                  <span className={paused ? 'text-muted-foreground' : 'text-success'}>
                    {paused ? 'Paused' : 'Streaming · live'}
                  </span>
                </span>
              </CardTitle>
              <CardDescription>
                Unified view of every backend, billing, and integration log — built for fast debugging.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LastUpdated timestamp={lastUpdated} className="mr-1" />
              <div className="flex items-center gap-2 px-2 h-9 rounded-md border bg-background">
                <Label htmlFor="autoscroll" className="text-xs text-muted-foreground cursor-pointer">Auto-scroll</Label>
                <Switch id="autoscroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
              </div>
              <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)} className="gap-2">
                {paused ? <><Play className="h-3.5 w-3.5" /> Resume</> : <><Pause className="h-3.5 w-3.5" /> Pause</>}
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button size="sm" variant="outline" onClick={handleClear} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search message, request ID, context..."
                className="pl-8 h-9 font-mono text-xs"
              />
            </div>
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | 'all')}>
              <SelectTrigger className="h-9 w-[140px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {(['error', 'warn', 'info', 'success', 'debug'] as LogLevel[]).map((l) => (
                  <SelectItem key={l} value={l}>{LEVEL_META[l].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as LogSource | 'all')}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div ref={listRef} className="h-[520px] border-t overflow-y-auto">
            <div className="font-mono text-xs">
              {isLoading ? (
                Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
                  <div
                    key={`sk-log-${i}`}
                    className="flex items-center gap-3 px-4 py-2 border-b border-border/40"
                  >
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-3 flex-1 max-w-[60%]" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={filtersActive ? FilterX : Sparkles}
                  tone={filtersActive ? 'warning' : 'success'}
                  title={filtersActive ? 'No log entries match your filters' : 'Log stream is quiet'}
                  description={
                    filtersActive
                      ? 'Try a broader search, switch to All levels, or pick a different source.'
                      : paused
                        ? 'Streaming is paused. Resume to start receiving live log entries again.'
                        : 'Waiting for new events. New logs will appear here automatically as they happen.'
                  }
                  actionLabel={filtersActive ? 'Clear filters' : paused ? 'Resume streaming' : undefined}
                  onAction={filtersActive ? clearFilters : paused ? () => setPaused(false) : undefined}
                />
              ) : (
                paged.map((l) => {
                  const meta = LEVEL_META[l.level];
                  return (
                    <div
                      key={l.id}
                      className="group flex items-start gap-3 px-4 py-2 border-b border-border/40 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => setInspected(l)}
                    >
                      <span className="text-muted-foreground tabular-nums whitespace-nowrap pt-0.5">{fmtTime(l.ts)}</span>
                      <span className="flex items-center gap-1.5 pt-0.5 min-w-[70px]">
                        <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                        <span className={cn('uppercase text-[10px] font-semibold tracking-wider', meta.cls.split(' ').find((c) => c.startsWith('text-')))}>
                          {l.level}
                        </span>
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{l.source}</Badge>
                      <span className="flex-1 min-w-0 break-words text-foreground/90">
                        {l.message}
                        {l.context && (
                          <span className="text-muted-foreground ml-2">
                            {Object.entries(l.context).map(([k, v]) => `${k}=${v}`).join(' ')}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(l); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                        title="Copy log line"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <TablePagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => { setPage(p); listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            pageSizeOptions={[25, 50, 100, 200]}
            itemLabel="entries"
          />
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-right">
        Buffer holds {logs.length} of 500 entries
      </p>

      <Sheet open={!!inspected} onOpenChange={(o) => !o && setInspected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {inspected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Log entry
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">{inspected.id}</SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('capitalize', LEVEL_META[inspected.level].cls)}>
                    {LEVEL_META[inspected.level].label}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">{inspected.source}</Badge>
                  <span className="text-xs text-muted-foreground tabular-nums ml-auto">{fmtTime(inspected.ts)}</span>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Message</p>
                  <p className="text-sm">{inspected.message}</p>
                </div>

                {inspected.requestId && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Request ID</p>
                    <p className="text-xs font-mono">{inspected.requestId}</p>
                  </div>
                )}

                {inspected.context && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Context</p>
                    <pre className="text-xs font-mono bg-muted/40 border rounded-md p-3 overflow-x-auto">
{JSON.stringify(inspected.context, null, 2)}
                    </pre>
                  </div>
                )}

                {inspected.trace && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Stack trace</p>
                    <pre className="text-xs font-mono bg-destructive/5 text-destructive border border-destructive/20 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
{inspected.trace}
                    </pre>
                  </div>
                )}

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => handleCopy(inspected)}>
                    <Copy className="h-3.5 w-3.5" /> Copy log line
                  </Button>
                  {inspected.requestId && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                      navigator.clipboard.writeText(inspected.requestId!);
                      toast.success('Request ID copied');
                    }}>
                      <Copy className="h-3.5 w-3.5" /> Copy request ID
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
