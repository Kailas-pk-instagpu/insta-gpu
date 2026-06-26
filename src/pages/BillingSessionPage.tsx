import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ActiveSessionDashboard from '@/features/billing/ActiveSessionDashboard';
import CafeOwnerActiveSessionsOverview from '@/features/billing/CafeOwnerActiveSessionsOverview';
import { useAuthStore, useBranchStore, useSettlementStore } from '@/shared/lib/store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, Building2, Banknote, Lock, User as UserIcon, Wallet, Receipt, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_CUSTOMER_WALLETS } from '@/shared/lib/mock-data';
import { toast } from '@/hooks/use-toast';

import SettlementsPage from './SettlementsPage';

export default function BillingSessionPage() {
  const { user } = useAuthStore();
  const branches = useBranchStore((s) => s.branches);
  const addSettlement = useSettlementStore((s) => s.addSettlement);
  const navigate = useNavigate();

  // Cafe owners and managers manage user billing; admins/super-admins are view-only on settlements
  const canManage = user?.role === 'cafe_owner' || user?.role === 'manager';
  const isSettlementViewer = user?.role === 'super_admin' || user?.role === 'admin';

  const visibleBranches = useMemo(() => {
    if (!user) return [];
    if (user.role === 'cafe_owner') return branches.filter((b) => b.cafeOwnerId === user.id);
    if (user.role === 'manager') return branches.filter((b) => b.managerId === user.id);
    if (user.role === 'admin') return branches.filter((b) => b.adminId === user.id);
    return branches;
  }, [branches, user]);

  const [searchParams] = useSearchParams();
  const urlBranchId = searchParams.get('branchId');
  const urlCustomerId = searchParams.get('customerId');

  const [branchId, setBranchId] = useState<string>(urlBranchId ?? visibleBranches[0]?.id ?? '');
  const [branchOpen, setBranchOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const branch = visibleBranches.find((b) => b.id === branchId) ?? visibleBranches[0];

  const branchCustomers = useMemo(
    () => MOCK_CUSTOMER_WALLETS.filter((c) => c.branchId === branch?.id),
    [branch?.id]
  );

  const [customerId, setCustomerId] = useState<string>(urlCustomerId ?? branchCustomers[0]?.id ?? '');
  const customer =
    branchCustomers.find((c) => c.id === customerId) ?? branchCustomers[0];

  useEffect(() => {
    if (urlBranchId && urlBranchId !== branchId) setBranchId(urlBranchId);
    if (urlCustomerId && urlCustomerId !== customerId) setCustomerId(urlCustomerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBranchId, urlCustomerId]);

  // Stable session id + start time per (branch, customer) pair so settlement records are consistent
  const sessionMetaRef = useRef<Record<string, { sessionId: string; startTime: Date }>>({});
  const sessionKey = `${branch?.id ?? ''}-${customer?.id ?? ''}`;
  if (sessionKey && !sessionMetaRef.current[sessionKey]) {
    sessionMetaRef.current[sessionKey] = {
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
    };
  }
  const sessionMeta = sessionMetaRef.current[sessionKey];

  const handleEndSession = (summary: { durationSec: number; usageCost: number; refund: number }) => {
    if (!user || !branch || !customer || !canManage) return;
    if (user.role !== 'cafe_owner' && user.role !== 'manager') return;
    const settlement = addSettlement({
      sessionId: sessionMeta.sessionId,
      branchId: branch.id,
      branchName: branch.name,
      customerId: customer.id,
      customerName: customer.name,
      startTime: sessionMeta.startTime.toISOString(),
      endTime: new Date().toISOString(),
      durationSec: summary.durationSec,
      costPerMinute: branch.billing.costPerMinute,
      lockedAmount: customer.lockedAmount,
      usageCost: summary.usageCost,
      refund: summary.refund,
      settledBy: user.id,
      settledByRole: user.role,
    });
    toast({
      title: 'Session settled',
      description: `${customer.name} · Usage RM ${summary.usageCost.toFixed(2)} · Refund RM ${summary.refund.toFixed(2)}`,
    });
    // Reset stable meta so next session for same pair gets a fresh id
    delete sessionMetaRef.current[sessionKey];
    void settlement;
  };

  // Super admins and admins are restricted to viewing/downloading settlements only.
  if (isSettlementViewer) {
    return <SettlementsPage />;
  }

  // Cafe owners see an overview of all active sessions across their branches.
  // The detailed view is opened by clicking a session (which adds customerId to the URL).
  if ((user?.role === 'cafe_owner' || user?.role === 'manager') && !urlCustomerId) {
    return <CafeOwnerActiveSessionsOverview />;
  }

  if (!branch) {
    return (
      <Alert>
        <AlertTitle>No branches available</AlertTitle>
        <AlertDescription>You don't have any branches assigned to view billing sessions.</AlertDescription>
      </Alert>
    );
  }

  const showBack = user?.role === 'cafe_owner' || user?.role === 'manager';

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-between items-center gap-2">
          {showBack ? (
            <Button variant="ghost" size="sm" onClick={() => navigate('/billing/session')}>
              <ArrowLeft className="h-4 w-4" /> Back to sessions
            </Button>
          ) : <span />}
          <Button variant="outline" size="sm" onClick={() => navigate('/billing/settlements')}>
            <Receipt className="h-4 w-4" /> View Settlements
          </Button>
        </div>
      )}

      {!canManage && (
        <Alert className="border-primary/30 bg-primary/5">
          <Eye className="h-4 w-4" />
          <AlertTitle>View-only access</AlertTitle>
          <AlertDescription>
            User billing is managed by cafe owners and managers. You can view live bills but cannot end sessions.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Branch
            </Label>
            <Popover open={branchOpen} onOpenChange={setBranchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={branchOpen}
                  className="w-full justify-between font-normal"
                >
                  {branch?.name ?? 'Select branch'}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search branch..." />
                  <CommandList>
                    <CommandEmpty>No branch found.</CommandEmpty>
                    <CommandGroup>
                      {visibleBranches.map((b) => (
                        <CommandItem
                          key={b.id}
                          value={b.name}
                          onSelect={() => {
                            setBranchId(b.id);
                            const first = MOCK_CUSTOMER_WALLETS.find((c) => c.branchId === b.id);
                            setCustomerId(first?.id ?? '');
                            setBranchOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', branch?.id === b.id ? 'opacity-100' : 'opacity-0')} />
                          {b.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" /> Customer
            </Label>
            {branchCustomers.length > 0 ? (
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="w-full justify-between font-normal"
                  >
                    {customer ? `${customer.name} · RM ${customer.balance}` : 'Select customer'}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {branchCustomers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setCustomerId(c.id);
                              setCustomerOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', customer?.id === c.id ? 'opacity-100' : 'opacity-0')} />
                            {c.name} · RM {c.balance}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-sm text-muted-foreground">No customers</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" /> Branch Rate
            </div>
            <p className="font-mono text-xl font-bold">
              RM {branch.billing.costPerMinute.toFixed(2)}{' '}
              <span className="text-xs text-muted-foreground font-normal">/ min</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Wallet Balance
            </div>
            <p className="font-mono text-xl font-bold">
              RM {(customer?.balance ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Locked RM {(customer?.lockedAmount ?? branch.billing.lockedAmount).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {customer ? (
        <ActiveSessionDashboard
          key={sessionKey}
          sessionId={sessionMeta.sessionId}
          startTime={sessionMeta.startTime}
          readOnly={!canManage}
          lockedAmount={customer.lockedAmount}
          costPerMinute={branch.billing.costPerMinute}
          branchName={`${branch.name} · ${customer.name}`}
          onEndSession={handleEndSession}
        />
      ) : (
        <Alert>
          <AlertTitle>No active customer</AlertTitle>
          <AlertDescription>This branch has no customers with a wallet yet.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
