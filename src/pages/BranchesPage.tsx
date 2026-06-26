import { useState, useMemo } from 'react';
import { useBranchStore, useAuthStore, useSeatStore } from '@/shared/lib/store';
import { useSeatActivityStore } from '@/shared/lib/seatActivityStore';
import { ROLE_LABELS } from '@/shared/types/auth';
import { MOCK_USERS, GPU_MODEL_OPTIONS } from '@/shared/lib/mock-data';
import { Branch, Seat } from '@/shared/lib/mock-data';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, MapPin, Monitor, Plus, Settings, Edit, Power, Trash2, UserCheck, Armchair, Shield, User, Users, LayoutGrid, Cpu, Clock, X, Pencil, Wrench, CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@/shared/types/auth';
import { cn } from '@/lib/utils';
import ShiftManagementDialog from '@/features/branches/ShiftManagementDialog';

interface BranchForm {
  name: string;
  address: string;
  cafeId: string;
  totalSeats: number;
  adminId: string;
  cafeOwnerId: string;
  managerId: string;
}

const emptyForm: BranchForm = { name: '', address: '', cafeId: '', totalSeats: 10, adminId: '', cafeOwnerId: '', managerId: '' };

function getUsersByRole(role: Role) {
  return MOCK_USERS.filter(u => u.role === role);
}

function getUserName(id?: string) {
  if (!id) return null;
  return MOCK_USERS.find(u => u.id === id);
}

