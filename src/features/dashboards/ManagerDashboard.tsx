import { useState } from 'react';
import { MOCK_SEATS, MOCK_BRANCHES, REVENUE_DATA } from '@/shared/lib/mock-data';
import { Seat } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, Monitor, Users, Clock, RotateCcw, UserCheck, UserMinus, TrendingUp, AlertCircle, Zap, Timer } from 'lucide-react';
import { StatCard } from '@/shared/ui/molecules/StatCard';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const HOURLY_SESSIONS = [
  { hour: '9AM', sessions: 4 }, { hour: '10AM', sessions: 8 }, { hour: '11AM', sessions: 12 },
  { hour: '12PM', sessions: 15 }, { hour: '1PM', sessions: 18 }, { hour: '2PM', sessions: 16 },
  { hour: '3PM', sessions: 20 }, { hour: '4PM', sessions: 22 }, { hour: '5PM', sessions: 19 },
  { hour: '6PM', sessions: 14 },
];

const RECENT_ACTIVITY = [
  { action: 'Checked in', player: 'John D.', seat: 3, time: '2 min ago', type: 'checkin' },
  { action: 'Checked out', player: 'Sarah M.', seat: 7, time: '15 min ago', type: 'checkout' },
  { action: 'Seat restarted', player: '', seat: 15, time: '30 min ago', type: 'restart' },
  { action: 'Checked in', player: 'Mike T.', seat: 1, time: '45 min ago', type: 'checkin' },
  { action: 'Maintenance flagged', player: '', seat: 20, time: '1h ago', type: 'maintenance' },
];

