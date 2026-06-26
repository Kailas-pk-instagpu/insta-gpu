import { StatCard } from '@/shared/ui/molecules/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_USERS, MOCK_BRANCHES, REVENUE_DATA } from '@/shared/lib/mock-data';
import { Building2, Banknote, Users, TrendingUp, UserCheck, AlertCircle, Activity, Star, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const OWNER_PERFORMANCE = [
  { name: 'Sam Rivera', revenue: 52000, branches: 2, occupancy: 72 },
  { name: 'Casey Park', revenue: 43200, branches: 2, occupancy: 68 },
];

const COMPLIANCE_DATA = [
  { label: '2FA Enabled', count: MOCK_USERS.filter(u => u.is2FAEnabled).length, total: MOCK_USERS.length, color: 'hsl(var(--success))' },
  { label: 'Active Branches', count: MOCK_BRANCHES.filter(b => b.status === 'active').length, total: MOCK_BRANCHES.length, color: 'hsl(var(--info))' },
];

const BRANCH_REVENUE = MOCK_BRANCHES.map(b => ({
  name: b.name.split(' ')[0],
  revenue: Math.round(b.activeSeats * 320 + Math.random() * 5000),
  sessions: b.activeSeats * 8,
}));

export default function AdminDashboard() {
  const navigate = useNavigate();
  const cafeOwners = MOCK_USERS.filter(u => u.role === 'cafe_owner');
  const managers = MOCK_USERS.filter(u => u.role === 'manager');
  const totalSeats = MOCK_BRANCHES.reduce((a, b) => a + b.totalSeats, 0);
  const activeSeats = MOCK_BRANCHES.reduce((a, b) => a + b.activeSeats, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your portfolio of cafes and operators</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/branches')}>
          <Building2 className="h-4 w-4" /> View All Branches
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard title="Portfolio Revenue" value="RM 95,200" icon={Banknote} trend={{ value: 15, positive: true }} iconClassName="bg-success/10 text-success" />
        <StatCard title="Cafe Owners" value={cafeOwners.length} icon={Users} subtitle="Active operators" iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Branches" value={MOCK_BRANCHES.length} icon={Building2} subtitle={`${MOCK_BRANCHES.filter(b => b.status === 'active').length} active`} iconClassName="bg-info/10 text-info" />
        <StatCard title="Managers" value={managers.length} icon={UserCheck} subtitle="On-ground staff" iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Seat Occupancy" value={`${Math.round((activeSeats/totalSeats)*100)}%`} subtitle={`${activeSeats}/${totalSeats}`} icon={Activity} iconClassName="bg-destructive/10 text-destructive" />
        <StatCard title="Growth" value="+15%" icon={TrendingUp} subtitle="vs last month" iconClassName="bg-accent-foreground/10 text-accent-foreground" />
      </div>

      {/* Revenue + Branch Revenue Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Weekly Revenue</CardTitle>
            <CardDescription>Revenue trend across your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pb-4">
            <div className="h-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `RM ${v}`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="hsl(234, 89%, 64%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue by Branch</CardTitle>
            <CardDescription>Compare branch performance</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pb-4">
            <div className="h-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BRANCH_REVENUE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={v => `RM ${v/1000}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`RM ${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cafe Owner Performance + Branch Overview + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cafe Owner Performance</CardTitle>
            <CardDescription>Revenue and occupancy by operator</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-3">
            {OWNER_PERFORMANCE.map((owner, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{owner.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{owner.name}</p>
                      <p className="text-xs text-muted-foreground">{owner.branches} branches</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">${(owner.revenue / 1000).toFixed(1)}k</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Occupancy</span>
                    <span>{owner.occupancy}%</span>
                  </div>
                  <Progress value={owner.occupancy} className="h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Branch Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-3">
            {MOCK_BRANCHES.map(branch => (
              <div key={branch.id} className="flex items-center justify-between p-3 sm:p-3 rounded-lg bg-muted/50 touch-manipulation">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{branch.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{branch.address}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-medium">{branch.activeSeats}/{branch.totalSeats}</span>
                    <p className="text-[11px] sm:text-[10px] text-muted-foreground">seats</p>
                  </div>
                  <StatusBadge status={branch.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Compliance & Security</CardTitle>
            <CardDescription>Platform security overview</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="space-y-3">
              {COMPLIANCE_DATA.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.count}/{item.total}</span>
                  </div>
                  <Progress value={(item.count / item.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex-1 flex flex-col gap-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Activity</h4>
              <div className="flex-1 flex flex-col justify-between gap-2">
                {[
                  { action: 'New manager added', user: 'Sam Rivera', time: '2h ago' },
                  { action: 'Branch status changed', user: 'System', time: '5h ago' },
                  { action: 'Password reset', user: 'Casey Park', time: '1d ago' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-3 sm:p-2 rounded-lg sm:rounded bg-muted/30 touch-manipulation gap-2">
                    <div className="min-w-0">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground"> · {log.user}</span>
                    </div>
                    <span className="text-[11px] sm:text-xs text-muted-foreground flex-shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-5 sm:py-4 min-h-[88px] sm:min-h-0 touch-manipulation" onClick={() => navigate('/users')}>
              <Users className="h-6 w-6 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-5 sm:py-4 min-h-[88px] sm:min-h-0 touch-manipulation" onClick={() => navigate('/branches')}>
              <Building2 className="h-6 w-6 sm:h-5 sm:w-5 text-info" />
              <span className="text-xs">Add Branch</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-5 sm:py-4 min-h-[88px] sm:min-h-0 touch-manipulation" onClick={() => navigate('/analytics')}>
              <TrendingUp className="h-6 w-6 sm:h-5 sm:w-5 text-success" />
              <span className="text-xs">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-5 sm:py-4 min-h-[88px] sm:min-h-0 touch-manipulation" onClick={() => navigate('/settings')}>
              <Star className="h-6 w-6 sm:h-5 sm:w-5 text-warning" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
