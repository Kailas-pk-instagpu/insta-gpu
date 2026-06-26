import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Armchair, Cpu, Tag, Activity, ArrowRight, User, Building2, Clock, History, Hash } from 'lucide-react';
import { SeatActivityEntry, SeatActivityField, useSeatActivityStore } from '@/shared/lib/seatActivityStore';
import { useSeatStore, useBranchStore } from '@/shared/lib/store';
import { cn } from '@/lib/utils';

const FIELD_META: Record<SeatActivityField, { label: string; icon: typeof Tag; cls: string }> = {
  label: { label: 'Name', icon: Tag, cls: 'bg-info/10 text-info border-info/30' },
  gpuModel: { label: 'GPU', icon: Cpu, cls: 'bg-primary/10 text-primary border-primary/30' },
  status: { label: 'Status', icon: Activity, cls: 'bg-warning/10 text-warning border-warning/30' },
};

const STATUS_CLS: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-info/10 text-info border-info/30',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

function fmtAbs(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface Props {
  entry: SeatActivityEntry | null;
  onOpenChange: (open: boolean) => void;
}

export default function SeatActivityDetailsDrawer({ entry, onOpenChange }: Props) {
  const seats = useSeatStore((s) => s.seats);
  const branches = useBranchStore((s) => s.branches);
  const allEntries = useSeatActivityStore((s) => s.entries);

  const seat = useMemo(() => seats.find((s) => s.id === entry?.seatId), [seats, entry?.seatId]);
  const branch = useMemo(() => branches.find((b) => b.id === entry?.branchId), [branches, entry?.branchId]);
  const relatedHistory = useMemo(
    () => (entry ? allEntries.filter((e) => e.seatId === entry.seatId && e.id !== entry.id).slice(0, 8) : []),
    [allEntries, entry]
  );

  const meta = entry ? FIELD_META[entry.field] : null;
  const Icon = meta?.icon ?? Tag;

  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-hidden p-0 flex flex-col">
        {entry && (
          <>
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <History className="h-3.5 w-3.5" />
                Activity entry
              </div>
              <SheetTitle className="flex items-center gap-2 text-base">
                <Armchair className="h-4 w-4 text-primary" />
                Seat #{entry.seatNumber}
                {seat?.label && <span className="text-muted-foreground font-normal">· {seat.label}</span>}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-xs">
                <Building2 className="h-3.5 w-3.5" /> {entry.branchName}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Change card */}
                <section className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={cn('gap-1 text-[10px]', meta?.cls)}>
                      <Icon className="h-3 w-3" /> {meta?.label} change
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {fmtRelative(entry.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 font-mono text-sm">
                    <span className="px-2 py-1 rounded bg-background border text-muted-foreground line-through decoration-1">
                      {entry.fromValue || '—'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="px-2 py-1 rounded bg-success/10 text-success border border-success/30 font-medium">
                      {entry.toValue || '—'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">{fmtAbs(entry.timestamp)}</div>
                </section>

                {/* Actor */}
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performed by</h4>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{entry.actorName}</div>
                      <div className="text-xs text-muted-foreground">{entry.actorRole}</div>
                    </div>
                  </div>
                </section>

                {/* Current seat info */}
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current seat</h4>
                  {seat ? (
                    <div className="rounded-lg border divide-y">
                      <Row icon={Hash} label="Seat ID" value={seat.id} mono />
                      <Row icon={Tag} label="Display name" value={seat.label || '—'} />
                      <Row icon={Cpu} label="GPU model" value={seat.gpuModel} />
                      <Row
                        icon={Activity}
                        label="Status"
                        valueNode={
                          <Badge variant="outline" className={cn('text-[10px] capitalize', STATUS_CLS[seat.status])}>
                            {seat.status}
                          </Badge>
                        }
                      />
                      {seat.status === 'occupied' && seat.playerName && (
                        <Row icon={User} label="Player" value={seat.playerName} />
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Seat no longer exists.</p>
                  )}
                </section>

                {/* Branch */}
                {branch && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch</h4>
                    <div className="rounded-lg border divide-y">
                      <Row icon={Building2} label="Name" value={branch.name} />
                      {('location' in branch) && (branch as any).location && (
                        <Row icon={Building2} label="Location" value={(branch as any).location} />
                      )}
                      <Row icon={Armchair} label="Total seats" value={String(seats.filter((s) => s.branchId === branch.id).length)} />
                    </div>
                  </section>
                )}

                {/* Related history */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Recent history for this seat
                    </h4>
                    <span className="text-[10px] text-muted-foreground">{relatedHistory.length}</span>
                  </div>
                  {relatedHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No other changes recorded.</p>
                  ) : (
                    <ol className="relative border-l border-border ml-2 space-y-3 pl-4">
                      {relatedHistory.map((h) => {
                        const m = FIELD_META[h.field];
                        const HIcon = m.icon;
                        return (
                          <li key={h.id} className="relative">
                            <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn('gap-1 text-[10px]', m.cls)}>
                                <HIcon className="h-3 w-3" /> {m.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{fmtRelative(h.timestamp)}</span>
                            </div>
                            <div className="text-xs font-mono flex items-center gap-1.5 flex-wrap">
                              <span className="text-muted-foreground line-through">{h.fromValue || '—'}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-success">{h.toValue || '—'}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              by {h.actorName} · {h.actorRole}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon: I,
  label,
  value,
  valueNode,
  mono,
}: {
  icon: typeof Tag;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <I className="h-3.5 w-3.5" /> {label}
      </span>
      {valueNode ?? (
        <span className={cn('text-xs text-right truncate max-w-[60%]', mono && 'font-mono')}>{value}</span>
      )}
    </div>
  );
}
