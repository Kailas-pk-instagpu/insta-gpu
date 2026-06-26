import { useState } from 'react';
import { REVENUE_DATA, MONTHLY_REVENUE, MOCK_BRANCHES, MOCK_SEATS } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, CalendarDays, ArrowUpRight, ArrowDownRight, Percent, BarChart3 } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Revenue growth rate (month-over-month)
const GROWTH_RATE = MONTHLY_REVENUE.map((m, i) => ({
  name: m.name,
  revenue: m.revenue,
  growth: i === 0 ? 0 : Math.round(((m.revenue - MONTHLY_REVENUE[i - 1].revenue) / MONTHLY_REVENUE[i - 1].revenue) * 1000) / 10,
}));

// Revenue per seat per branch
const BRANCH_EFFICIENCY = MOCK_BRANCHES.map(b => ({
  name: b.name.split(' ').slice(0, 2).join(' '),
  revenuePerSeat: Math.round((b.activeSeats * 320 + Math.random() * 2000) / b.totalSeats),
  occupancy: Math.round((b.activeSeats / b.totalSeats) * 100),
}));

// Session duration distribution
const SESSION_DURATION = [
  { range: '< 1hr', count: 18, pct: 12 },
  { range: '1-2hr', count: 42, pct: 28 },
  { range: '2-3hr', count: 55, pct: 37 },
  { range: '3-4hr', count: 22, pct: 15 },
  { range: '4hr+', count: 12, pct: 8 },
];

// Customer retention
const RETENTION_DATA = [
  { name: 'Week 1', newUsers: 120, returning: 0 },
  { name: 'Week 2', newUsers: 85, returning: 78 },
  { name: 'Week 3', newUsers: 92, returning: 112 },
  { name: 'Week 4', newUsers: 68, returning: 145 },
  { name: 'Week 5', newUsers: 74, returning: 160 },
  { name: 'Week 6', newUsers: 56, returning: 172 },
];

// Yearly data
const YEARLY_REVENUE = [
  { name: '2020', revenue: 620000 },
  { name: '2021', revenue: 780000 },
  { name: '2022', revenue: 950000 },
  { name: '2023', revenue: 1120000 },
  { name: '2024', revenue: 1350000 },
  { name: '2025', revenue: 1580000 },
];

const YEARLY_GROWTH = YEARLY_REVENUE.map((y, i) => ({
  ...y,
  growth: i === 0 ? 0 : Math.round(((y.revenue - YEARLY_REVENUE[i - 1].revenue) / YEARLY_REVENUE[i - 1].revenue) * 1000) / 10,
}));

