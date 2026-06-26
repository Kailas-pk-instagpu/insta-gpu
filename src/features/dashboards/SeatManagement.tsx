import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_SEATS, MOCK_BRANCHES, MOCK_CUSTOMER_WALLETS, Booking } from '@/shared/lib/mock-data';
import { Seat } from '@/shared/lib/mock-data';
import { useAuthStore, useBookingStore, useSettlementStore } from '@/shared/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, RotateCcw, UserCheck, UserMinus, CalendarCheck, Clock, TimerReset, Wallet, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { EndSessionConfirmDialog } from '@/features/billing/EndSessionConfirmDialog';

const LOW_BALANCE_THRESHOLD = 150; // RM — flag wallets at/below this

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function SeatManagement() {
  const [seats, setSeats] = useState<Seat[]>(MOCK_SEATS.filter(s => s.branchId === 'branch-1'));
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [dialogMode, setDialogMode] = useState<'checkin' | 'checkout' | 'restart' | 'extend' | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [extendMinutes, setExtendMinutes] = useState('30');
  const { bookings } = useBookingStore();
  const { user } = useAuthStore();
  const addSettlement = useSettlementStore((s) => s.addSettlement);
  const navigate = useNavigate();
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [walletSyncing, setWalletSyncing] = useState(false);
  const [walletSyncedAt, setWalletSyncedAt] = useState<string | null>(null);

  const handleWalletSync = async () => {
    if (walletSyncing || !seatWallet) return;
    setWalletSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setWalletSyncedAt(getCurrentTime());
      toast.success('Wallet synced', {
        description: `${seatWallet.name}'s balance is up to date.`,
      });
    } finally {
      setWalletSyncing(false);
    }
  };

  const seatWallet = useMemo(() => {
    if (!selectedSeat?.playerName) return undefined;
    const branchCustomers = MOCK_CUSTOMER_WALLETS.filter(c => c.branchId === selectedSeat.branchId);
    const name = selectedSeat.playerName.toLowerCase();
    return (
      branchCustomers.find(c => c.name.toLowerCase() === name) ||
      branchCustomers.find(c => c.name.toLowerCase().split(' ')[0] === name.split(' ')[0]) ||
      branchCustomers[0]
    );
  }, [selectedSeat]);
  const remaining = seatWallet ? seatWallet.balance - seatWallet.lockedAmount : 0;
  const isLowBalance = seatWallet ? remaining <= LOW_BALANCE_THRESHOLD : false;

  const branch = MOCK_BRANCHES.find(b => b.id === 'branch-1');

  // Compute end-session totals for the currently-selected occupied seat
  const sessionTotals = useMemo(() => {
    if (!selectedSeat || selectedSeat.status !== 'occupied' || !selectedSeat.startTime) {
      return { durationSec: 0, usageCost: 0, refund: 0, lockedAmount: 0 };
    }
    const [sh, sm] = selectedSeat.startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(sh, sm, 0, 0);
    const durationSec = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
    const costPerMinute = branch?.billing.costPerMinute ?? 0;
    const lockedAmount = seatWallet?.lockedAmount ?? branch?.billing.lockedAmount ?? 0;
    const usageCost = Math.min(lockedAmount, +(durationSec / 60 * costPerMinute).toFixed(2));
    const refund = +(lockedAmount - usageCost).toFixed(2);
    return { durationSec, usageCost, refund, lockedAmount };
  }, [selectedSeat, branch, seatWallet, confirmEndOpen]);

  const bookedSeatMap = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const map = new Map<number, Booking>();
    bookings
      .filter(b => b.branchId === 'branch-1' && b.status === 'upcoming' && b.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .forEach(b => {
        if (!map.has(b.seatNumber)) map.set(b.seatNumber, b);
      });
    return map;
  }, [bookings]);

  const occupied = seats.filter(s => s.status === 'occupied').length;
  const available = seats.filter(s => s.status === 'available').length;
  const maintenance = seats.filter(s => s.status === 'maintenance').length;
  const booked = seats.filter(s => s.status === 'available' && bookedSeatMap.has(s.number)).length;

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
    if (seat.status === 'available') setDialogMode('checkin');
    else if (seat.status === 'occupied') setDialogMode('checkout');
    else setDialogMode('restart');
  };

  const handleCheckIn = () => {
    if (!selectedSeat || !playerName.trim()) return;
    const duration = parseInt(sessionDuration) || 60;
    const now = getCurrentTime();
    const end = addMinutesToTime(now, duration);
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'occupied' as const, playerName: playerName.trim(), startTime: now, endTime: end } : s
    ));
    closeDialog();
  };

  const handleCheckOut = () => {
    if (!selectedSeat) return;
    // Redirect to the billing page for this customer; settlement happens there.
    if (seatWallet) {
      navigate(`/billing/session?branchId=${seatWallet.branchId}&customerId=${seatWallet.id}`);
    } else {
      navigate('/billing/session');
    }
    closeDialog();
  };

  const handleConfirmEndSession = () => {
    if (!selectedSeat || !branch) return;
    // Record settlement if a wallet is matched and current user can settle
    if (seatWallet && user && (user.role === 'cafe_owner' || user.role === 'manager')) {
      const startIso = (() => {
        if (!selectedSeat.startTime) return new Date().toISOString();
        const [sh, sm] = selectedSeat.startTime.split(':').map(Number);
        const d = new Date();
        d.setHours(sh, sm, 0, 0);
        return d.toISOString();
      })();
      addSettlement({
        sessionId: `seat-${selectedSeat.id}-${Date.now()}`,
        branchId: branch.id,
        branchName: branch.name,
        customerId: seatWallet.id,
        customerName: seatWallet.name,
        startTime: startIso,
        endTime: new Date().toISOString(),
        durationSec: sessionTotals.durationSec,
        costPerMinute: branch.billing.costPerMinute,
        lockedAmount: sessionTotals.lockedAmount,
        usageCost: sessionTotals.usageCost,
        refund: sessionTotals.refund,
        settledBy: user.id,
        settledByRole: user.role as 'cafe_owner' | 'manager',
      });
      toast.success(`Settled ${seatWallet.name} · Usage RM ${sessionTotals.usageCost.toFixed(2)} · Refund RM ${sessionTotals.refund.toFixed(2)}`);
    } else {
      toast.success('Session ended');
    }
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'available' as const, playerName: undefined, startTime: undefined, endTime: undefined } : s
    ));
    setConfirmEndOpen(false);
    setSelectedSeat(null);
    setDialogMode(null);
    setPlayerName('');
    setSessionDuration('60');
    setExtendMinutes('30');
  };

  const handleRestart = () => {
    if (!selectedSeat) return;
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'available' as const } : s
    ));
    closeDialog();
  };

  const handleExtendSession = () => {
    if (!selectedSeat || !selectedSeat.endTime) return;
    const mins = parseInt(extendMinutes);
    if (!mins || mins <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }
    const newEnd = addMinutesToTime(selectedSeat.endTime, mins);
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, endTime: newEnd } : s
    ));
    toast.success(`Session extended by ${mins} minutes (new end: ${newEnd})`);
    closeDialog();
  };

  const closeDialog = () => {
    if (!confirmEndOpen) setSelectedSeat(null);
    setDialogMode(null);
    setPlayerName('');
    setSessionDuration('60');
    setExtendMinutes('30');
  };

  const getSeatBooking = (seat: Seat) => bookedSeatMap.get(seat.number);
  const isBooked = (seat: Seat) => seat.status === 'available' && bookedSeatMap.has(seat.number);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seat Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage players and seats at {branch?.name || 'your branch'}</p>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-success" /> Available: <strong>{available - booked}</strong></span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-primary" /> Booked: <strong>{booked}</strong></span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-destructive" /> Occupied: <strong>{occupied}</strong></span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-warning" /> Maintenance: <strong>{maintenance}</strong></span>
        <span className="text-muted-foreground">Total: <strong>{seats.length}</strong></span>
      </div>

      {/* Seat Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Seat Map — Tap a seat to manage</CardTitle>
          <CardDescription>Click on any seat to check in/out players, extend sessions, or restart.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {seats.map(seat => {
              const booking = getSeatBooking(seat);
              const seatBooked = isBooked(seat);

              const seatButton = (
                <button
                  key={seat.id}
                  onClick={() => handleSeatClick(seat)}
                  className={cn(
                    'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 border-2 relative',
                    seatBooked && 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20',
                    !seatBooked && seat.status === 'available' && 'bg-success/10 border-success/30 text-success hover:bg-success/20',
                    seat.status === 'occupied' && 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20',
                    seat.status === 'maintenance' && 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20',
                  )}
                >
                  {seatBooked ? (
                    <CalendarCheck className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                  <span className="font-bold">{seat.number}</span>
                  {seat.playerName && (
                    <span className="text-[10px] truncate max-w-full px-1">{seat.playerName}</span>
                  )}
                  {seat.endTime && seat.status === 'occupied' && (
                    <span className="text-[9px] truncate max-w-full px-0.5 opacity-70 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />{seat.endTime}
                    </span>
                  )}
                  {seatBooked && (
                    <span className="text-[9px] truncate max-w-full px-0.5 opacity-80">{booking!.customerName.split(' ')[0]}</span>
                  )}
                </button>
              );

              if (seatBooked && booking) {
                return (
                  <Tooltip key={seat.id}>
                    <TooltipTrigger asChild>
                      {seatButton}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs space-y-1 max-w-[200px]">
                      <p className="font-semibold">{booking.customerName}</p>
                      <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {booking.date} · {booking.startTime}–{booking.endTime}</p>
                      {booking.gpuPreference && <p>GPU: {booking.gpuPreference}</p>}
                      {booking.notes && <p className="italic text-muted-foreground">{booking.notes}</p>}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return seatButton;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
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
              {selectedSeat && bookedSeatMap.has(selectedSeat.number) && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm space-y-1">
                  <p className="font-medium text-primary flex items-center gap-1"><CalendarCheck className="h-4 w-4" /> This seat has a booking</p>
                  <p><strong>Customer:</strong> {bookedSeatMap.get(selectedSeat.number)!.customerName}</p>
                  <p><strong>Time:</strong> {bookedSeatMap.get(selectedSeat.number)!.startTime} – {bookedSeatMap.get(selectedSeat.number)!.endTime}</p>
                </div>
              )}
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label>Player Name</Label>
                  <Input placeholder="Enter player's name" value={playerName} onChange={e => setPlayerName(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Session Duration (minutes)</Label>
                  <Input type="number" min="15" step="15" placeholder="60" value={sessionDuration} onChange={e => setSessionDuration(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">GPU: {selectedSeat?.gpuModel}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleCheckIn} disabled={!playerName.trim()} className="bg-success text-success-foreground hover:bg-success/90">Check In</Button>
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
              <div className="py-2 space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-sm"><strong>Player:</strong> {selectedSeat?.playerName}</p>
                  <p className="text-sm"><strong>Started:</strong> {selectedSeat?.startTime}</p>
                  <p className="text-sm"><strong>Ends:</strong> {selectedSeat?.endTime || '—'}</p>
                  <p className="text-sm"><strong>GPU:</strong> {selectedSeat?.gpuModel}</p>
                </div>

                {seatWallet && (
                  <div
                    className={cn(
                      'p-3 rounded-lg border space-y-2',
                      isLowBalance
                        ? 'bg-destructive/10 border-destructive/30'
                        : 'bg-success/10 border-success/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <Wallet className={cn('h-4 w-4', isLowBalance ? 'text-destructive' : 'text-success')} />
                        Wallet · {seatWallet.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {isLowBalance && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Low balance
                          </span>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={handleWalletSync}
                              disabled={walletSyncing}
                              aria-label="Sync wallet balance"
                            >
                              <RefreshCw className={cn('h-3.5 w-3.5', walletSyncing && 'animate-spin')} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {walletSyncedAt ? `Last synced at ${walletSyncedAt}` : 'Sync wallet balance'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Balance</p>
                        <p className="font-mono font-bold text-sm">RM {seatWallet.balance}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Locked</p>
                        <p className="font-mono font-bold text-sm">RM {seatWallet.lockedAmount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Remaining</p>
                        <p className={cn('font-mono font-bold text-sm', isLowBalance ? 'text-destructive' : 'text-success')}>
                          RM {remaining}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setDialogMode('extend')}
                >
                  <TimerReset className="h-4 w-4" /> Extend Session
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleCheckOut} variant="destructive">End Billing</Button>
              </DialogFooter>
            </>
          )}
          {dialogMode === 'extend' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TimerReset className="h-5 w-5 text-primary" />
                  Extend Session — Seat {selectedSeat?.number}
                </DialogTitle>
                <DialogDescription>Extend the session for {selectedSeat?.playerName}</DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-sm"><strong>Player:</strong> {selectedSeat?.playerName}</p>
                  <p className="text-sm"><strong>Current End Time:</strong> {selectedSeat?.endTime || '—'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Extend by (minutes)</Label>
                  <Input type="number" min="15" step="15" placeholder="30" value={extendMinutes} onChange={e => setExtendMinutes(e.target.value)} autoFocus />
                  {selectedSeat?.endTime && extendMinutes && parseInt(extendMinutes) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      New end time: <strong>{addMinutesToTime(selectedSeat.endTime, parseInt(extendMinutes))}</strong>
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogMode('checkout')}>Back</Button>
                <Button onClick={handleExtendSession}>Extend Session</Button>
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
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleRestart} className="bg-warning text-warning-foreground hover:bg-warning/90">Restart</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <EndSessionConfirmDialog
        open={confirmEndOpen}
        onOpenChange={setConfirmEndOpen}
        onConfirm={handleConfirmEndSession}
        customerName={seatWallet?.name ?? selectedSeat?.playerName}
        branchName={branch?.name}
        durationSec={sessionTotals.durationSec}
        lockedAmount={sessionTotals.lockedAmount}
        usageCost={sessionTotals.usageCost}
        refund={sessionTotals.refund}
        costPerMinute={branch?.billing.costPerMinute}
      />
    </div>
  );
}
