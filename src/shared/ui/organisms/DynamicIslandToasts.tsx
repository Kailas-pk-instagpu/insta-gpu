import { memo, useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useNotificationStore } from '@/shared/lib/store';

type ToastNotification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
};

const TYPE_ICON = {
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  success: <CheckCircle className="h-4 w-4 text-success" />,
  info: <Info className="h-4 w-4 text-info" />,
} as const;

const TYPE_BG = {
  error: 'bg-destructive/15',
  warning: 'bg-warning/15',
  success: 'bg-success/15',
  info: 'bg-info/15',
} as const;

const AUTO_DISMISS_MS = 5000;

interface Props {
  anchorRef: RefObject<HTMLElement>;
  onCollapse?: () => void;
}

interface ToastItemProps {
  toast: ToastNotification;
  reduceMotion: boolean;
  onDismiss: (id: string) => void;
}

// Memoized toast item — prevents re-render of existing toasts when stack updates
const ToastItem = memo(function ToastItem({ toast, reduceMotion, onDismiss }: ToastItemProps) {
  const handleDismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  // Reduced-motion path: simple fade, no spring, no blur, no transform animation
  const initial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.6, y: -16 };
  const animate = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0 };
  const exit = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.6, y: -16 };
  const transition = reduceMotion
    ? { duration: 0.15 }
    : { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.7, opacity: { duration: 0.16 } };

  return (
    <motion.div
      layout="position"
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      style={{ transformOrigin: 'top right', willChange: 'transform, opacity' }}
      className="pointer-events-auto relative isolate overflow-hidden rounded-[22px] border border-primary/25 bg-gradient-to-br from-primary/10 via-background/85 to-background/80 px-3.5 py-3 ring-1 ring-inset ring-white/5 backdrop-blur-2xl backdrop-saturate-150 [transform:translateZ(0)]"
    >
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TYPE_BG[toast.type]}`}>
          {TYPE_ICON[toast.type]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{toast.title}</p>
            <span className="shrink-0 text-[10px] text-muted-foreground">{toast.timestamp}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">{toast.message}</p>
        </div>
        <button
          aria-label="Dismiss notification"
          onClick={handleDismiss}
          className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
});

export function DynamicIslandToasts({ anchorRef, onCollapse }: Props) {
  const lastIncoming = useNotificationStore((s) => s.lastIncoming);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [anchor, setAnchor] = useState<{ x: number; y: number; vw: number } | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const reduceMotion = useReducedMotion() ?? false;

  // Measure anchor: rAF-throttled, ResizeObserver-driven, no scroll spam
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;

    let rafId = 0;
    let lastX = -1;
    let lastY = -1;
    let lastVw = -1;

    const measure = () => {
      rafId = 0;
      const node = anchorRef.current;
      if (!node) return;
      const r = node.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      // Skip state update if nothing changed — prevents render thrash
      if (r.right === lastX && r.bottom === lastY && vw === lastVw) return;
      lastX = r.right;
      lastY = r.bottom;
      lastVw = vw;
      setAnchor({ x: r.right, y: r.bottom, vw });
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(measure);
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    ro.observe(document.documentElement);

    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true, capture: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [anchorRef]);

  // Push incoming notification onto the stack
  useEffect(() => {
    if (!lastIncoming) return;
    if (seenRef.current.has(lastIncoming.id)) return;
    seenRef.current.add(lastIncoming.id);
    const t: ToastNotification = {
      id: lastIncoming.id,
      title: lastIncoming.title,
      message: lastIncoming.message,
      type: lastIncoming.type,
      timestamp: lastIncoming.timestamp,
    };
    setToasts((cur) => [...cur, t]);
    const timer = window.setTimeout(() => {
      setToasts((cur) => cur.filter((x) => x.id !== t.id));
      onCollapse?.();
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [lastIncoming, onCollapse]);

  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((x) => x.id !== id));
    onCollapse?.();
  }, [onCollapse]);

  if (!anchor) return null;

  const right = Math.max(8, anchor.vw - anchor.x);
  const top = anchor.y + 8;
  const maxWidth = Math.min(340, anchor.vw - right - 8);

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed z-[60] flex flex-col gap-2 [contain:layout_paint] [transform:translateZ(0)]"
      style={{ top, right, width: maxWidth }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} reduceMotion={reduceMotion} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