// Revenue vs cost
const PROFIT_MARGIN = [
  { name: 'Jan', revenue: 82000, costs: 48000, profit: 34000 },
  { name: 'Feb', revenue: 95000, costs: 52000, profit: 43000 },
  { name: 'Mar', revenue: 110000, costs: 58000, profit: 52000 },
  { name: 'Apr', revenue: 102000, costs: 55000, profit: 47000 },
  { name: 'May', revenue: 125000, costs: 62000, profit: 63000 },
  { name: 'Jun', revenue: 138000, costs: 65000, profit: 73000 },
];

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};
const tickStyle = { fill: 'hsl(220, 9%, 46%)', fontSize: 11 };

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h]).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DownloadBtn({ data, filename }: { data: Record<string, unknown>[]; filename: string }) {
  return (
    <Button variant="ghost" size="sm" onClick={() => downloadCSV(data, filename)} className="h-7 px-2">
      <Download className="h-3.5 w-3.5" />
    </Button>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const growthData = period === 'monthly' ? GROWTH_RATE : YEARLY_GROWTH;
  const profitData = period === 'monthly' ? PROFIT_MARGIN : YEARLY_REVENUE.map(y => ({ name: y.name, revenue: y.revenue, costs: Math.round(y.revenue * 0.42), profit: Math.round(y.revenue * 0.58) }));

  // Summary stats
  const totalRevenue = profitData.reduce((s, d) => s + (d as any).revenue, 0);
  const totalProfit = profitData.reduce((s, d) => s + ((d as any).profit || 0), 0);
  const avgGrowth = Math.round(growthData.filter(d => d.growth !== 0).reduce((s, d) => s + d.growth, 0) / growthData.filter(d => d.growth !== 0).length * 10) / 10;
  const retentionRate = Math.round((RETENTION_DATA[RETENTION_DATA.length - 1].returning / (RETENTION_DATA[RETENTION_DATA.length - 1].returning + RETENTION_DATA[RETENTION_DATA.length - 1].newUsers)) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Deep performance insights & trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as 'monthly' | 'yearly')}>
            <SelectTrigger className="w-[130px]">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => downloadCSV(profitData as any, `${period}-analytics.csv`)}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export All</span>
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: `RM ${(totalRevenue / 1000).toFixed(0)}k`, sub: period === 'monthly' ? '6 months' : '6 years', icon: BarChart3, color: 'text-primary' },
          { label: 'Net Profit', value: `RM ${(totalProfit / 1000).toFixed(0)}k`, sub: `${Math.round((totalProfit / totalRevenue) * 100)}% margin`, icon: ArrowUpRight, color: 'text-emerald-500' },
          { label: 'Avg Growth', value: `${avgGrowth}%`, sub: 'period over period', icon: avgGrowth >= 0 ? ArrowUpRight : ArrowDownRight, color: avgGrowth >= 0 ? 'text-emerald-500' : 'text-red-500' },
          { label: 'Retention Rate', value: `${retentionRate}%`, sub: 'returning users', icon: Percent, color: 'text-primary' },
        ].map((m) => (
          <Card key={m.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div className="text-xl font-bold">{m.value}</div>
              <span className="text-[11px] text-muted-foreground">{m.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profit & Loss + Growth Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Profit & Loss</CardTitle>
              <CardDescription className="text-xs">Revenue vs costs breakdown</CardDescription>
            </div>
            <DownloadBtn data={profitData as any} filename={`${period}-profit-loss.csv`} />
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} tickFormatter={v => `RM ${v / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`RM ${v.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="costs" fill="hsl(0, 70%, 60%)" radius={[4, 4, 0, 0]} opacity={0.7} name="Costs" />
                  <Bar dataKey="profit" fill="hsl(152, 69%, 45%)" radius={[4, 4, 0, 0]} name="Profit" />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 64%)" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Growth Rate</CardTitle>
              <CardDescription className="text-xs">Period-over-period revenue change</CardDescription>
            </div>
            <DownloadBtn data={growthData} filename={`${period}-growth.csv`} />
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growthData}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis yAxisId="rev" tick={tickStyle} tickFormatter={v => `RM ${v / 1000}k`} />
                  <YAxis yAxisId="growth" orientation="right" tick={tickStyle} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 64%)" fill="url(#growthGrad)" strokeWidth={2} name="Revenue" />
                  <Line yAxisId="growth" type="monotone" dataKey="growth" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="Growth %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Efficiency + Session Duration + Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Revenue per Seat</CardTitle>
              <CardDescription className="text-xs">Branch efficiency comparison</CardDescription>
            </div>
            <DownloadBtn data={BRANCH_EFFICIENCY} filename="branch-efficiency.csv" />
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BRANCH_EFFICIENCY} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={tickStyle} tickFormatter={v => `RM ${v}`} />
                  <YAxis type="category" dataKey="name" tick={tickStyle} width={90} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === 'revenuePerSeat' ? `RM ${v}` : `${v}%`, name === 'revenuePerSeat' ? 'RM/Seat' : 'Occupancy']} />
                  <Bar dataKey="revenuePerSeat" fill="hsl(234, 89%, 64%)" radius={[0, 4, 4, 0]} name="$/Seat" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session Duration</CardTitle>
            <CardDescription className="text-xs">How long customers stay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SESSION_DURATION}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="range" tick={tickStyle} />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === 'count' ? `${v} sessions` : `${v}%`, name === 'count' ? 'Sessions' : 'Share']} />
                  <Bar dataKey="count" fill="hsl(270, 60%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">User Retention</CardTitle>
              <CardDescription className="text-xs">New vs returning customers</CardDescription>
            </div>
            <DownloadBtn data={RETENTION_DATA} filename="retention.csv" />
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={RETENTION_DATA}>
                  <defs>
                    <linearGradient id="retNewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="retRetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="newUsers" stroke="hsl(234, 89%, 64%)" fill="url(#retNewGrad)" strokeWidth={2} name="New Users" />
                  <Area type="monotone" dataKey="returning" stroke="hsl(152, 69%, 45%)" fill="url(#retRetGrad)" strokeWidth={2} name="Returning" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
