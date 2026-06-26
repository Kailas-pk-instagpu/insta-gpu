import { useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, AlertTriangle, CheckCircle, Info, Filter, ArrowUpDown } from 'lucide-react';
import { useNotificationStore } from '@/shared/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TablePagination from '@/shared/ui/molecules/TablePagination';

const typeIcon = {
  error: <AlertCircle className="h-5 w-5 text-destructive" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  success: <CheckCircle className="h-5 w-5 text-success" />,
  info: <Info className="h-5 w-5 text-info" />,
};

const typeBg = {
  error: 'bg-destructive/10',
  warning: 'bg-warning/10',
  success: 'bg-success/10',
  info: 'bg-info/10',
};

const typeLabel: Record<string, string> = {
  error: 'Error',
  warning: 'Warning',
  success: 'Success',
  info: 'Info',
};

const PREVIEW_LIMIT = 90;

// Convert relative timestamp strings into a sortable score (smaller = more recent).
function timeRank(t: string): number {
  const m = t.match(/(\d+)\s*(min|hour|day|week|month)/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult: Record<string, number> = { min: 1, hour: 60, day: 1440, week: 10080, month: 43200 };
  return n * (mult[unit] ?? 1);
}

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [preview, setPreview] = useState<typeof notifications[number] | null>(null);

  const filtered = useMemo(() => {
    let list = notifications.slice();
    if (typeFilter !== 'all') list = list.filter(n => n.type === typeFilter);
    if (readFilter === 'read') list = list.filter(n => n.read);
    if (readFilter === 'unread') list = list.filter(n => !n.read);
    list.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return timeRank(b.timestamp) - timeRank(a.timestamp);
        case 'type': return a.type.localeCompare(b.type);
        case 'title': return a.title.localeCompare(b.title);
        case 'newest':
        default: return timeRank(a.timestamp) - timeRank(b.timestamp);
      }
    });
    return list;
  }, [notifications, typeFilter, readFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-xs ml-1">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all your notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <CardTitle className="text-base">
              All Notifications ({filtered.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All types</SelectItem>
                    <SelectItem value="info" className="text-xs">Info</SelectItem>
                    <SelectItem value="success" className="text-xs">Success</SelectItem>
                    <SelectItem value="warning" className="text-xs">Warning</SelectItem>
                    <SelectItem value="error" className="text-xs">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All status</SelectItem>
                  <SelectItem value="unread" className="text-xs">Unread only</SelectItem>
                  <SelectItem value="read" className="text-xs">Read only</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest" className="text-xs">Newest first</SelectItem>
                    <SelectItem value="oldest" className="text-xs">Oldest first</SelectItem>
                    <SelectItem value="type" className="text-xs">By type</SelectItem>
                    <SelectItem value="title" className="text-xs">By title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-medium text-foreground">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting filters to see more results.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {paged.map(n => {
                  const isLong = n.message.length > PREVIEW_LIMIT;
                  const shown = isLong ? `${n.message.slice(0, PREVIEW_LIMIT).trimEnd()}…` : n.message;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 px-6 py-4 transition-colors ${!n.read ? 'bg-accent/20' : ''} hover:bg-muted/30`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${typeBg[n.type]}`}>
                        {typeIcon[n.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                              {n.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {shown}
                              {isLong && (
                                <button
                                  onClick={() => setPreview(n)}
                                  className="ml-1.5 text-xs font-medium text-primary hover:underline"
                                >
                                  Read more
                                </button>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-[10px]">{typeLabel[n.type]}</Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{n.timestamp}</span>
                          </div>
                        </div>
                        {!n.read && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary hover:text-primary" onClick={() => markAsRead(n.id)}>
                              <Check className="h-3.5 w-3.5" />
                              Mark as read
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <TablePagination
                total={filtered.length}
                page={safePage}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                itemLabel="notifications"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg">
          {preview && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${typeBg[preview.type]}`}>
                    {typeIcon[preview.type]}
                  </div>
                  <div>
                    <DialogTitle className="text-base">{preview.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{typeLabel[preview.type]}</Badge>
                      <span className="text-xs">{preview.timestamp}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {preview.message}
              </div>
              {!preview.read && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { markAsRead(preview.id); setPreview(null); }}>
                    <Check className="h-3.5 w-3.5" /> Mark as read
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
