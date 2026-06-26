import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Activity,
  Building2,
  Copy,
  Cpu,
  Flag,
  Gauge,
  MapPin,
  Pause,
  Power,
  Timer,
  User,
  Wallet,
  Zap,
} from 'lucide-react';

export interface InspectorSession {
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

const HEALTH_STYLES: Record<InspectorSession['health'], string> = {
  healthy: 'bg-success/10 text-success border-success/30',
  degraded: 'bg-warning/10 text-warning border-warning/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

const formatDuration = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
};

interface Props {
  session: InspectorSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LiveSessionInspectorDrawer({ session, open, onOpenChange }: Props) {
  if (!session) return null;

  const remaining = +(session.walletBalance - session.spent).toFixed(2);
  const lowWallet = remaining < 20;
  const walletPct = Math.min(100, Math.round((session.spent / session.walletBalance) * 100));
  const minutesLeft = session.ratePerMin > 0 ? Math.floor(remaining / session.ratePerMin) : 0;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 pb-3 border-b">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                Session Inspector
              </SheetTitle>
              <SheetDescription className="font-mono text-xs mt-1 truncate">{session.id}</SheetDescription>
            </div>
            <Badge variant="outline" className={cn('capitalize text-[11px]', HEALTH_STYLES[session.health])}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5',
                session.health === 'healthy' && 'bg-success animate-pulse',
                session.health === 'degraded' && 'bg-warning',
                session.health === 'critical' && 'bg-destructive animate-pulse',
              )} />
              {session.health}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {/* Player */}
            <Section icon={User} title="Player">
              <Row label="Name" value={session.player} />
              <Row label="Started" value={session.startedAt.toLocaleString()} />
              <Row
                label="Duration"
                value={
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    {formatDuration(session.durationMin)}
                  </span>
                }
              />
            </Section>

            <Separator />

            {/* Seat */}
            <Section icon={MapPin} title="Seat & Branch">
              <Row
                label="Branch"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {session.branchName}
                  </span>
                }
              />
              <Row label="Seat" value={`#${session.seatNumber}`} />
              <Row label="GPU" value={<span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3 text-muted-foreground" />{session.gpu}</span>} />
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" /> GPU load</span>
                  <span className="tabular-nums">{session.gpuLoad}%</span>
                </div>
                <Progress value={session.gpuLoad} className="h-1.5" />
              </div>
            </Section>

            <Separator />

            {/* Billing */}
            <Section icon={Wallet} title="Billing Progress">
              <Row label="Rate" value={<span className="tabular-nums">RM {session.ratePerMin.toFixed(2)} / min</span>} />
              <Row label="Spent" value={<span className="tabular-nums font-medium">RM {session.spent.toFixed(2)}</span>} />
              <Row label="Wallet balance" value={<span className="tabular-nums">RM {session.walletBalance.toFixed(2)}</span>} />
              <Row
                label="Remaining"
                value={
                  <span className={cn('tabular-nums font-medium', lowWallet && 'text-destructive')}>
                    RM {remaining.toFixed(2)}
                    <span className="text-[11px] text-muted-foreground ml-1">≈ {minutesLeft}m left</span>
                  </span>
                }
              />
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Wallet usage</span>
                  <span className="tabular-nums">{walletPct}%</span>
                </div>
                <Progress value={walletPct} className={cn('h-1.5', lowWallet && '[&>div]:bg-destructive')} />
              </div>
              {lowWallet && (
                <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2 py-1.5 mt-2">
                  Low wallet — session may be auto-paused soon.
                </div>
              )}
            </Section>

            <Separator />

            {/* Quick actions */}
            <Section icon={Zap} title="Quick Actions">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start" onClick={() => copy(session.id, 'Session ID')}>
                  <Copy className="h-3.5 w-3.5" /> Copy Session ID
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => copy(session.player, 'Player')}>
                  <User className="h-3.5 w-3.5" /> Copy Player
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-warning hover:text-warning"
                  onClick={() => toast.warning(`${session.id} flagged for review`)}
                >
                  <Flag className="h-3.5 w-3.5" /> Flag for review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => toast.info(`Pause request sent for ${session.id}`)}
                >
                  <Pause className="h-3.5 w-3.5" /> Request pause
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="justify-start col-span-2"
                  onClick={() => toast.error(`Force-end requested for ${session.id}`)}
                >
                  <Power className="h-3.5 w-3.5" /> Force end session
                </Button>
              </div>
            </Section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Activity; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}
