import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BillingStatus = 'operational' | 'delayed' | 'issue';

const STATUS_META: Record<
  BillingStatus,
  { label: string; message: string; icon: typeof CheckCircle2; chip: string; ring: string }
> = {
  operational: {
    label: 'Operational',
    message: 'Billing system is running smoothly.',
    icon: CheckCircle2,
    chip: 'bg-success/10 text-success border-success/20',
    ring: 'ring-success/20',
  },
  delayed: {
    label: 'Delayed',
    message: 'Billing system is experiencing delays. Sessions will continue normally.',
    icon: Clock,
    chip: 'bg-warning/10 text-warning border-warning/20',
    ring: 'ring-warning/20',
  },
  issue: {
    label: 'Issue',
    message: 'Billing service is temporarily unavailable. Sessions will continue normally.',
    icon: AlertTriangle,
    chip: 'bg-destructive/10 text-destructive border-destructive/20',
    ring: 'ring-destructive/20',
  },
};

/**
 * Owner-facing billing status banner.
 * Intentionally hides API/sync/technical detail — owners only see plain-language status.
 */
function useBillingStatus(): BillingStatus {
  const [status, setStatus] = useState<BillingStatus>('operational');
  useEffect(() => {
    const pick = (): BillingStatus => {
      const r = Math.random();
      if (r < 0.8) return 'operational';
      if (r < 0.95) return 'delayed';
      return 'issue';
    };
    const id = setInterval(() => setStatus(pick()), 20000);
    return () => clearInterval(id);
  }, []);
  return status;
}

interface BillingStatusBannerProps {
  /** Override the live status (useful for testing). */
  status?: BillingStatus;
  className?: string;
}

export function BillingStatusBanner({ status: override, className }: BillingStatusBannerProps) {
  const live = useBillingStatus();
  const status = override ?? live;
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  // Operational: render a quiet inline pill so it stays non-intrusive.
  if (status === 'operational') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
          meta.chip,
          className,
        )}
        role="status"
        aria-label="Billing system status"
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="font-medium">Billing system: {meta.label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Billing system status"
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-card px-4 py-3 ring-1',
        meta.ring,
        className,
      )}
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.chip)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">Billing system status</span>
        </div>
        <p className="text-sm text-foreground/90 mt-1 leading-snug">{meta.message}</p>
      </div>
    </div>
  );
}

export default BillingStatusBanner;
