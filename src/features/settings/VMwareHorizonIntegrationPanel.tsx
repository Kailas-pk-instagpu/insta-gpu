import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Lock,
  Eye,
  EyeOff,
  Plug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Hourglass,
  CircleX,
  Server,
  Globe,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'connected' | 'disconnected' | 'sync_issue';

const maskKey = (k: string) => (k ? `${'•'.repeat(Math.max(0, k.length - 4))}${k.slice(-4)}` : '');

const formatTime = (d: Date | null) => {
  if (!d) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export default function VMwareHorizonIntegrationPanel() {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [serverUrl, setServerUrl] = useState('https://horizon.gpu-cloud.internal');
  const [domain, setDomain] = useState('GPUCLOUD');
  const [username, setUsername] = useState('svc_horizon_admin');
  const [savedToken, setSavedToken] = useState('hzn_api_7Xq2Mf9Lp4Vb8Nc1Rs6Td');
  const [lastSync, setLastSync] = useState<Date | null>(new Date(Date.now() - 1000 * 60 * 4));

  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [pools] = useState({ total: 18, active: 14, sessions: 327, errors: 2 });

  const statusMeta: Record<
    ConnectionStatus,
    { label: string; dot: string; ring: string; icon: typeof CheckCircle2; tone: string }
  > = {
    connected: { label: 'Connected', dot: 'bg-success', ring: 'ring-success/30', icon: CheckCircle2, tone: 'text-success' },
    disconnected: { label: 'Disconnected', dot: 'bg-destructive', ring: 'ring-destructive/30', icon: XCircle, tone: 'text-destructive' },
    sync_issue: { label: 'Sync Issue', dot: 'bg-warning', ring: 'ring-warning/30', icon: AlertTriangle, tone: 'text-warning' },
  };

  const meta = statusMeta[status];
  const StatusIcon = meta.icon;

  const validateToken = (k: string): string | null => {
    const trimmed = k.trim();
    if (!trimmed) return 'API token is required';
    if (trimmed.length < 16) return 'API token looks too short';
    if (!/^[A-Za-z0-9_\-]+$/.test(trimmed)) return 'Only letters, numbers, _ and - are allowed';
    if (!trimmed.startsWith('hzn_')) return 'Invalid token (must start with "hzn_")';
    return null;
  };

  const handleRequestUpdate = () => {
    const err = validateToken(tokenInput);
    setTokenError(err);
    if (err) {
      toast.error(err);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    setConfirmOpen(false);
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      if (tokenInput.trim().endsWith('bad')) throw new Error('Invalid API token');
      setSavedToken(tokenInput.trim());
      setTokenInput('');
      setShowToken(false);
      setStatus('connected');
      setLastSync(new Date());
      toast.success('Horizon API token updated successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid API token');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnect = async () => {
    setStatus('sync_issue');
    await new Promise((r) => setTimeout(r, 600));
    setStatus('connected');
    setLastSync(new Date());
    toast.success('VMware Horizon reconnected');
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
    toast.info('VMware Horizon disconnected');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            VMware Horizon API
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage connection to your VMware Horizon Connection Server for desktop pool orchestration.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          TLS · OAuth2
        </Badge>
      </div>

      <Separator />

      {/* Connection Status */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={cn('relative flex items-center justify-center h-9 w-9 rounded-full bg-muted ring-4', meta.ring)}>
                <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn('h-4 w-4', meta.tone)} />
                  <p className={cn('text-sm font-semibold', meta.tone)}>{meta.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">Horizon Connection Server status</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Domain</p>
                <p className="text-sm font-mono font-medium">{domain}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">{formatTime(lastSync)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Configuration */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Connection Server</p>
              <p className="text-xs text-muted-foreground">Endpoint and service account used for API calls.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="hzn-url" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Server URL
              </Label>
              <Input
                id="hzn-url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://horizon.example.com"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hzn-domain">Domain</Label>
              <Input id="hzn-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="CORP" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hzn-user" className="flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" /> Service Account
              </Label>
              <Input id="hzn-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="svc_horizon" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Token */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">API Token</p>
              <p className="text-xs text-muted-foreground">Stored securely. Used to authenticate REST calls to Horizon.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Current Token</Label>
            <div className="px-3 py-2 rounded-md bg-muted/60 border border-border font-mono text-sm tracking-wider">
              {savedToken ? maskKey(savedToken) : 'No token configured'}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hzn-token" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> New API Token
            </Label>
            <div className="relative">
              <Input
                id="hzn-token"
                type={showToken ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  if (tokenError) setTokenError(null);
                }}
                placeholder="hzn_api_xxxxxxxxxxxxxxxx"
                className={cn('pr-10 font-mono', tokenError && 'border-destructive focus-visible:ring-destructive')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showToken ? 'Hide token' : 'Show token'}
                tabIndex={-1}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {tokenError ? (
              <p className="text-xs text-destructive">{tokenError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Generate from Horizon Console → Settings → REST API → API Tokens.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              onClick={handleRequestUpdate}
              disabled={isSubmitting || !tokenInput.trim()}
              className="gradient-primary text-primary-foreground"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update Token'}
            </Button>
            {tokenInput && (
              <Button type="button" variant="ghost" onClick={() => { setTokenInput(''); setTokenError(null); }} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Controls */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold">Connection Controls</p>
            <p className="text-xs text-muted-foreground">Manually manage the link to the Horizon Connection Server.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleConnect} disabled={status === 'connected'}>
              <Plug className="h-4 w-4 mr-2" />
              {status === 'disconnected' ? 'Connect' : 'Reconnect'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={status === 'disconnected'}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <CircleX className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pool / Session Summary */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Desktop Pools & Sessions</p>
              <p className="text-xs text-muted-foreground">Live snapshot from Horizon inventory.</p>
            </div>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryStat icon={Server} label="Total Pools" value={pools.total.toLocaleString()} tone="text-primary" bg="bg-primary/10" />
            <SummaryStat icon={Activity} label="Active Pools" value={pools.active.toLocaleString()} tone="text-success" bg="bg-success/10" />
            <SummaryStat icon={Hourglass} label="Live Sessions" value={pools.sessions.toLocaleString()} tone="text-warning" bg="bg-warning/10" />
            <SummaryStat icon={CircleX} label="Errors" value={pools.errors.toLocaleString()} tone="text-destructive" bg="bg-destructive/10" />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Confirm Token Update
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current Horizon API token. Active broker sessions may briefly
              reconnect while the new token is validated. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>Yes, Update Token</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
  bg,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
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
        <p className="text-base font-semibold">{value}</p>
      </div>
    </div>
  );
}
