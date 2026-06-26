import { useEffect, useRef, useState } from 'react';
import { Bell, Moon, Sun, Check, CheckCheck, AlertTriangle, Info, AlertCircle, CheckCircle, LogOut, Settings } from 'lucide-react';
import { DynamicIslandToasts } from './DynamicIslandToasts';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { useNotificationStore } from '@/shared/lib/store';
import { ROLE_LABELS } from '@/shared/types/auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose
} from '@/components/ui/sheet';
import { ArrowRight } from 'lucide-react';
import { IntegrationsStatusIndicator } from '@/shared/ui/atoms/IntegrationsStatusIndicator';

const typeIcon = {
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  success: <CheckCircle className="h-4 w-4 text-success" />,
  info: <Info className="h-4 w-4 text-info" />,
};

const typeBg = {
  error: 'bg-destructive/10',
  warning: 'bg-warning/10',
  success: 'bg-success/10',
  info: 'bg-info/10',
};

export function AppNavbar() {
  const { user, theme, toggleTheme, logout } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, lastIncoming } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const bellRef = useRef<HTMLButtonElement>(null);
  const [bellPulse, setBellPulse] = useState(0);
  const [badgePop, setBadgePop] = useState(0);
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastIncoming && lastIncoming.id !== lastIdRef.current) {
      lastIdRef.current = lastIncoming.id;
      setBellPulse((n) => n + 1);
      if (!lastIncoming.read) {
        setBadgePop((n) => n + 1);
      }
    }
  }, [lastIncoming]);

  return (
    <header className="sticky top-2 z-40 ml-0 mr-2 mt-2 h-14 rounded-2xl border-[1.5px] border-border dark:border-sidebar-border bg-background/10 dark:bg-sidebar/10 backdrop-blur-md flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-sidebar-foreground/70 hover:text-sidebar-accent-foreground" />
      </div>


      <div className="flex items-center gap-2">
        <IntegrationsStatusIndicator />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors focus:outline-none">
                {user.logoUrl ? (
                  <img src={user.logoUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              ref={bellRef}
              variant="ghost"
              size="icon"
              className={`h-9 w-9 relative text-muted-foreground hover:text-foreground transition-transform ${bellPulse ? 'bell-ring' : ''}`}
              key={bellPulse}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  key={badgePop}
                  className={`absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] bg-destructive text-destructive-foreground border-0 shadow-[0_0_0_2px_hsl(var(--background))] ${badgePop ? 'badge-pop' : ''}`}
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
            <SheetHeader className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg">
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">{unreadCount} new</Badge>
                  )}
                </SheetTitle>
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                <TooltipProvider>
                  {unreadCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={markAllAsRead}>
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mark all notifications as read</TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
                </div>
              )}
            </SheetHeader>
            <Separator />
            <ScrollArea className="flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex gap-3 transition-colors ${!n.read ? 'bg-accent/30' : ''} hover:bg-muted/50`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${typeBg[n.type]}`}>
                        {typeIcon[n.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {!n.read && (
                            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1 text-primary hover:text-primary" onClick={() => markAsRead(n.id)}>
                              <Check className="h-3 w-3" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <Separator />
            <div className="p-3">
              <SheetClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-1.5 text-xs"
                  onClick={() => navigate('/notifications')}
                >
                  View all notifications
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <DynamicIslandToasts anchorRef={bellRef} onCollapse={() => setBellPulse((n) => n + 1)} />
    </header>
  );
}
