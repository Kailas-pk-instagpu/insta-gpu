import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, ScrollText, History } from 'lucide-react';
import LiveSessionsMonitor from '@/features/monitoring/LiveSessionsMonitor';
import FailedTransactionsMonitor from '@/features/monitoring/FailedTransactionsMonitor';
import ApplicationLogsMonitor from '@/features/monitoring/ApplicationLogsMonitor';
import SeatActivityMonitor from '@/features/monitoring/SeatActivityMonitor';
import { useAuthStore } from '@/shared/lib/store';

export default function MonitoringPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Network Monitoring
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live sessions across every cafe and a real-time view of failed billing transactions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions" className="gap-2">
            <Activity className="h-4 w-4" /> Live Sessions
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Failed Transactions
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" /> Logs
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="seat-activity" className="gap-2">
              <History className="h-4 w-4" /> Seat Activity
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="sessions" className="m-0">
          <LiveSessionsMonitor />
        </TabsContent>
        <TabsContent value="failed" className="m-0">
          <FailedTransactionsMonitor />
        </TabsContent>
        <TabsContent value="logs" className="m-0">
          <ApplicationLogsMonitor />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="seat-activity" className="m-0">
            <SeatActivityMonitor />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
