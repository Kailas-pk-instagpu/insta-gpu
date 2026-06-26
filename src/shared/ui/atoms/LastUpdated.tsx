import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LastUpdatedProps {
  timestamp: Date | null;
  className?: string;
  prefix?: string;
}

function formatRelative(from: Date, now: number): string {
  const diff = Math.max(0, Math.floor((now - from.getTime()) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * Renders a "Last updated" pill that ticks every second so the relative time
 * stays accurate without needing the parent to re-render.
 */
export default function LastUpdated({ timestamp, className, prefix = 'Last updated' }: LastUpdatedProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timestamp) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[11px] text-muted-foreground',
          className,
        )}
      >
        <Clock className="h-3 w-3" />
        {prefix} —
      </span>
    );
  }

  const relative = formatRelative(timestamp, now);
  const absolute = timestamp.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
  const isFresh = now - timestamp.getTime() < 2000;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors',
        isFresh && 'text-success',
        className,
      )}
      title={absolute}
    >
      <Clock className={cn('h-3 w-3', isFresh && 'animate-pulse')} />
      <span className="tabular-nums">
        {prefix} <span className="font-medium">{relative}</span>
      </span>
    </span>
  );
}
