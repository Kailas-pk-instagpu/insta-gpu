import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  online: 'bg-success/10 text-success border-success/20',
  active: 'bg-success/10 text-success border-success/20',
  available: 'bg-success/10 text-success border-success/20',
  occupied: 'bg-destructive/10 text-destructive border-destructive/20',
  offline: 'bg-muted text-muted-foreground border-muted',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
  healthy: 'bg-success/10 text-success border-success/20',
  degraded: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('capitalize font-medium', STATUS_STYLES[status] || '', className)}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        status === 'online' || status === 'active' || status === 'available' || status === 'healthy' ? 'bg-success' :
        status === 'occupied' || status === 'overloaded' || status === 'critical' ? 'bg-destructive' :
        status === 'warning' || status === 'maintenance' || status === 'degraded' ? 'bg-warning' : 'bg-muted-foreground'
      )} />
      {status}
    </Badge>
  );
}
