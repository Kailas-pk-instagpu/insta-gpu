import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/shared/lib/store';
import { cn } from '@/lib/utils';

type SystemStatus = 'operational' | 'degraded' | 'down';

/**
 * Lightweight polling hook to simulate real-time billing system status.
 * Replace with a real subscription when wired to backend.
 */
function useBillingSystemStatus(): SystemStatus {
  const [status, setStatus] = useState<SystemStatus>('operational');
  useEffect(() => {
    const pick = (): SystemStatus => {
      const r = Math.random();
      if (r < 0.8) return 'operational';
      if (r < 0.95) return 'degraded';
      return 'down';
    };
    const id = setInterval(() => setStatus(pick()), 15000);
    return () => clearInterval(id);
  }, []);
  return status;
}

/**
 * Slim top banner shown ONLY to Managers when the billing system is
 * degraded or down. Auto-hides when the system recovers.
 */
export function ManagerBillingBanner() {
  const { user } = useAuthStore();
  const status = useBillingSystemStatus();
  const [dismissed, setDismissed] = useState<SystemStatus | null>(null);

  // Reset dismissal when status changes so a new incident is re-shown.
  useEffect(() => {
    if (dismissed && dismissed !== status) setDismissed(null);
  }, [status, dismissed]);

  if (user?.role !== 'manager') return null;
  if (status === 'operational') return null;
  if (dismissed === status) return null;

  const isCritical = status === 'down';
  const Icon = isCritical ? AlertTriangle : Loader2;
  const message = isCritical
    ? 'Session start may be delayed due to system issue'
    : 'Reconnecting to billing system...';

  return (
    <div className="px-4 pt-3">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-2.5 px-4 py-2 text-xs font-medium rounded-xl border backdrop-blur-sm shadow-sm transition-all',
          isCritical
            ? 'bg-destructive/10 text-destructive border-destructive/30 shadow-destructive/10'
            : 'bg-warning/10 text-warning border-warning/30 shadow-warning/10',
        )}
      >
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full shrink-0',
            isCritical ? 'bg-destructive/15' : 'bg-warning/15',
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', !isCritical && 'animate-spin')} />
        </span>
        <span className="flex-1 truncate">{message}</span>
        <button
          type="button"
          onClick={() => setDismissed(status)}
          aria-label="Dismiss"
          className="rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-foreground/5 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default ManagerBillingBanner;
