import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/shared/lib/store';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  INTEGRATIONS,
  STATUS_META,
  aggregateStatus,
  useIntegrationStatuses,
} from '@/shared/lib/integrationsStatus';

/**
 * Global integrations health indicator shown in the top navbar.
 *
 * Replaces the legacy single-purpose BillingStatusIndicator.
 * - Aggregates the status of every entry in INTEGRATIONS into a single dot.
 * - Click opens a popover listing per-integration status.
 * - Super Admins can jump directly to the corresponding Settings panel.
 */
export function IntegrationsStatusIndicator() {
  const statuses = useIntegrationStatuses();
  const overall = aggregateStatus(statuses);
  const meta = STATUS_META[overall];
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  const canView = isSuperAdmin || user?.role === 'admin';
  if (!canView) return null;

  const summaryLabel =
    overall === 'operational'
      ? 'All integrations operational'
      : overall === 'delay'
        ? 'One or more integrations delayed'
        : 'Integration issue detected';

  const handleOpenIntegration = (hash: string) => {
    if (!isSuperAdmin) return;
    navigate(`/settings#${hash}`);
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={summaryLabel}
          className="h-9 gap-2 px-2 text-muted-foreground hover:text-foreground"
        >
          <Activity className="h-4 w-4" />
          {dot}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Integrations</p>
            <p className={cn('text-xs mt-0.5', meta.text)}>{summaryLabel}</p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
              overall === 'operational' && 'bg-success/10 text-success border-success/20',
              overall === 'delay' && 'bg-warning/10 text-warning border-warning/20',
              overall === 'issue' && 'bg-destructive/10 text-destructive border-destructive/20',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </span>
        </div>
        <Separator />
        <ul className="py-1 max-h-80 overflow-y-auto">
          {INTEGRATIONS.map((integration) => {
            const status = statuses[integration.id] ?? 'operational';
            const sMeta = STATUS_META[status];
            const Icon = integration.icon;
            const Tag: 'button' | 'div' = isSuperAdmin ? 'button' : 'div';
            return (
              <li key={integration.id}>
                <Tag
                  {...(isSuperAdmin
                    ? {
                        type: 'button' as const,
                        onClick: () => handleOpenIntegration(integration.settingsHash),
                      }
                    : {})}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    isSuperAdmin && 'hover:bg-muted/60 cursor-pointer',
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground/80">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{integration.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {integration.description}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="relative inline-flex items-center justify-center">
                      <span className={cn('h-2 w-2 rounded-full ring-4', sMeta.dot, sMeta.ring)} />
                      {sMeta.pulse && (
                        <span className={cn('absolute inline-flex h-2 w-2 rounded-full opacity-60 animate-ping', sMeta.dot)} />
                      )}
                    </span>
                    <span className={cn('text-[11px] font-medium', sMeta.text)}>
                      {sMeta.label}
                    </span>
                    {isSuperAdmin && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>
                </Tag>
              </li>
            );
          })}
        </ul>
        {!isSuperAdmin && (
          <>
            <Separator />
            <p className="px-4 py-2 text-[11px] text-muted-foreground">
              Read-only · contact your Super Admin to manage integrations.
            </p>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default IntegrationsStatusIndicator;
