import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Banknote, Lock, Power, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EndSessionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing?: boolean;
  customerName?: string;
  branchName?: string;
  durationSec: number;
  lockedAmount: number;
  usageCost: number;
  refund: number;
  costPerMinute?: number;
}

function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function EndSessionConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
  customerName,
  branchName,
  durationSec,
  lockedAmount,
  usageCost,
  refund,
  costPerMinute,
}: EndSessionConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (isProcessing) return; onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Power className="h-5 w-5 text-destructive" />
            Confirm End Session
          </DialogTitle>
          <DialogDescription>
            Review the totals below. Once confirmed, the settlement will be recorded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {(customerName || branchName) && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-0.5">
              {customerName && <p><span className="text-muted-foreground">Customer:</span> <strong>{customerName}</strong></p>}
              {branchName && <p><span className="text-muted-foreground">Branch:</span> <strong>{branchName}</strong></p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                <Clock className="h-3 w-3" /> Duration
              </div>
              <p className="font-mono text-lg font-bold tabular-nums">{formatDuration(durationSec)}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                <Banknote className="h-3 w-3" /> Rate
              </div>
              <p className="font-mono text-lg font-bold tabular-nums">
                RM {(costPerMinute ?? 0).toFixed(2)}<span className="text-xs text-muted-foreground font-normal"> /min</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary mb-1">
                <Lock className="h-3 w-3" /> Locked
              </div>
              <p className="font-mono text-base font-bold tabular-nums">RM {lockedAmount.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-destructive mb-1">
                <TrendingDown className="h-3 w-3" /> Usage
              </div>
              <p className={cn('font-mono text-base font-bold tabular-nums text-destructive')}>
                RM {usageCost.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/5 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-success mb-1">
                <Wallet className="h-3 w-3" /> Refund
              </div>
              <p className="font-mono text-base font-bold tabular-nums text-success">RM {refund.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-warning">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Refund of RM {refund.toFixed(2)} will be returned to the customer's wallet.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isProcessing}
            aria-busy={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Settling...
              </>
            ) : (
              <>
                <Power className="h-4 w-4" /> Confirm & Settle
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EndSessionConfirmDialog;
