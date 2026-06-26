import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuthStore } from '@/shared/lib/store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type BillingSystemStatus = 'operational' | 'delay' | 'issue';

const STATUS_META: Record<BillingSystemStatus, { label: string; dot: string; ring: string; pulse: boolean }> = {
  operational: {
    label: 'All systems operational',
    dot: 'bg-success',
    ring: 'ring-success/30',
    pulse: false,
  },
  delay: {
    label: 'Billing delay detected',
    dot: 'bg-warning',
    ring: 'ring-warning/30',
    pulse: true,
  },
  issue: {
    label: 'Billing issue',
    dot: 'bg-destructive',
    ring: 'ring-destructive/30',
    pulse: true,
  },
};

/**
 * Global billing system status indicator shown in the top navbar.
 * - Super Admins: click opens the E2Link panel in Settings.
 * - Other roles: tooltip-only ("Billing system status").
 *
 * Status updates in real-time via a lightweight polling simulation.
 * Replace `useBillingStatusPoll` with a real subscription when wired to backend.
 */
function useBillingStatusPoll(): BillingSystemStatus {
  const [status, setStatus] = useState<BillingSystemStatus>('operational');

  useEffect(() => {
    // Simulated real-time updates. Weighted toward "operational".
    const pickStatus = (): BillingSystemStatus => {
      const r = Math.random();
      if (r < 0.8) return 'operational';
      if (r < 0.95) return 'delay';
      return 'issue';
    };
    const id = setInterval(() => setStatus(pickStatus()), 15000);
    return () => clearInterval(id);
  }, []);

  return status;
}

export function BillingStatusIndicator() {
  const status = useBillingStatusPoll();
  const meta = STATUS_META[status];
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  const tooltipText = isSuperAdmin
    ? `Billing system: ${meta.label} — click to open E2Link`
    : 'Billing system status';

  const handleClick = () => {
    if (!isSuperAdmin) return;
    navigate('/settings#integrations');
  };

  const dot = (
    <span className="relative inline-flex items-center justify-center">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full ring-4 transition-colors',
          meta.dot,
          meta.ring,
        )}
      />
      {meta.pulse && (
        <span
          className={cn(
            'absolute inline-flex h-2.5 w-2.5 rounded-full opacity-60 animate-ping',
            meta.dot,
          )}
        />
      )}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            disabled={!isSuperAdmin}
            aria-label={tooltipText}
            className={cn(
              'h-9 gap-2 px-2 text-muted-foreground hover:text-foreground',
              !isSuperAdmin && 'cursor-default opacity-100 disabled:opacity-100',
            )}
          >
            <Activity className="h-4 w-4" />
            {dot}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="text-xs">{tooltipText}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default BillingStatusIndicator;
