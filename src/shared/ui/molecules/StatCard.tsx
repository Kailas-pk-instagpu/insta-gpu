import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
  iconClassName?: string;
}

/**
 * Parse the first numeric run out of a string/number.
 * Returns { prefix, num, suffix } so we can tween only the number portion
 * (e.g. "RM 138,400" → prefix "RM ", num 138400, suffix "").
 */
function splitValue(v: string | number): { prefix: string; num: number | null; suffix: string; hasCommas: boolean; decimals: number } {
  const str = String(v);
  const match = str.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match) return { prefix: str, num: null, suffix: '', hasCommas: false, decimals: 0 };
  const raw = match[0];
  const prefix = str.slice(0, match.index);
  const suffix = str.slice((match.index ?? 0) + raw.length);
  const hasCommas = raw.includes(',');
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  const num = Number(raw.replace(/,/g, ''));
  return { prefix, num, suffix, hasCommas, decimals };
}

function formatNum(n: number, hasCommas: boolean, decimals: number): string {
  const fixed = n.toFixed(decimals);
  if (!hasCommas) return fixed;
  const [whole, dec] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${withCommas}.${dec}` : withCommas;
}

function useAnimatedValue(value: string | number) {
  const parsed = splitValue(value);
  const [display, setDisplay] = useState<string>(String(value));
  const [pulseKey, setPulseKey] = useState(0);
  const prevRef = useRef<string>(String(value));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const next = String(value);
    if (next === prevRef.current) return;

    const prevParsed = splitValue(prevRef.current);
    prevRef.current = next;

    // Trigger card flash + value pop on every change.
    setPulseKey(k => k + 1);

    // If both prev and next have numeric portions and same formatting shape, tween.
    const canTween =
      prevParsed.num !== null &&
      parsed.num !== null &&
      prevParsed.prefix === parsed.prefix &&
      prevParsed.suffix === parsed.suffix;

    if (canTween && prevParsed.num !== parsed.num) {
      const from = prevParsed.num!;
      const to = parsed.num!;

      const start = performance.now();
      const duration = 650;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const current = from + (to - from) * eased;
        setDisplay(`${parsed.prefix}${formatNum(current, parsed.hasCommas, parsed.decimals)}${parsed.suffix}`);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setDisplay(next);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { display, pulseKey };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  const { display, pulseKey } = useAnimatedValue(value);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm',
        'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      {/* Flash overlay re-keyed on each value change */}
      <div key={`flash-${pulseKey}`} className="pointer-events-none absolute inset-0 rounded-[inherit] kpi-card-flash" />
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className={cn(
              'p-2 sm:p-2.5 rounded-xl shrink-0 flex items-center justify-center ring-1 ring-inset ring-border/40',
              iconClassName || 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          {trend && (
            <span
              className={cn(
                'text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
                trend.positive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground font-medium leading-tight">
            {title}
          </p>
            <div className="relative">
            <p className="text-xl sm:text-2xl lg:text-[1.6rem] font-bold tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              <span key={`val-${pulseKey}`} className="kpi-value-pop">
                {display}
              </span>
            </p>
          </div>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
