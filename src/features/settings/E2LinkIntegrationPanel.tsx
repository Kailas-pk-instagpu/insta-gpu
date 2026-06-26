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
  PlugZap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Hourglass,
  CircleX,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import E2LinkDetailsDrawer from './E2LinkDetailsDrawer';

type ConnectionStatus = 'connected' | 'disconnected' | 'sync_issue';

const maskAccount = (id: string) => {
  if (id.length <= 4) return '••••';
  return `${id.slice(0, 4)}••••${id.slice(-3)}`;
};

const maskKey = (k: string) => (k ? `${'•'.repeat(Math.max(0, k.length - 4))}${k.slice(-4)}` : '');

const formatTime = (d: Date | null) => {
  if (!d) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export default function E2LinkIntegrationPanel() {
  // Mock connection state
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [accountId] = useState('E2L-AC-9F23K7BX');
  const [lastSync, setLastSync] = useState<Date | null>(new Date(Date.now() - 1000 * 60 * 12));
  const [savedKey, setSavedKey] = useState('e2lk_live_8f2hQa9K3sLp7Xd1Rw5Mb6Nc');

  // API key edit state
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Sync summary (mock)
  const [summary] = useState({ synced: 12480, pending: 23, failed: 4 });
  const [detailsOpen, setDetailsOpen] = useState(false);

  const statusMeta: Record<
    ConnectionStatus,
    { label: string; dot: string; ring: string; icon: typeof CheckCircle2; tone: string }
  > = {
    connected: {
      label: 'Connected',
      dot: 'bg-success',
      ring: 'ring-success/30',
      icon: CheckCircle2,
      tone: 'text-success',
    },
    disconnected: {
      label: 'Disconnected',
      dot: 'bg-destructive',
      ring: 'ring-destructive/30',
      icon: XCircle,
      tone: 'text-destructive',
    },
    sync_issue: {
      label: 'Sync Issue',
      dot: 'bg-warning',
      ring: 'ring-warning/30',
      icon: AlertTriangle,
      tone: 'text-warning',
    },
  };

  const meta = statusMeta[status];
  const StatusIcon = meta.icon;

  const validateKey = (k: string): string | null => {
    const trimmed = k.trim();
    if (!trimmed) return 'API key is required';
    if (trimmed.length < 16) return 'API key looks too short';
    if (!/^[A-Za-z0-9_\-]+$/.test(trimmed)) return 'Only letters, numbers, _ and - are allowed';
    if (!trimmed.startsWith('e2lk_')) return 'Invalid API key (must start with "e2lk_")';
    return null;
  };

  const handleRequestUpdate = () => {
    const err = validateKey(keyInput);
    setKeyError(err);
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
      // Simulate validation: keys ending with "bad" fail
      if (keyInput.trim().endsWith('bad')) {
        throw new Error('Invalid API key');
      }
      setSavedKey(keyInput.trim());
      setKeyInput('');
      setShowKey(false);
      setStatus('connected');
      setLastSync(new Date());
      toast.success('API key updated successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnect = async () => {
    setStatus('sync_issue');
    await new Promise((r) => setTimeout(r, 600));
    setStatus('connected');
    setLastSync(new Date());
    toast.success('E2Link reconnected');
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
    toast.info('E2Link disconnected');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PlugZap className="h-5 w-5 text-primary" />
            E2Link Integration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the connection between GPU Cloud and your E2Link account.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Secure channel
        </Badge>
      </div>

      <Separator />

      {/* Connection Status */}
      <Card
        className="border-border/60 cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="button"
        tabIndex={0}
        onClick={() => setDetailsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDetailsOpen(true);
          }
        }}
        aria-label="Open E2Link details"
      >
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
                <p className="text-xs text-muted-foreground">E2Link service status · click for details</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Account ID</p>
                <p className="text-sm font-mono font-medium">{maskAccount(accountId)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">{formatTime(lastSync)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">API Configuration</p>
              <p className="text-xs text-muted-foreground">Stored securely. Never exposed to the browser.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Current Key</Label>
            <div className="px-3 py-2 rounded-md bg-muted/60 border border-border font-mono text-sm tracking-wider">
              {savedKey ? maskKey(savedKey) : 'No key configured'}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e2link-key" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> New API Key
            </Label>
            <div className="relative">
              <Input
                id="e2link-key"
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  if (keyError) setKeyError(null);
                }}
                placeholder="e2lk_live_xxxxxxxxxxxxxxxx"
                className={cn('pr-10 font-mono', keyError && 'border-destructive focus-visible:ring-destructive')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {keyError ? (
              <p className="text-xs text-destructive">{keyError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Get your API key from your E2Link dashboard → Developers → API Keys.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              onClick={handleRequestUpdate}
              disabled={isSubmitting || !keyInput.trim()}
              className="gradient-primary text-primary-foreground"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update API Key'}
            </Button>
            {keyInput && (
              <Button type="button" variant="ghost" onClick={() => { setKeyInput(''); setKeyError(null); }} disabled={isSubmitting}>
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
            <p className="text-xs text-muted-foreground">Manually manage the link between GPU Cloud and E2Link.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleConnect}
              disabled={status === 'connected'}
            >
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

      {/* Sync Summary */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Sync Summary</p>
              <p className="text-xs text-muted-foreground">Aggregated transaction sync metrics.</p>
            </div>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryStat
              icon={Activity}
              label="Total Synced"
              value={summary.synced.toLocaleString()}
              tone="text-success"
              bg="bg-success/10"
            />
            <SummaryStat
              icon={Hourglass}
              label="Pending"
              value={summary.pending.toLocaleString()}
              tone="text-warning"
              bg="bg-warning/10"
            />
            <SummaryStat
              icon={CircleX}
              label="Failed"
              value={summary.failed.toLocaleString()}
              tone="text-destructive"
              bg="bg-destructive/10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Confirm API Key Update
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current E2Link API key. Active sync sessions may briefly disconnect
              while the new key is validated. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Yes, Update Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <E2LinkDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        accountId={maskAccount(accountId)}
        status={status}
      />
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