export default function ManagerDashboard() {
  const [seats, setSeats] = useState<Seat[]>(MOCK_SEATS.filter(s => s.branchId === 'branch-1'));
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [dialogMode, setDialogMode] = useState<'checkin' | 'checkout' | 'restart' | null>(null);
  const [playerName, setPlayerName] = useState('');

  const occupied = seats.filter(s => s.status === 'occupied').length;
  const available = seats.filter(s => s.status === 'available').length;
  const maintenance = seats.filter(s => s.status === 'maintenance').length;
  const todayEarnings = REVENUE_DATA[5].revenue;
  const totalSessions = REVENUE_DATA.reduce((a, b) => a + b.sessions, 0);
  const branch = MOCK_BRANCHES.find(b => b.id === 'branch-1');

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
    if (seat.status === 'available') setDialogMode('checkin');
    else if (seat.status === 'occupied') setDialogMode('checkout');
    else setDialogMode('restart');
  };

  const handleCheckIn = () => {
    if (!selectedSeat || !playerName.trim()) return;
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'occupied' as const, playerName: playerName.trim(), startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : s
    ));
    closeDialog();
  };

  const handleCheckOut = () => {
    if (!selectedSeat) return;
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'available' as const, playerName: undefined, startTime: undefined } : s
    ));
    closeDialog();
  };

  const handleRestart = () => {
    if (!selectedSeat) return;
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'available' as const } : s
    ));
    closeDialog();
  };

  const closeDialog = () => {
    setSelectedSeat(null);
    setDialogMode(null);
    setPlayerName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Floor Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage players and seats at {branch?.name || 'your branch'}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Clock className="h-3.5 w-3.5" />
          <span>Shift: 9:00 AM - 9:00 PM</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard title="Today's Earnings" value={`RM ${todayEarnings}`} icon={Banknote} iconClassName="bg-success/10 text-success" />
        <StatCard title="Occupied" value={occupied} subtitle={`of ${seats.length}`} icon={Users} iconClassName="bg-destructive/10 text-destructive" />
        <StatCard title="Available" value={available} icon={Monitor} iconClassName="bg-success/10 text-success" />
        <StatCard title="Maintenance" value={maintenance} icon={AlertCircle} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Sessions Today" value={totalSessions} icon={Zap} iconClassName="bg-info/10 text-info" />
        <StatCard title="Avg Duration" value="2.1 hrs" icon={Timer} iconClassName="bg-primary/10 text-primary" />
      </div>

      {/* Seat Map */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-semibold">Seat Map — Tap a seat to manage</CardTitle>
              <CardDescription>Click on any seat to check in/out players or restart</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive" /> Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning" /> Maintenance</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-2">
            {seats.map(seat => (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                className={cn(
                  'aspect-square min-h-[72px] sm:min-h-0 rounded-xl flex flex-col items-center justify-center gap-1 sm:gap-0.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 border-2 touch-manipulation',
                  seat.status === 'available' && 'bg-success/10 border-success/30 text-success hover:bg-success/20',
                  seat.status === 'occupied' && 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20',
                  seat.status === 'maintenance' && 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20',
                )}
              >
                <Monitor className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="font-bold text-sm sm:text-xs">{seat.number}</span>
                {seat.playerName && (
                  <span className="text-[10px] truncate max-w-full px-1">{seat.playerName}</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hourly Sessions + Recent Activity + Shift Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Hourly Sessions</CardTitle>
            <CardDescription>Session starts throughout today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_SESSIONS}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest floor actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 sm:space-y-2">
            {RECENT_ACTIVITY.map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-3 sm:p-2 rounded-lg bg-muted/50">
                <span className={cn(
                  'w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0',
                  log.type === 'checkin' && 'bg-success',
                  log.type === 'checkout' && 'bg-info',
                  log.type === 'restart' && 'bg-warning',
                  log.type === 'maintenance' && 'bg-destructive',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.action}</span>
                    {log.player && <span className="text-muted-foreground"> · {log.player}</span>}
                    <span className="text-muted-foreground"> · Seat {log.seat}</span>
                  </p>
                </div>
                <span className="text-[11px] sm:text-[10px] text-muted-foreground whitespace-nowrap">{log.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Shift Summary</CardTitle>
            <CardDescription>Your current shift overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 sm:space-y-3">
            {[
              { label: 'Total Check-ins', value: '42', icon: '✅' },
              { label: 'Total Check-outs', value: '28', icon: '🚪' },
              { label: 'Revenue Collected', value: `RM ${todayEarnings}`, icon: '💰' },
              { label: 'Avg Wait Time', value: '3 min', icon: '⏱️' },
              { label: 'Issues Reported', value: '2', icon: '⚠️' },
              { label: 'Customer Complaints', value: '0', icon: '😊' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 sm:p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Weekly Performance</CardTitle>
          <CardDescription>Revenue and sessions this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `RM ${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-success rounded" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary rounded" /> Sessions</span>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={dialogMode !== null} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          {dialogMode === 'checkin' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-success" />
                  Check In Player — Seat {selectedSeat?.number}
                </DialogTitle>
                <DialogDescription>Assign a player to this seat to start their session</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label>Player Name</Label>
                  <Input placeholder="Enter player's name" value={playerName} onChange={e => setPlayerName(e.target.value)} autoFocus />
                </div>
                <p className="text-xs text-muted-foreground">GPU: {selectedSeat?.gpuModel}</p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="lg" onClick={closeDialog} className="sm:size-default">Cancel</Button>
                <Button size="lg" onClick={handleCheckIn} disabled={!playerName.trim()} className="bg-success text-success-foreground hover:bg-success/90 sm:size-default">Check In</Button>
              </DialogFooter>
            </>
          )}
          {dialogMode === 'checkout' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserMinus className="h-5 w-5 text-destructive" />
                  Check Out — Seat {selectedSeat?.number}
                </DialogTitle>
                <DialogDescription>End the session for {selectedSeat?.playerName}</DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm"><strong>Player:</strong> {selectedSeat?.playerName}</p>
                  <p className="text-sm"><strong>Started:</strong> {selectedSeat?.startTime}</p>
                  <p className="text-sm"><strong>GPU:</strong> {selectedSeat?.gpuModel}</p>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="lg" onClick={closeDialog} className="sm:size-default">Cancel</Button>
                <Button size="lg" onClick={handleCheckOut} variant="destructive" className="sm:size-default">End Session</Button>
              </DialogFooter>
            </>
          )}
          {dialogMode === 'restart' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-warning" />
                  Restart Seat {selectedSeat?.number}
                </DialogTitle>
                <DialogDescription>This will clear the maintenance status and make the seat available</DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="lg" onClick={closeDialog} className="sm:size-default">Cancel</Button>
                <Button size="lg" onClick={handleRestart} className="bg-warning text-warning-foreground hover:bg-warning/90 sm:size-default">Restart</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
