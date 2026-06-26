import { useMemo, useState } from 'react';
import { MOCK_GPU_NODES, MOCK_BRANCHES, GPU_MODEL_OPTIONS, type GPUNode } from '@/shared/lib/mock-data';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import EmptyState from '@/shared/ui/molecules/EmptyState';
import {
  Cpu, Thermometer, HardDrive, Search, X, Zap, Activity, Clock, Wifi, Wrench,
  CalendarDays, Users, Gauge, Fan, Server,
} from 'lucide-react';

const STATUSES = ['online', 'offline', 'maintenance', 'warning', 'overloaded'] as const;
const HEALTHS = ['healthy', 'degraded', 'critical'] as const;
const SORTS = [
  { value: 'performance', label: 'Performance (clock)' },
  { value: 'usage', label: 'Usage (utilization)' },
  { value: 'uptime', label: 'Uptime' },
  { value: 'availability', label: 'Availability (free mem)' },
  { value: 'name', label: 'Name' },
] as const;

type SortKey = typeof SORTS[number]['value'];

function formatUptime(h: number) {
  if (!h) return '—';
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return d > 0 ? `${d}d ${hr}h` : `${hr}h`;
}

function tempClass(t: number) {
  return t > 75 ? 'text-destructive' : t > 60 ? 'text-warning' : 'text-success';
}

export default function GPUNodesPage() {
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [model, setModel] = useState<string>('all');
  const [health, setHealth] = useState<string>('all');
  const [utilBucket, setUtilBucket] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('usage');
  const [selected, setSelected] = useState<GPUNode | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = MOCK_GPU_NODES.filter(n => {
      if (q && !n.name.toLowerCase().includes(q) && !n.id.toLowerCase().includes(q)) return false;
      if (branch !== 'all' && n.branchId !== branch) return false;
      if (status !== 'all' && n.status !== status) return false;
      if (model !== 'all' && n.gpuModel !== model) return false;
      if (health !== 'all' && n.health !== health) return false;
      if (utilBucket !== 'all') {
        if (utilBucket === 'low' && n.utilization >= 40) return false;
        if (utilBucket === 'medium' && (n.utilization < 40 || n.utilization >= 75)) return false;
        if (utilBucket === 'high' && n.utilization < 75) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'performance': return b.clockMhz - a.clockMhz;
        case 'usage': return b.utilization - a.utilization;
        case 'uptime': return b.uptimeHours - a.uptimeHours;
        case 'availability': return (b.memoryTotal - b.memoryUsed) - (a.memoryTotal - a.memoryUsed);
        case 'name': return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [search, branch, status, model, health, utilBucket, sortBy]);

  const activeFilters = [branch, status, model, health, utilBucket].filter(v => v !== 'all').length + (search ? 1 : 0);

  const reset = () => {
    setSearch(''); setBranch('all'); setStatus('all'); setModel('all'); setHealth('all'); setUtilBucket('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">GPU Nodes</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor and manage GPU infrastructure</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of {MOCK_GPU_NODES.length} nodes
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by node name or ID..."
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {MOCK_BRANCHES.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue placeholder="GPU model" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All models</SelectItem>
                {GPU_MODEL_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={health} onValueChange={setHealth}>
              <SelectTrigger><SelectValue placeholder="Health" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All health</SelectItem>
                {HEALTHS.map(h => <SelectItem key={h} value={h} className="capitalize">{h}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={utilBucket} onValueChange={setUtilBucket}>
              <SelectTrigger><SelectValue placeholder="Utilization" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any utilization</SelectItem>
                <SelectItem value="low">Low (&lt; 40%)</SelectItem>
                <SelectItem value="medium">Medium (40–75%)</SelectItem>
                <SelectItem value="high">High (≥ 75%)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
              <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                {SORTS.map(s => <SelectItem key={s.value} value={s.value}>Sort: {s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {activeFilters > 0 && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={reset} className="h-8 gap-1.5">
                <X className="h-3.5 w-3.5" /> Clear filters ({activeFilters})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No GPU nodes found"
          description="Try adjusting your search or filters to find nodes."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(node => (
            <Card
              key={node.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(node)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(node); } }}
              className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{node.name}</CardTitle>
                  <StatusBadge status={node.status} />
                </div>
                <p className="text-xs text-muted-foreground">{node.gpuModel} • {node.location}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {node.status !== 'offline' && node.status !== 'maintenance' ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Cpu className="h-3.5 w-3.5" /> Utilization</span>
                        <span className="font-medium">{node.utilization}%</span>
                      </div>
                      <Progress value={node.utilization} className="h-2" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="h-3.5 w-3.5" /> Memory</span>
                        <span className="font-medium">{node.memoryUsed}/{node.memoryTotal} GB</span>
                      </div>
                      <Progress value={(node.memoryUsed / node.memoryTotal) * 100} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Thermometer className="h-3.5 w-3.5" /> Temperature</span>
                      <span className={`font-medium ${tempClass(node.temperature)}`}>{node.temperature}°C</span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground capitalize">
                    Node is currently {node.status}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" /> {selected.name}
                    </DialogTitle>
                    <DialogDescription>
                      {selected.id} • {selected.gpuModel} • {selected.location}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={selected.status} />
                    <StatusBadge status={selected.health} />
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Metric icon={Cpu} label="Utilization" value={`${selected.utilization}%`} />
                  <Metric icon={HardDrive} label="Memory" value={`${selected.memoryUsed}/${selected.memoryTotal} GB`} />
                  <Metric icon={Thermometer} label="Temp" value={`${selected.temperature}°C`} valueClass={tempClass(selected.temperature)} />
                  <Metric icon={Zap} label="Power" value={`${selected.powerDrawW} W`} />
                  <Metric icon={Fan} label="Fan" value={`${selected.fanSpeed}%`} />
                  <Metric icon={Clock} label="Uptime" value={formatUptime(selected.uptimeHours)} />
                  <Metric icon={Activity} label="Active sessions" value={String(selected.activeSessions)} />
                  <Metric icon={Users} label="Total sessions" value={String(selected.totalSessions)} />
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Gauge className="h-4 w-4" /> Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Field label="Core clock" value={`${selected.clockMhz} MHz`} />
                    <Field label="Memory clock" value={`${selected.memoryClockMhz} MHz`} />
                    <Field label="PCIe" value={selected.pcieGen} />
                    <Field label="Avg session" value={`${selected.avgSessionMinutes} min`} />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Wifi className="h-4 w-4" /> System</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Field label="IP address" value={selected.ipAddress} />
                    <Field label="Serial" value={selected.serialNumber} />
                    <Field label="Driver" value={selected.driverVersion} />
                    <Field label="CUDA" value={selected.cudaVersion} />
                    <Field label="vBIOS" value={selected.vbiosVersion} />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Wrench className="h-4 w-4" /> Maintenance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Field label="Installed" value={selected.installedAt} icon={CalendarDays} />
                    <Field label="Last maintenance" value={selected.lastMaintenance} icon={CalendarDays} />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ icon: Icon, label, value, valueClass }: { icon: React.ElementType; label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`text-base font-semibold mt-1 ${valueClass ?? ''}`}>{value}</div>
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium flex items-center gap-1.5">{Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}{value}</div>
    </div>
  );
}
