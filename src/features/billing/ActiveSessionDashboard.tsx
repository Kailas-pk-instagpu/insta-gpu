import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Hash, Banknote, Lock, TrendingDown, Wallet, AlertTriangle, Power, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EndSessionConfirmDialog } from './EndSessionConfirmDialog';

interface ActiveSessionDashboardProps {
  sessionId?: string;
  startTime?: Date;
  lockedAmount?: number;
  costPerMinute?: number;
  readOnly?: boolean;
  branchName?: string;
  onEndSession?: (summary: { durationSec: number; usageCost: number; refund: number }) => void;
}

function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function ActiveSessionDashboard({
  sessionId = useMemo(() => crypto.randomUUID(), []),
  startTime = useMemo(() => new Date(), []),
  lockedAmount = 100,
  costPerMinute = 2,
  readOnly = false,
  branchName,
  onEndSession,
}: ActiveSessionDashboardProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [ended, setEnded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (ended) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [ended]);

  const durationSec = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000));
  const usageCost = Math.min(lockedAmount, +(durationSec / 60 * costPerMinute).toFixed(2));
  const remaining = +(lockedAmount - usageCost).toFixed(2);
  const usagePct = Math.min(100, (usageCost / lockedAmount) * 100);

  const handleEnd = () => {
    if (isEnding || ended) return;
    setConfirmOpen(true);
  };

  const handleConfirmEnd = async () => {
    if (isEnding || ended) return;
    setIsEnding(true);
    try {
      // Simulated async settlement to guard against double-clicks / slow requests
      await new Promise((resolve) => setTimeout(resolve, 600));
      setEnded(true);
      setConfirmOpen(false);
      onEndSession?.({ durationSec, usageCost, refund: remaining });
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Active Gaming Session</h1>
            <p className="text-muted-foreground mt-1">
              Live billing & usage monitor{branchName ? ` · ${branchName}` : ''}
            </p>
          </div>
          <Badge
            className={cn(
              'self-start md:self-auto px-3 py-1.5 text-sm font-semibold border',
              ended
                ? 'bg-muted text-muted-foreground border-muted'
                : 'bg-success/10 text-success border-success/30 shadow-[0_0_20px_hsl(var(--success)/0.4)]'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full mr-2',
                ended ? 'bg-muted-foreground' : 'bg-success animate-pulse'
              )}
            />
            {ended ? 'ENDED' : 'ACTIVE'}
          </Badge>
        </div>

        {/* Session info row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                <Hash className="h-3.5 w-3.5" /> Session ID
              </div>
              <p className="font-mono text-sm truncate" title={sessionId}>{sessionId}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                <Clock className="h-3.5 w-3.5" /> Start Time
              </div>
              <p className="font-mono text-sm">{startTime.toLocaleTimeString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{startTime.toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-success text-xs uppercase tracking-wider mb-2">
                <Activity className="h-3.5 w-3.5" /> Live Duration
              </div>
              <p className="font-mono text-2xl font-bold text-success tabular-nums">
                {formatDuration(durationSec)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                <Banknote className="h-3.5 w-3.5" /> Cost / Minute
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums">RM {costPerMinute.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Highlight billing section */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_50%)] pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-primary" />
              Live Billing Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Locked */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
                <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider mb-3">
                  <Lock className="h-3.5 w-3.5" /> Locked Amount
                </div>
                <p className="font-mono text-3xl font-bold tabular-nums">RM {lockedAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Reserved from wallet</p>
              </div>

              {/* Usage */}
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-[0_0_30px_hsl(var(--destructive)/0.15)]">
                <div className="flex items-center gap-2 text-destructive text-xs uppercase tracking-wider mb-3">
                  <TrendingDown className="h-3.5 w-3.5" /> Current Usage
                </div>
                <p className="font-mono text-3xl font-bold tabular-nums text-destructive">
                  RM {usageCost.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Updates every second</p>
              </div>

              {/* Remaining */}
              <div className="rounded-xl border border-success/30 bg-success/5 p-5 shadow-[0_0_30px_hsl(var(--success)/0.15)]">
                <div className="flex items-center gap-2 text-success text-xs uppercase tracking-wider mb-3">
                  <Wallet className="h-3.5 w-3.5" /> Remaining Balance
                </div>
                <p className="font-mono text-3xl font-bold tabular-nums text-success">
                  RM {remaining.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Refundable on end</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Balance utilisation</span>
                <span className="font-mono">{usagePct.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success via-warning to-destructive transition-[width] duration-1000 ease-linear"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>

            {/* Warning + CTA */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
              <div className="flex items-start gap-2 text-sm text-warning">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Unused balance will be refunded after session ends.</span>
              </div>
              <Button
                size="lg"
                variant="destructive"
                onClick={handleEnd}
                disabled={ended || readOnly || isEnding}
                aria-busy={isEnding}
                className="shadow-[0_0_25px_hsl(var(--destructive)/0.4)]"
                title={readOnly ? 'Only cafe owner can end the session' : undefined}
              >
                {isEnding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                {ended
                  ? 'Session Ended'
                  : readOnly
                    ? 'View Only'
                    : isEnding
                      ? 'Ending Session...'
                      : 'End Session'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <EndSessionConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (isEnding) return; // prevent closing while settling
          setConfirmOpen(o);
        }}
        onConfirm={handleConfirmEnd}
        isProcessing={isEnding}
        branchName={branchName}
        durationSec={durationSec}
        lockedAmount={lockedAmount}
        usageCost={usageCost}
        refund={remaining}
        costPerMinute={costPerMinute}
      />
    </div>
  );
}

export default ActiveSessionDashboard;