export default function BranchesPage() {
  const { branches, addBranch, updateBranch, deleteBranch, toggleBranchStatus } = useBranchStore();
  const { seats, updateSeatStatus, updateSeat, provisionSeats, syncSeatCount, removeSeatsForBranch } = useSeatStore();
  const currentUser = useAuthStore(s => s.user);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSeatGrid, setShowSeatGrid] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [seatForm, setSeatForm] = useState<{ label: string; gpuModel: string; status: Seat['status'] }>({ label: '', gpuModel: 'RTX 4070', status: 'available' });
  const [defaultGpu, setDefaultGpu] = useState<string>('RTX 4070');
  const [baselineGpu, setBaselineGpu] = useState<string>('RTX 4070');
  const [canSaveSeatConfig, setCanSaveSeatConfig] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [filterAssignment, setFilterAssignment] = useState<string>('all'); // all | assigned | unassigned
  const [filterCapacity, setFilterCapacity] = useState<string>('all'); // all | low | med | full
  const [sortBy, setSortBy] = useState<string>('name-asc');

  const userRole = currentUser?.role;

  // Filter branches based on role scope
  const visibleBranches = useMemo(() => {
    if (!currentUser) return [];
    if (userRole === 'super_admin') return branches;
    if (userRole === 'admin') return branches.filter(b => b.adminId === currentUser.id || currentUser.assignedScope.includes(b.cafeId));
    if (userRole === 'cafe_owner') return branches.filter(b => b.cafeOwnerId === currentUser.id || currentUser.assignedScope.some(s => s === b.cafeId));
    return branches.filter(b => b.managerId === currentUser.id);
  }, [branches, currentUser, userRole]);

  const displayedBranches = useMemo(() => {
    let list = [...visibleBranches];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(b => {
        const owner = getUserName(b.cafeOwnerId);
        const mgr = getUserName(b.managerId);
        const adm = getUserName(b.adminId);
        return (
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          owner?.name.toLowerCase().includes(q) ||
          mgr?.name.toLowerCase().includes(q) ||
          adm?.name.toLowerCase().includes(q)
        );
      });
    }
    if (filterStatus !== 'all') list = list.filter(b => b.status === filterStatus);
    if (filterOwner !== 'all') list = list.filter(b => b.cafeOwnerId === filterOwner);
    if (filterManager !== 'all') {
      if (filterManager === 'unassigned') list = list.filter(b => !b.managerId);
      else list = list.filter(b => b.managerId === filterManager);
    }
    if (filterAssignment === 'assigned') list = list.filter(b => b.adminId && b.cafeOwnerId && b.managerId);
    if (filterAssignment === 'unassigned') list = list.filter(b => !b.adminId || !b.cafeOwnerId || !b.managerId);
    if (filterCapacity !== 'all') {
      list = list.filter(b => {
        const pct = b.totalSeats > 0 ? b.activeSeats / b.totalSeats : 0;
        if (filterCapacity === 'low') return pct < 0.4;
        if (filterCapacity === 'med') return pct >= 0.4 && pct < 0.8;
        if (filterCapacity === 'full') return pct >= 0.8;
        return true;
      });
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'seats-desc': return b.totalSeats - a.totalSeats;
        case 'seats-asc': return a.totalSeats - b.totalSeats;
        case 'utilization-desc': return (b.activeSeats / Math.max(1, b.totalSeats)) - (a.activeSeats / Math.max(1, a.totalSeats));
        case 'utilization-asc': return (a.activeSeats / Math.max(1, a.totalSeats)) - (b.activeSeats / Math.max(1, b.totalSeats));
        case 'name-asc':
        default: return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [visibleBranches, searchQuery, filterStatus, filterOwner, filterManager, filterAssignment, filterCapacity, sortBy]);

  const activeFilterCount = [
    filterStatus !== 'all',
    filterOwner !== 'all',
    filterManager !== 'all',
    filterAssignment !== 'all',
    filterCapacity !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterOwner('all');
    setFilterManager('all');
    setFilterAssignment('all');
    setFilterCapacity('all');
    setSortBy('name-asc');
  };

  const admins = getUsersByRole('admin');
  const cafeOwners = getUsersByRole('cafe_owner');
  const managers = getUsersByRole('manager');

  const canCreate = userRole === 'super_admin' || userRole === 'admin' || userRole === 'cafe_owner';

  const handleAdd = () => {
    const f = { ...emptyForm };
    // Auto-assign current user based on role
    if (userRole === 'admin') f.adminId = currentUser!.id;
    if (userRole === 'cafe_owner') {
      f.cafeOwnerId = currentUser!.id;
    }
    setForm(f);
    setShowAddDialog(true);
  };

  const handleManage = (branch: Branch) => {
    setSelectedBranch(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      cafeId: branch.cafeId,
      totalSeats: branch.totalSeats,
      adminId: branch.adminId || '',
      cafeOwnerId: branch.cafeOwnerId || '',
      managerId: branch.managerId || '',
    });
    setShowManageDialog(true);
  };

  const handleSettings = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowSettingsDialog(true);
  };

  const submitAdd = () => {
    if (!form.name || !form.address) {
      toast.error('Please fill in branch name and address');
      return;
    }
    const newId = addBranch({
      name: form.name,
      address: form.address,
      cafeId: form.cafeId || 'cafe-1',
      totalSeats: form.totalSeats,
      activeSeats: 0,
      status: 'active',
      adminId: form.adminId || undefined,
      cafeOwnerId: form.cafeOwnerId || undefined,
      managerId: form.managerId || undefined,
      billing: { costPerMinute: 2, lockedAmount: 100, currency: 'MYR' },
    });
    provisionSeats(newId, form.totalSeats, defaultGpu);
    toast.success(`Branch "${form.name}" created with ${form.totalSeats} seats`);
    setShowAddDialog(false);
    // Open seat grid so the owner can immediately configure GPUs
    const newBranch: Branch = { id: newId, name: form.name, address: form.address, cafeId: form.cafeId || 'cafe-1', totalSeats: form.totalSeats, activeSeats: 0, status: 'active', adminId: form.adminId || undefined, cafeOwnerId: form.cafeOwnerId || undefined, managerId: form.managerId || undefined, billing: { costPerMinute: 2, lockedAmount: 100, currency: 'MYR' } };
    setSelectedBranch(newBranch);
    setBaselineGpu(defaultGpu);
    setCanSaveSeatConfig(false);
    setShowSeatGrid(true);
  };

  const submitUpdate = () => {
    if (!selectedBranch) return;
    updateBranch(selectedBranch.id, {
      name: form.name,
      address: form.address,
      totalSeats: form.totalSeats,
      activeSeats: Math.min(selectedBranch.activeSeats, form.totalSeats),
      adminId: form.adminId || undefined,
      cafeOwnerId: form.cafeOwnerId || undefined,
      managerId: form.managerId || undefined,
    });
    syncSeatCount(selectedBranch.id, form.totalSeats, defaultGpu);
    toast.success(`Branch "${form.name}" updated successfully`);
    setShowManageDialog(false);
  };

  const handleToggleStatus = () => {
    if (!selectedBranch) return;
    toggleBranchStatus(selectedBranch.id);
    const newStatus = selectedBranch.status === 'inactive' ? 'active' : 'inactive';
    toast.success(`Branch "${selectedBranch.name}" ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    setShowSettingsDialog(false);
  };

  const handleDelete = () => {
    if (!selectedBranch) return;
    removeSeatsForBranch(selectedBranch.id);
    deleteBranch(selectedBranch.id);
    toast.success(`Branch "${selectedBranch.name}" deleted`);
    setShowDeleteConfirm(false);
    setShowSettingsDialog(false);
  };

  const setMaintenance = () => {
    if (!selectedBranch) return;
    updateBranch(selectedBranch.id, {
      status: selectedBranch.status === 'maintenance' ? 'active' : 'maintenance',
    });
    toast.success(`Branch "${selectedBranch.name}" ${selectedBranch.status === 'maintenance' ? 'back to active' : 'set to maintenance'}`);
    setShowSettingsDialog(false);
  };

  // Filtered user lists for assignments based on current user role
  const getAssignableAdmins = () => {
    if (userRole === 'super_admin') return admins;
    return [];
  };

  const getAssignableCafeOwners = () => {
    if (userRole === 'super_admin') return cafeOwners;
    if (userRole === 'admin') return cafeOwners.filter(o => o.createdBy === currentUser!.id);
    return [];
  };

  const getAssignableManagers = () => {
    if (userRole === 'super_admin') return managers;
    if (userRole === 'admin') {
      const ownCafeOwners = cafeOwners.filter(o => o.createdBy === currentUser!.id).map(o => o.id);
      return managers.filter(m => m.createdBy && ownCafeOwners.includes(m.createdBy));
    }
    if (userRole === 'cafe_owner') return managers.filter(m => m.createdBy === currentUser!.id);
    return [];
  };

  const AssignmentUserLabel = ({ userId, role }: { userId?: string; role: string }) => {
    const user = getUserName(userId);
    if (!user) return <span className="text-muted-foreground italic text-xs">Not assigned</span>;
    return (
      <span className="text-sm flex items-center gap-1.5">
        <span className="font-medium">{user.name}</span>
        <span className="text-muted-foreground">({user.email})</span>
      </span>
    );
  };

  const BranchFormFields = ({ isEdit }: { isEdit: boolean }) => {
    const assignableAdmins = getAssignableAdmins();
    const assignableCafeOwners = getAssignableCafeOwners();
    const assignableManagers = getAssignableManagers();

    return (
      <div className="space-y-5">
        {/* Step 1: Basic Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Step 1 — Branch Details
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Branch Name *</Label>
              <Input id="name" placeholder="e.g. Downtown Gaming Hub" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Give your branch a recognizable name</p>
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input id="address" placeholder="e.g. 123 Main Street, City" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Full street address of the branch</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Step 2: Seats */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Step 2 — Configure Seats
          </p>
          <div>
            <Label htmlFor="seats">Number of Seats</Label>
            <div className="flex items-center gap-3 mt-1">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setForm(f => ({ ...f, totalSeats: Math.max(1, f.totalSeats - 1) }))}>−</Button>
              <Input id="seats" type="number" min={1} className="w-24 text-center" value={form.totalSeats} onChange={e => setForm(f => ({ ...f, totalSeats: Math.max(1, parseInt(e.target.value) || 1) }))} />
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setForm(f => ({ ...f, totalSeats: f.totalSeats + 1 }))}>+</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isEdit && selectedBranch
                ? `Currently ${selectedBranch.activeSeats} seats are active out of ${selectedBranch.totalSeats}`
                : 'How many gaming stations does this branch have?'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Step 3: Assign Users */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Step 3 — Assign Team
          </p>
          <p className="text-xs text-muted-foreground mb-4">Assign users to manage and operate this branch</p>
          <div className="space-y-4">
            {/* Admin Assignment - only Super Admin can assign */}
            {assignableAdmins.length > 0 && (
              <div>
                <Label className="flex items-center gap-1.5 mb-1">
                  <Shield className="h-3.5 w-3.5 text-destructive" /> Admin
                </Label>
                <Select value={form.adminId} onValueChange={v => setForm(f => ({ ...f, adminId: v === 'none' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an admin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No admin assigned</SelectItem>
                    {assignableAdmins.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Admin will oversee this branch's operations</p>
              </div>
            )}

            {/* Cafe Owner Assignment - Super Admin and Admin can assign */}
            {assignableCafeOwners.length > 0 && (
              <div>
                <Label className="flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-primary" /> Cafe Owner
                </Label>
                <Select value={form.cafeOwnerId} onValueChange={v => setForm(f => ({ ...f, cafeOwnerId: v === 'none' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cafe owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No cafe owner assigned</SelectItem>
                    {assignableCafeOwners.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Cafe owner will manage day-to-day operations</p>
              </div>
            )}

            {/* Manager Assignment - Super Admin, Admin, Cafe Owner can assign */}
            {assignableManagers.length > 0 && (
              <div>
                <Label className="flex items-center gap-1.5 mb-1">
                  <UserCheck className="h-3.5 w-3.5 text-accent-foreground" /> Manager
                </Label>
                <Select value={form.managerId} onValueChange={v => setForm(f => ({ ...f, managerId: v === 'none' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager assigned</SelectItem>
                    {assignableManagers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Manager will handle this specific branch</p>
              </div>
            )}

            {assignableAdmins.length === 0 && assignableCafeOwners.length === 0 && assignableManagers.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No users available for assignment at your permission level</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AssignedTeamCard = ({ branch }: { branch: Branch }) => {
    const admin = getUserName(branch.adminId);
    const owner = getUserName(branch.cafeOwnerId);
    const manager = getUserName(branch.managerId);

    const assignments = [
      { label: 'Admin', user: admin, icon: Shield, color: 'text-destructive' },
      { label: 'Cafe Owner', user: owner, icon: User, color: 'text-primary' },
      { label: 'Manager', user: manager, icon: UserCheck, color: 'text-accent-foreground' },
    ];

    return (
      <div className="space-y-1.5 mt-1">
        {assignments.map(a => (
          <div key={a.label} className="flex items-center gap-1.5 text-sm">
            <a.icon className={`h-3 w-3 ${a.color} shrink-0`} />
            <span className="text-muted-foreground text-xs w-[72px] shrink-0">{a.label}:</span>
            {a.user ? (
              <span className="text-xs font-medium truncate">{a.user.name}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Manage gaming cafe locations, seats, and team assignments</p>
        </div>
        {canCreate && (
          <Button className="gradient-primary text-primary-foreground gap-2 w-full sm:w-auto" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Branches', value: visibleBranches.length, icon: Building2 },
          { label: 'Active', value: visibleBranches.filter(b => b.status === 'active').length, icon: Power },
          { label: 'Total Seats', value: visibleBranches.reduce((s, b) => s + b.totalSeats, 0), icon: Armchair },
          { label: 'Active Seats', value: visibleBranches.reduce((s, b) => s + b.activeSeats, 0), icon: Monitor },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, ID, owner or manager..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[170px] h-10"><SlidersHorizontal className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                  <SelectItem value="seats-desc">Most seats</SelectItem>
                  <SelectItem value="seats-asc">Fewest seats</SelectItem>
                  <SelectItem value="utilization-desc">Highest utilization</SelectItem>
                  <SelectItem value="utilization-asc">Lowest utilization</SelectItem>
                </SelectContent>
              </Select>
              {activeFilterCount > 0 || searchQuery ? (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger><SelectValue placeholder="Cafe Owner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {cafeOwners.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterManager} onValueChange={setFilterManager}>
              <SelectTrigger><SelectValue placeholder="Manager" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All managers</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {managers.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAssignment} onValueChange={setFilterAssignment}>
              <SelectTrigger><SelectValue placeholder="Team status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any team</SelectItem>
                <SelectItem value="assigned">Fully assigned</SelectItem>
                <SelectItem value="unassigned">Missing roles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCapacity} onValueChange={setFilterCapacity}>
              <SelectTrigger><SelectValue placeholder="Utilization" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any utilization</SelectItem>
                <SelectItem value="low">Low (&lt; 40%)</SelectItem>
                <SelectItem value="med">Medium (40–80%)</SelectItem>
                <SelectItem value="full">High (≥ 80%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{displayedBranches.length}</span> of {visibleBranches.length} branches
              {activeFilterCount > 0 && <span className="ml-1">· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedBranches.map(branch => (
          <Card key={branch.id} className={`hover:shadow-md transition-shadow ${branch.status === 'inactive' ? 'opacity-60' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{branch.name}</h3>
                </div>
                <StatusBadge status={branch.status} />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground mb-2">
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {branch.address}</p>
                <p className="flex items-center gap-1.5"><Armchair className="h-3.5 w-3.5" /> {branch.activeSeats} active / {branch.totalSeats} total seats</p>
              </div>

              {/* Assigned Team */}
              <div className="p-3 rounded-lg bg-muted/50 border mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Assigned Team
                </p>
                <AssignedTeamCard branch={branch} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedBranch(branch); setBaselineGpu(defaultGpu); setCanSaveSeatConfig(false); setShowSeatGrid(true); }}>
                  <LayoutGrid className="h-3.5 w-3.5" /> Seats
                </Button>
                {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'cafe_owner') && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedBranch(branch); setShowShiftDialog(true); }}>
                    <Clock className="h-3.5 w-3.5" /> Shifts
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleManage(branch)}>
                  <Edit className="h-3.5 w-3.5" /> Manage
                </Button>
                {(userRole === 'super_admin' || userRole === 'admin') && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleSettings(branch)}>
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayedBranches.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No branches found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {visibleBranches.length === 0
                ? (canCreate ? 'Get started by adding your first branch' : 'No branches are assigned to you yet')
                : 'No branches match your current search and filters'}
            </p>
            {visibleBranches.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Branch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Add New Branch</DialogTitle>
            <DialogDescription>Set up a new gaming cafe location with seats and team assignments</DialogDescription>
          </DialogHeader>
          <BranchFormFields isEdit={false} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={submitAdd} disabled={!form.name.trim() || !form.address.trim()}>Create Branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Branch Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" /> Edit Branch</DialogTitle>
            <DialogDescription>Update branch details, seats, and team assignments</DialogDescription>
          </DialogHeader>
          <BranchFormFields isEdit={true} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={submitUpdate} disabled={!form.name.trim() || !form.address.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Branch Settings</DialogTitle>
            <DialogDescription>{selectedBranch?.name}</DialogDescription>
          </DialogHeader>
          {selectedBranch && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Branch Active</p>
                  <p className="text-xs text-muted-foreground">Enable or disable this branch</p>
                </div>
                <Switch checked={selectedBranch.status !== 'inactive'} onCheckedChange={handleToggleStatus} />
              </div>

              <Button variant="outline" className="w-full justify-start gap-2" onClick={setMaintenance}>
                <Monitor className="h-4 w-4" />
                {selectedBranch.status === 'maintenance' ? 'End Maintenance Mode' : 'Set Maintenance Mode'}
              </Button>

              <Separator />

              <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4" /> Delete Branch
              </Button>
              <p className="text-xs text-muted-foreground">Deleting a branch is permanent and cannot be undone</p>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Seat Grid Dialog */}
      <Dialog open={showSeatGrid} onOpenChange={(o) => { setShowSeatGrid(o); if (!o) { setEditingSeat(null); setCanSaveSeatConfig(false); setBaselineGpu(defaultGpu); } else { setBaselineGpu(defaultGpu); setCanSaveSeatConfig(false); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {selectedBranch?.name} — Seat Configuration
            </DialogTitle>
            <DialogDescription>
              Click any seat to edit its name, GPU model and status.
            </DialogDescription>
          </DialogHeader>
          {selectedBranch && (() => {
            const branchSeats = seats.filter(s => s.branchId === selectedBranch.id).sort((a, b) => a.number - b.number);
            const available = branchSeats.filter(s => s.status === 'available').length;
            const occupied = branchSeats.filter(s => s.status === 'occupied').length;
            const maintenance = branchSeats.filter(s => s.status === 'maintenance').length;
            const canEdit = userRole === 'cafe_owner' || userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager';

            return (
              <div className="space-y-4">
                {/* Legend & Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-success/80" />
                    <span className="text-muted-foreground">Available ({available})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-destructive/80" />
                    <span className="text-muted-foreground">Occupied ({occupied})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-warning/80" />
                    <span className="text-muted-foreground">Maintenance ({maintenance})</span>
                  </div>
                </div>

                {/* Bulk GPU assignment */}
                {canEdit && branchSeats.length > 0 && (
                  <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs flex items-center gap-1.5"><Cpu className="h-3 w-3" /> Default GPU for new/unassigned seats</Label>
                      <Select value={defaultGpu} onValueChange={(v) => { setDefaultGpu(v); setCanSaveSeatConfig(false); }}>
                        <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GPU_MODEL_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={defaultGpu === baselineGpu}
                      onClick={() => {
                        let count = 0;
                        const actor = currentUser;
                        branchSeats.forEach(s => {
                          if (s.status !== 'occupied' && s.gpuModel !== defaultGpu) {
                            if (actor) {
                              useSeatActivityStore.getState().log({
                                seatId: s.id,
                                seatNumber: s.number,
                                branchId: s.branchId,
                                branchName: selectedBranch.name,
                                field: 'gpuModel',
                                fromValue: s.gpuModel || '—',
                                toValue: defaultGpu,
                                actorId: actor.id,
                                actorName: actor.name,
                                actorRole: ROLE_LABELS[actor.role],
                              });
                            }
                            updateSeat(s.id, { gpuModel: defaultGpu });
                            count++;
                          }
                        });
                        toast.success(`Applied ${defaultGpu} to ${count} seat${count === 1 ? '' : 's'}`);
                        setBaselineGpu(defaultGpu);
                        setCanSaveSeatConfig(true);
                      }}
                    >
                      <Cpu className="h-3.5 w-3.5" /> Apply to all
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 gradient-primary text-primary-foreground"
                      disabled={!canSaveSeatConfig}
                      onClick={() => {
                        toast.success('Seat configuration saved');
                        setCanSaveSeatConfig(false);
                        setShowSeatGrid(false);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Save Changes
                    </Button>

                  </div>
                )}

                {/* Grid */}
                <TooltipProvider delayDuration={200}>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {branchSeats.map(seat => {
                      const statusColor = seat.status === 'available'
                        ? 'bg-success/15 border-success/30 hover:bg-success/25 text-success'
                        : seat.status === 'occupied'
                        ? 'bg-destructive/15 border-destructive/30 hover:bg-destructive/25 text-destructive'
                        : 'bg-warning/15 border-warning/30 hover:bg-warning/25 text-warning';

                      const openEdit = () => {
                        setEditingSeat(seat);
                        setSeatForm({
                          label: seat.label || '',
                          gpuModel: seat.gpuModel || defaultGpu,
                          status: seat.status,
                        });
                      };

                      return (
                        <Tooltip key={seat.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={openEdit}
                              className={cn(
                                'group relative flex flex-col items-center justify-center rounded-lg border p-2.5 transition-all cursor-pointer aspect-square',
                                statusColor
                              )}
                            >
                              <Pencil className="absolute top-1 right-1 h-2.5 w-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                              <Armchair className="h-4 w-4 mb-0.5" />
                              <span className="text-xs font-bold leading-none">{seat.label || `#${seat.number}`}</span>
                              <span className="text-[9px] opacity-70 mt-0.5 truncate max-w-full">{seat.gpuModel}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs space-y-1 max-w-[200px]">
                            <p className="font-semibold">Seat #{seat.number}{seat.label ? ` · ${seat.label}` : ''}</p>
                            <p className="capitalize">Status: {seat.status}</p>
                            <p className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {seat.gpuModel}</p>
                            {seat.playerName && <p className="flex items-center gap-1"><User className="h-3 w-3" /> {seat.playerName}</p>}
                            {seat.startTime && <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> Since {seat.startTime}</p>}
                            <p className="text-muted-foreground italic mt-1">Click to edit</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>

                {branchSeats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Armchair className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm mb-3">No seats configured for this branch yet</p>
                    {canEdit && (
                      <Button
                        size="sm"
                        onClick={() => {
                          provisionSeats(selectedBranch.id, selectedBranch.totalSeats || 1, defaultGpu);
                          toast.success(`Provisioned ${selectedBranch.totalSeats} seats`);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Provision {selectedBranch.totalSeats} seats
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Seat Edit Dialog */}
      <Dialog open={editingSeat !== null} onOpenChange={(o) => { if (!o) setEditingSeat(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" /> Seat #{editingSeat?.number}
            </DialogTitle>
            <DialogDescription>Update seat name, GPU model and operational status.</DialogDescription>
          </DialogHeader>
          {editingSeat && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Display Name (optional)</Label>
                <Input
                  className="mt-1"
                  placeholder={`Seat ${editingSeat.number}`}
                  value={seatForm.label}
                  onChange={e => setSeatForm(f => ({ ...f, label: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground mt-1">e.g. "VIP-1", "Stream Booth"</p>
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1.5"><Cpu className="h-3 w-3" /> GPU Model</Label>
                <Select value={seatForm.gpuModel} onValueChange={v => setSeatForm(f => ({ ...f, gpuModel: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GPU_MODEL_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Status</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['available', 'occupied', 'maintenance'] as const).map(s => {
                    const active = seatForm.status === s;
                    const Icon = s === 'available' ? CheckCircle2 : s === 'occupied' ? User : Wrench;
                    const activeTone = s === 'available'
                      ? 'bg-success/15 border-success/40 text-success ring-1 ring-success/30'
                      : s === 'occupied'
                      ? 'bg-destructive/15 border-destructive/40 text-destructive ring-1 ring-destructive/30'
                      : 'bg-warning/15 border-warning/40 text-warning ring-1 ring-warning/30';
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeatForm(f => ({ ...f, status: s }))}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 rounded-lg border p-2.5 text-xs capitalize transition-all',
                          active ? activeTone : 'border-border hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {s}
                      </button>
                    );
                  })}
                </div>
                {editingSeat.status === 'occupied' && seatForm.status !== 'occupied' && (
                  <p className="text-[11px] text-warning mt-1.5">Changing away from "occupied" will clear the active player session.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditingSeat(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editingSeat) return;
                const wasOccupied = editingSeat.status === 'occupied';
                const becomesNonOccupied = seatForm.status !== 'occupied';
                const newLabel = seatForm.label.trim() || undefined;
                const branchName = selectedBranch?.name || '';
                const logChange = (field: 'label' | 'gpuModel' | 'status', from: string, to: string) => {
                  if (from === to) return;
                  if (!currentUser) return;
                  useSeatActivityStore.getState().log({
                    seatId: editingSeat.id,
                    seatNumber: editingSeat.number,
                    branchId: editingSeat.branchId,
                    branchName,
                    field,
                    fromValue: from,
                    toValue: to,
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    actorRole: ROLE_LABELS[currentUser.role],
                  });
                };
                logChange('label', editingSeat.label || '—', newLabel || '—');
                logChange('gpuModel', editingSeat.gpuModel || '—', seatForm.gpuModel);
                logChange('status', editingSeat.status, seatForm.status);
                updateSeat(editingSeat.id, {
                  label: newLabel,
                  gpuModel: seatForm.gpuModel,
                  status: seatForm.status,
                  ...(wasOccupied && becomesNonOccupied ? { playerName: undefined, startTime: undefined, endTime: undefined } : {}),
                });
                toast.success(`Seat #${editingSeat.number} updated`);
                setEditingSeat(null);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShiftManagementDialog
        open={showShiftDialog}
        onOpenChange={setShowShiftDialog}
        branch={selectedBranch}
      />
    </div>
  );
}
