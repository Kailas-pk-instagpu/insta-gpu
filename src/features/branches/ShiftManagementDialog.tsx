import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Plus, Trash2, Edit, UserCheck, Coffee, CalendarDays, X, Power } from 'lucide-react';
import { toast } from 'sonner';
import { Branch, MOCK_USERS } from '@/shared/lib/mock-data';
import { useShiftStore, useAuthStore, WEEKDAYS, Weekday, Shift } from '@/shared/lib/store';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  branch: Branch | null;
}

interface ShiftForm {
  name: string;
  startTime: string;
  endTime: string;
  weekdays: Weekday[];
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
  managerIds: string[];
  active: boolean;
}

const emptyForm: ShiftForm = {
  name: '',
  startTime: '09:00',
  endTime: '17:00',
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  hasBreak: false,
  breakStart: '12:00',
  breakEnd: '13:00',
  managerIds: [],
  active: true,
};

function formatRange(s: string, e: string) {
  return `${s} – ${e}`;
}

function getManagerName(id: string) {
  return MOCK_USERS.find(u => u.id === id)?.name || 'Unknown';
}

export default function ShiftManagementDialog({ open, onOpenChange, branch }: Props) {
  const currentUser = useAuthStore(s => s.user);
  const { shifts, addShift, updateShift, deleteShift, toggleShiftActive } = useShiftStore();
  const [form, setForm] = useState<ShiftForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const branchShifts = useMemo(
    () => (branch ? shifts.filter(s => s.branchId === branch.id) : []),
    [shifts, branch],
  );

  // Eligible managers for this branch: branch manager + managers under the cafe owner
  const eligibleManagers = useMemo(() => {
    if (!branch) return [];
    const all = MOCK_USERS.filter(u => u.role === 'manager');
    const owner = branch.cafeOwnerId;
    return all.filter(m => m.id === branch.managerId || (owner && m.createdBy === owner));
  }, [branch]);

  const role = currentUser?.role;
  const canEdit = role === 'super_admin' || role === 'admin' || role === 'cafe_owner';

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (s: Shift) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      weekdays: [...s.weekdays],
      hasBreak: !!(s.breakStart && s.breakEnd),
      breakStart: s.breakStart || '12:00',
      breakEnd: s.breakEnd || '13:00',
      managerIds: [...s.managerIds],
      active: s.active,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!branch || !currentUser) return;
    if (!form.name.trim()) {
      toast.error('Shift name is required');
      return;
    }
    if (form.weekdays.length === 0) {
      toast.error('Select at least one weekday');
      return;
    }
    if (form.startTime === form.endTime) {
      toast.error('Start and end time cannot be the same');
      return;
    }

    const payload = {
      branchId: branch.id,
      name: form.name.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      weekdays: form.weekdays,
      breakStart: form.hasBreak ? form.breakStart : undefined,
      breakEnd: form.hasBreak ? form.breakEnd : undefined,
      managerIds: form.managerIds,
      active: form.active,
      createdBy: currentUser.id,
    };

    if (editingId) {
      updateShift(editingId, payload);
      toast.success(`Shift "${form.name}" updated`);
    } else {
      addShift(payload);
      toast.success(`Shift "${form.name}" created`);
    }
    resetForm();
  };

  const toggleWeekday = (day: Weekday) => {
    setForm(f => ({
      ...f,
      weekdays: f.weekdays.includes(day) ? f.weekdays.filter(d => d !== day) : [...f.weekdays, day],
    }));
  };

  const toggleManager = (id: string) => {
    setForm(f => ({
      ...f,
      managerIds: f.managerIds.includes(id) ? f.managerIds.filter(m => m !== id) : [...f.managerIds, id],
    }));
  };

  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {branch.name} — Shift Timings
          </DialogTitle>
          <DialogDescription>
            Configure recurring work shifts for this branch and assign managers responsible for each.
          </DialogDescription>
        </DialogHeader>

        {!showForm && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {branchShifts.length} shift{branchShifts.length === 1 ? '' : 's'} configured
              </p>
              {canEdit && (
                <Button size="sm" className="gap-1.5 gradient-primary text-primary-foreground" onClick={() => { resetForm(); setShowForm(true); }}>
                  <Plus className="h-3.5 w-3.5" /> Add Shift
                </Button>
              )}
            </div>

            {branchShifts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-sm mb-1">No shifts configured yet</p>
                  <p className="text-xs text-muted-foreground">
                    {canEdit ? 'Add a shift to define operating hours and assign managers.' : 'No shifts have been set up for this branch.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {branchShifts.map(s => (
                  <Card key={s.id} className={cn('transition-opacity', !s.active && 'opacity-60')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4 className="font-semibold text-sm">{s.name}</h4>
                            <Badge variant={s.active ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
                              {s.active ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" /> {formatRange(s.startTime, s.endTime)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="h-3 w-3" />
                              {s.weekdays.map(d => WEEKDAYS.find(w => w.id === d)?.label).join(', ')}
                            </span>
                            {s.breakStart && s.breakEnd && (
                              <span className="flex items-center gap-1.5">
                                <Coffee className="h-3 w-3" /> Break {formatRange(s.breakStart, s.breakEnd)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-start gap-1.5 text-xs">
                            <UserCheck className="h-3 w-3 text-accent-foreground mt-0.5 shrink-0" />
                            {s.managerIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {s.managerIds.map(id => (
                                  <Badge key={id} variant="outline" className="text-[10px] h-4 px-1.5">
                                    {getManagerName(id)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">No managers assigned</span>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleShiftActive(s.id)} title={s.active ? 'Disable' : 'Enable'}>
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(s)} title="Edit">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { deleteShift(s.id); toast.success(`Shift "${s.name}" deleted`); }} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {showForm && canEdit && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                {editingId ? 'Edit Shift' : 'New Shift'}
              </p>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-3.5 w-3.5" /></Button>
            </div>

            <div>
              <Label htmlFor="shift-name">Shift Name *</Label>
              <Input
                id="shift-name"
                placeholder="e.g. Morning Shift, Night Crew"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start">Start Time *</Label>
                <Input id="start" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="end">End Time *</Label>
                <Input id="end" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Active Days *</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map(d => {
                  const active = form.weekdays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleWeekday(d.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium border transition-all',
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-1.5"><Coffee className="h-3.5 w-3.5" /> Break Window</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Optional break time within the shift</p>
                </div>
                <Switch checked={form.hasBreak} onCheckedChange={v => setForm(f => ({ ...f, hasBreak: v }))} />
              </div>
              {form.hasBreak && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bs" className="text-xs">Break Start</Label>
                    <Input id="bs" type="time" value={form.breakStart} onChange={e => setForm(f => ({ ...f, breakStart: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="be" className="text-xs">Break End</Label>
                    <Input id="be" type="time" value={form.breakEnd} onChange={e => setForm(f => ({ ...f, breakEnd: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <UserCheck className="h-3.5 w-3.5 text-accent-foreground" /> Assigned Manager(s)
              </Label>
              {eligibleManagers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No eligible managers for this branch. Assign a cafe owner with managers first.</p>
              ) : (
                <div className="space-y-1.5">
                  {eligibleManagers.map(m => {
                    const checked = form.managerIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleManager(m.id)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-md border p-2.5 text-left transition-all',
                          checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-4 w-4 rounded border flex items-center justify-center',
                            checked ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                          )}>
                            {checked && <span className="text-[10px] text-primary-foreground">✓</span>}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-tight">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Disabled shifts are kept but not enforced</p>
              </div>
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={handleSubmit}
                disabled={!form.name.trim() || !form.startTime || !form.endTime || form.weekdays.length === 0}
              >
                {editingId ? 'Save Changes' : 'Create Shift'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
