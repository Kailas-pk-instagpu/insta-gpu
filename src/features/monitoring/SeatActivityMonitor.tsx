import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Armchair, Search, FilterX, History, Cpu, Tag, Activity, Download, Trash2, ArrowRight, User } from 'lucide-react';
import { useSeatActivityStore, SeatActivityField, SeatActivityEntry } from '@/shared/lib/seatActivityStore';
import SeatActivityDetailsDrawer from './SeatActivityDetailsDrawer';
import { useBranchStore } from '@/shared/lib/store';
import TablePagination from '@/shared/ui/molecules/TablePagination';
import EmptyState from '@/shared/ui/molecules/EmptyState';
import TableSkeletonRows from '@/shared/ui/molecules/TableSkeletonRows';
import { useDeferredLoading } from '@/shared/lib/useDeferredLoading';
import LastUpdated from '@/shared/ui/atoms/LastUpdated';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FIELD_META: Record<SeatActivityField, { label: string; icon: typeof Tag; cls: string }> = {
  label: { label: 'Name', icon: Tag, cls: 'bg-info/10 text-info border-info/30' },
  gpuModel: { label: 'GPU', icon: Cpu, cls: 'bg-primary/10 text-primary border-primary/30' },
  status: { label: 'Status', icon: Activity, cls: 'bg-warning/10 text-warning border-warning/30' },
};

function fmtAbs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function SeatActivityMonitor() {
  const entries = useSeatActivityStore((s) => s.entries);
  const clear = useSeatActivityStore((s) => s.clear);
  const branches = useBranchStore((s) => s.branches);

  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<SeatActivityField | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<SeatActivityEntry | null>(null);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [entries.length]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (branchFilter !== 'all' && e.branchId !== branchFilter) return false;
      if (fieldFilter !== 'all' && e.field !== fieldFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${e.seatNumber} ${e.branchName} ${e.actorName} ${e.fromValue} ${e.toValue} ${e.field}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, query, branchFilter, fieldFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(1);
  }, [filtered.length, page, pageSize]);

  const filtersActive = query.trim() !== '' || branchFilter !== 'all' || fieldFilter !== 'all';
  const isLoading = useDeferredLoading([query, branchFilter, fieldFilter, page, pageSize]);

  const clearFilters = () => {
    setQuery('');
    setBranchFilter('all');
    setFieldFilter('all');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seat-activity-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} entries`);
  };

  const handleClear = () => {
    clear();
    toast.success('Seat activity log cleared');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Seat Activity Log
            </CardTitle>
            <CardDescription>
              Audit trail of every seat change — name, GPU and status updates across all branches.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LastUpdated timestamp={lastUpdated} />
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
              placeholder="Search seat, branch, actor, value..."
              className="pl-8 h-9"
            />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fieldFilter} onValueChange={(v) => setFieldFilter(v as SeatActivityField | 'all')}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fields</SelectItem>
              <SelectItem value="label">Name</SelectItem>
              <SelectItem value="gpuModel">GPU</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">When</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Actor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={6} rows={Math.min(pageSize, 8)} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={filtersActive ? FilterX : History}
                    tone={filtersActive ? 'warning' : 'info'}
                    title={filtersActive ? 'No activity matches your filters' : 'No seat activity yet'}
                    description={
                      filtersActive
                        ? 'Try a broader search or reset the filters.'
                        : 'Updates to seat name, GPU or status will appear here as soon as they happen.'
                    }
                    actionLabel={filtersActive ? 'Clear filters' : undefined}
                    onAction={filtersActive ? clearFilters : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((e) => {
                const meta = FIELD_META[e.field];
                const Icon = meta.icon;
                return (
                  <TableRow
                    key={e.id}
                    className="text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelected(e)}
                  >
                    <TableCell className="font-mono tabular-nums text-muted-foreground">{fmtAbs(e.timestamp)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Armchair className="h-3.5 w-3.5 text-primary" />
                        #{e.seatNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.branchName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('gap-1 text-[10px]', meta.cls)}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground line-through decoration-1">
                          {e.fromValue || '—'}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">
                          {e.toValue || '—'}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{e.actorName}</span>
                        <span className="text-muted-foreground">· {e.actorRole}</span>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          pageSizeOptions={[25, 50, 100]}
          itemLabel="entries"
        />
      </CardContent>
      <SeatActivityDetailsDrawer entry={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </Card>
  );
}
