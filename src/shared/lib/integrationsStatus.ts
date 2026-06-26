import { useEffect, useState } from 'react';
import { CreditCard, Server, type LucideIcon } from 'lucide-react';

/**
 * Generic integration health status used across the app.
 * Keep this list extensible — add new third-party integrations to INTEGRATIONS
 * and they will automatically appear in the navbar status indicator.
 */
export type IntegrationStatus = 'operational' | 'delay' | 'issue';

export interface IntegrationDefinition {
  id: string;
  /** Short display name (e.g. "E2Link Billing"). */
  name: string;
  /** Optional one-liner used in tooltips / popovers. */
  description: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Settings deep-link hash, e.g. `integrations/horizon`. */
  settingsHash: string;
  /** Weight used when computing the aggregate — heavier wins on ties. */
  weight?: number;
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'e2link',
    name: 'E2Link Billing',
    description: 'Session billing & settlement API',
    icon: CreditCard,
    settingsHash: 'integrations/e2link',
    weight: 1,
  },
  {
    id: 'horizon',
    name: 'VMware Horizon',
    description: 'GPU desktop pool orchestration',
    icon: Server,
    settingsHash: 'integrations/horizon',
    weight: 1,
  },
];

const STATUS_RANK: Record<IntegrationStatus, number> = {
  operational: 0,
  delay: 1,
  issue: 2,
};

export function aggregateStatus(
  map: Record<string, IntegrationStatus>,
): IntegrationStatus {
  let worst: IntegrationStatus = 'operational';
  for (const s of Object.values(map)) {
    if (STATUS_RANK[s] > STATUS_RANK[worst]) worst = s;
  }
  return worst;
}

/**
 * Simulated real-time poll for every registered integration.
 * Replace with a real subscription / query when wired to the backend.
 */
export function useIntegrationStatuses(): Record<string, IntegrationStatus> {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>(
    () => Object.fromEntries(INTEGRATIONS.map(i => [i.id, 'operational' as IntegrationStatus])),
  );

  useEffect(() => {
    const pick = (): IntegrationStatus => {
      const r = Math.random();
      if (r < 0.82) return 'operational';
      if (r < 0.95) return 'delay';
      return 'issue';
    };
    const id = setInterval(() => {
      setStatuses(prev => {
        const next = { ...prev };
        // Update a single random integration each tick to feel "live".
        const target = INTEGRATIONS[Math.floor(Math.random() * INTEGRATIONS.length)];
        next[target.id] = pick();
        return next;
      });
    }, 12000);
    return () => clearInterval(id);
  }, []);

  return statuses;
}

export const STATUS_META: Record<
  IntegrationStatus,
  { label: string; dot: string; ring: string; text: string; pulse: boolean }
> = {
  operational: {
    label: 'Operational',
    dot: 'bg-success',
    ring: 'ring-success/30',
    text: 'text-success',
    pulse: false,
  },
  delay: {
    label: 'Delayed',
    dot: 'bg-warning',
    ring: 'ring-warning/30',
    text: 'text-warning',
    pulse: true,
  },
  issue: {
    label: 'Issue',
    dot: 'bg-destructive',
    ring: 'ring-destructive/30',
    text: 'text-destructive',
    pulse: true,
  },
};
