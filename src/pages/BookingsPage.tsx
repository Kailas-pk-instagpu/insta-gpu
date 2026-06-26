import { useState, useMemo } from 'react';
import { useAuthStore, useBookingStore, useBranchStore } from '@/shared/lib/store';
import { MOCK_BRANCHES, MOCK_SEATS, Booking } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { CalendarCheck, Plus, X, Clock, User, Phone, Monitor, StickyNote, Filter, UserCheck, CalendarDays, List, MoreHorizontal } from 'lucide-react';
import BookingCalendarView from '@/features/bookings/BookingCalendarView';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<Booking['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  upcoming: { label: 'Upcoming', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'outline' },
};

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { bookings, addBooking, cancelBooking, updateBookingStatus } = useBookingStore();
  const { branches } = useBranchStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'list' | 'calendar'>('calendar');

  // Form state
  const [formBranch, setFormBranch] = useState('');
  const [formSeat, setFormSeat] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formGpu, setFormGpu] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Get accessible branches based on role
  const accessibleBranches = useMemo(() => {
    if (!user) return [];
    if (user.role === 'cafe_owner') {
      return branches.filter(b => user.assignedScope.includes(b.cafeId));
    }
    if (user.role === 'manager') {
      return branches.filter(b => user.assignedScope.includes(b.id));
    }
    return branches;
  }, [user, branches]);

  const filteredBookings = useMemo(() => {
    let result = bookings.filter(b =>
      accessibleBranches.some(br => br.id === b.branchId)
    );
    if (selectedBranch !== 'all') {
      result = result.filter(b => b.branchId === selectedBranch);
    }
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    return result.sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      return a.startTime > b.startTime ? -1 : 1;
    });
  }, [bookings, accessibleBranches, selectedBranch, statusFilter]);

  const stats = useMemo(() => ({
    total: filteredBookings.length,
    upcoming: filteredBookings.filter(b => b.status === 'upcoming').length,
    completed: filteredBookings.filter(b => b.status === 'completed').length,
    cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
  }), [filteredBookings]);

  // Compute available seats for the selected branch/date/time slot
  const availableSeats = useMemo(() => {
    if (!formBranch) return [];
    const branch = branches.find(b => b.id === formBranch) || MOCK_BRANCHES.find(b => b.id === formBranch);
    if (!branch) return [];
    const branchSeats = MOCK_SEATS.filter(s => s.branchId === formBranch);
    return Array.from({ length: branch.totalSeats }, (_, i) => i + 1).filter(num => {
      const seat = branchSeats.find(s => s.number === num);
      if (seat?.status === 'maintenance') return false;
      if (!formDate || !formStartTime || !formEndTime) return true;
      const clash = bookings.some(b =>
        b.branchId === formBranch &&
        b.seatNumber === num &&
        b.date === formDate &&
        b.status === 'upcoming' &&
        formStartTime < b.endTime &&
        formEndTime > b.startTime
      );
      return !clash;
    });
  }, [formBranch, formDate, formStartTime, formEndTime, bookings, branches]);

  const resetForm = () => {
    setFormBranch('');
    setFormSeat('');
    setFormName('');
    setFormPhone('');
    setFormDate('');
    setFormStartTime('');
    setFormEndTime('');
    setFormGpu('');
    setFormNotes('');
  };

  const handleCreate = () => {
    if (!formBranch || !formSeat || !formName || !formDate || !formStartTime || !formEndTime) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formEndTime <= formStartTime) {
      toast.error('End time must be after start time');
      return;
    }

    // Conflict detection: check for overlapping bookings on the same seat, branch, and date
    const seatNum = parseInt(formSeat);
    const conflict = bookings.find(b =>
      b.branchId === formBranch &&
      b.seatNumber === seatNum &&
      b.date === formDate &&
      b.status === 'upcoming' &&
      formStartTime < b.endTime &&
      formEndTime > b.startTime
    );
    if (conflict) {
      toast.error(`Seat ${seatNum} is already booked on ${formDate} from ${conflict.startTime} to ${conflict.endTime} by ${conflict.customerName}`);
      return;
    }

    const payload = {
      branchId: formBranch,
      seatNumber: parseInt(formSeat),
      customerName: formName,
      customerPhone: formPhone,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      status: 'upcoming' as const,
      gpuPreference: formGpu || undefined,
      notes: formNotes || undefined,
      createdBy: user?.id || '',
    };
    const newId = addBooking(payload);
    toast.success('Booking created successfully');
    setShowCreateDialog(false);
    setConfirmedBooking({ ...payload, id: newId, createdAt: new Date().toISOString().split('T')[0] });
    resetForm();
  };

  const handleCancel = (id: string) => {
    cancelBooking(id);
    toast.info('Booking cancelled');
  };

  const handleMarkCompleted = (id: string) => {
    updateBookingStatus(id, 'completed');
    toast.success('Booking marked as completed');
  };


  const getBranchName = (branchId: string) =>
    MOCK_BRANCHES.find(b => b.id === branchId)?.name || branchId;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Booking</h1>
          <p className="text-muted-foreground text-sm mt-1">Reserve seats in advance for customers</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Upcoming</p>
          <p className="text-2xl font-bold text-primary">{stats.upcoming}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Completed</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Cancelled</p>
          <p className="text-2xl font-bold text-destructive">{stats.cancelled}</p>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {accessibleBranches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {viewTab === 'list' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
          <Button variant={viewTab === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs gap-1.5" onClick={() => setViewTab('list')}>
            <List className="h-3.5 w-3.5" /> List
          </Button>
          <Button variant={viewTab === 'calendar' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs gap-1.5" onClick={() => setViewTab('calendar')}>
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewTab === 'calendar' && (
        <BookingCalendarView
          bookings={bookings}
          branchFilter={selectedBranch}
          onSlotClick={(date, startTime) => {
            resetForm();
            setFormDate(date);
            setFormStartTime(startTime);
            const [h, m] = startTime.split(':').map(Number);
            const endH = Math.min(h + 1, 23);
            setFormEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            if (selectedBranch !== 'all') setFormBranch(selectedBranch);
            setShowCreateDialog(true);
          }}
        />
      )}

      {/* Bookings Table */}
      {viewTab === 'list' && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Bookings</CardTitle>
          <CardDescription>{filteredBookings.length} booking(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No bookings found</p>
              <p className="text-sm mt-1">Create a new booking to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>GPU</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <span className="font-mono text-xs select-all">{booking.id}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{booking.customerName}</p>
                          <p className="text-xs text-muted-foreground">{booking.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getBranchName(booking.branchId)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Monitor className="h-3 w-3" /> #{booking.seatNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" /> {booking.startTime} – {booking.endTime}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{booking.gpuPreference || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[booking.status].variant}>
                          {STATUS_CONFIG[booking.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {booking.status === 'upcoming' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleMarkCompleted(booking.id)}>
                                <UserCheck className="h-4 w-4 mr-2" /> Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleCancel(booking.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" /> Cancel Booking
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              New Pre-Booking
            </DialogTitle>
            <DialogDescription>Reserve a seat in advance for a customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select value={formBranch} onValueChange={setFormBranch}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {accessibleBranches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Available Seat *</Label>
                <Select value={formSeat} onValueChange={setFormSeat} disabled={!formBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder={!formBranch ? 'Select branch first' : availableSeats.length === 0 ? 'No seats available' : 'Pick a seat'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSeats.map(n => (
                      <SelectItem key={n} value={String(n)}>Seat #{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formBranch && formDate && formStartTime && formEndTime && (
                  <p className="text-xs text-muted-foreground">{availableSeats.length} seat(s) free for this slot</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><User className="h-3 w-3" /> Customer Name *</Label>
                <Input placeholder="Full name" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
                <Input placeholder="+1 555 000 000" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" min={today} value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>GPU Preference</Label>
              <Select value={formGpu} onValueChange={setFormGpu}>
                <SelectTrigger><SelectValue placeholder="Any available" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Available</SelectItem>
                  <SelectItem value="RTX 4090">RTX 4090</SelectItem>
                  <SelectItem value="RTX 4080">RTX 4080</SelectItem>
                  <SelectItem value="RTX 4070 Ti">RTX 4070 Ti</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><StickyNote className="h-3 w-3" /> Notes</Label>
              <Input placeholder="Optional notes (e.g. VIP, tournament)" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!formBranch || !formSeat || !formName.trim() || !formDate || !formStartTime || !formEndTime}
            >
              Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmedBooking} onOpenChange={(open) => !open && setConfirmedBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Booking Confirmed
            </DialogTitle>
            <DialogDescription>Share this reference ID with the customer.</DialogDescription>
          </DialogHeader>
          {confirmedBooking && (
            <div className="space-y-3 py-2">
              <div className="rounded-md border border-border bg-muted/40 p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Booking ID</p>
                <p className="text-lg font-mono font-semibold mt-1 select-all">{confirmedBooking.id}</p>
              </div>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{confirmedBooking.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span className="font-medium">{getBranchName(confirmedBooking.branchId)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Seat</span><span className="font-medium">#{confirmedBooking.seatNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{confirmedBooking.date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{confirmedBooking.startTime} – {confirmedBooking.endTime}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (confirmedBooking) { navigator.clipboard?.writeText(confirmedBooking.id); toast.success('Booking ID copied'); } }}>Copy ID</Button>
            <Button onClick={() => setConfirmedBooking(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}