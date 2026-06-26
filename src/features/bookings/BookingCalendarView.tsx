import { useMemo, useState } from 'react';
import { Booking, MOCK_BRANCHES } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Monitor, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  bookings: Booking[];
  branchFilter: string;
  onSlotClick?: (date: string, startTime: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

const STATUS_COLORS: Record<Booking['status'], string> = {
  upcoming: 'bg-primary/80 border-primary text-primary-foreground',
  completed: 'bg-muted border-muted-foreground/30 text-muted-foreground',
  cancelled: 'bg-destructive/30 border-destructive/50 text-destructive-foreground line-through',
  no_show: 'bg-accent border-accent-foreground/30 text-accent-foreground',
};

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function timeToHour(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

export default function BookingCalendarView({ bookings, branchFilter, onSlotClick }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const viewDays = viewMode === 'week' ? weekDays : [currentDate];

  const navigate = (dir: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + (viewMode === 'week' ? dir * 7 : dir));
    setCurrentDate(next);
  };

  const goToday = () => setCurrentDate(new Date());

  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    const filtered = bookings.filter(b => b.status === 'upcoming' || b.status === 'completed');
    for (const b of filtered) {
      if (branchFilter !== 'all' && b.branchId !== branchFilter) continue;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [bookings, branchFilter]);

  const headerLabel = viewMode === 'week'
    ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const todayKey = formatDateKey(new Date());

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold">Calendar View</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'day')}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToday}>Today</Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium min-w-[180px] text-center">{headerLabel}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid border-b border-border" style={{ gridTemplateColumns: `60px repeat(${viewDays.length}, 1fr)` }}>
              <div className="p-2 text-xs text-muted-foreground border-r border-border" />
              {viewDays.map(day => {
                const key = formatDateKey(day);
                const isToday = key === todayKey;
                const dayBookings = bookingsByDay[key] || [];
                return (
                  <div key={key} className={cn("p-2 text-center border-r border-border last:border-r-0", isToday && "bg-primary/5")}>
                    <p className="text-xs text-muted-foreground">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className={cn("text-sm font-semibold", isToday && "text-primary")}>{day.getDate()}</p>
                    {dayBookings.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">
                        {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="relative">
              {HOURS.map(hour => (
                <div key={hour} className="grid border-b border-border/50" style={{ gridTemplateColumns: `60px repeat(${viewDays.length}, 1fr)`, height: '52px' }}>
                  <div className="p-1 text-[10px] text-muted-foreground border-r border-border flex items-start justify-end pr-2 pt-0.5">
                    {hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                  </div>
                  {viewDays.map(day => {
                    const key = formatDateKey(day);
                    const isToday = key === todayKey;
                    const timeStr = `${String(hour).padStart(2, '0')}:00`;
                    return (
                      <div
                        key={key}
                        onClick={() => onSlotClick?.(key, timeStr)}
                        className={cn(
                          "border-r border-border/30 last:border-r-0 relative transition-colors",
                          isToday && "bg-primary/[0.02]",
                          onSlotClick && "cursor-pointer hover:bg-primary/10"
                        )}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Booking blocks overlay */}
              <TooltipProvider delayDuration={200}>
                <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `60px repeat(${viewDays.length}, 1fr)` }}>
                  <div /> {/* spacer for time column */}
                  {viewDays.map((day, dayIdx) => {
                    const key = formatDateKey(day);
                    const dayBookings = bookingsByDay[key] || [];
                    return (
                      <div key={key} className="relative">
                        {dayBookings.map(booking => {
                          const startHour = timeToHour(booking.startTime);
                          const endHour = timeToHour(booking.endTime);
                          const top = (startHour - 7) * 52;
                          const height = Math.max((endHour - startHour) * 52, 20);
                          const branchName = MOCK_BRANCHES.find(b => b.id === booking.branchId)?.name || '';

                          return (
                            <Tooltip key={booking.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'absolute left-0.5 right-0.5 rounded-md border px-1.5 py-0.5 cursor-pointer transition-opacity hover:opacity-90 overflow-hidden z-10 pointer-events-auto',
                                    STATUS_COLORS[booking.status]
                                  )}
                                  style={{ top: `${top}px`, height: `${height}px` }}
                                >
                                  <p className="text-[10px] font-semibold truncate leading-tight">{booking.customerName}</p>
                                  <p className="text-[9px] truncate leading-tight opacity-80 flex items-center gap-0.5">
                                    <Monitor className="h-2.5 w-2.5 inline shrink-0" /> Seat #{booking.seatNumber} • {branchName}
                                  </p>
                                  {height > 40 && (
                                    <p className="text-[9px] truncate leading-tight opacity-70 flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5 inline shrink-0" /> {booking.startTime} – {booking.endTime}
                                    </p>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[220px]">
                                <div className="space-y-1">
                                  <p className="font-semibold text-sm flex items-center gap-1"><User className="h-3 w-3" />{booking.customerName}</p>
                                  <p className="text-xs text-muted-foreground">{booking.customerPhone}</p>
                                  <p className="text-xs"><Monitor className="h-3 w-3 inline mr-1" />Seat #{booking.seatNumber} — {branchName}</p>
                                  <p className="text-xs"><Clock className="h-3 w-3 inline mr-1" />{booking.startTime} – {booking.endTime}</p>
                                  {booking.gpuPreference && <p className="text-xs">GPU: {booking.gpuPreference}</p>}
                                  {booking.notes && <p className="text-xs italic">"{booking.notes}"</p>}
                                  <Badge variant={booking.status === 'upcoming' ? 'default' : 'secondary'} className="text-[10px]">{booking.status}</Badge>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
