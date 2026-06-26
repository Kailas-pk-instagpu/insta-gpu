import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { getRoutesForRole } from '@/shared/lib/rbac';

import {
  LayoutDashboard, Users, Cpu, Building2, Monitor, BarChart3, Settings, Gamepad2,
  Bell, CalendarCheck, Wallet, Receipt, Radar, UserMinus, AlertTriangle, ClipboardList, ChevronRight,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Cpu, Building2, Monitor, BarChart3, Settings, Bell, CalendarCheck, Wallet, Receipt, Radar, UserMinus, AlertTriangle, ClipboardList,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function AppSidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return null;

  const routes = getRoutesForRole(user.role);
  const initials = (user.name || user.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-r-0"
    >
      {/* Wrap inner sidebar shell with extra rounding + shadow to mimic floating card */}
      <SidebarHeader className="px-3 pt-4 pb-3 group-data-[collapsible=icon]:px-2 transition-all duration-300">
        <div className="flex items-center gap-3 min-w-0 group-data-[collapsible=icon]:justify-center">
          <div className="w-10 h-10 min-w-[2.5rem] rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="overflow-hidden transition-all duration-300 ease-out group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight whitespace-nowrap">GPU Cloud</h2>
            <p className="text-[10px] italic font-medium text-muted-foreground mt-0.5 whitespace-nowrap">Beyond Hardware</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-2 transition-all duration-300">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold px-2 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {routes.map((route) => {
                const Icon = ICON_MAP[route.icon] || LayoutDashboard;
                const active = location.pathname === route.path;
                return (
                  <SidebarMenuItem key={route.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(route.path)}
                      tooltip={route.label}
                      className={cn(
                        'group/item relative h-11 rounded-2xl px-3 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                        'group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-transform duration-300', active && 'scale-110')} />
                      <span className="font-medium text-[13px] tracking-tight group-data-[collapsible=icon]:hidden">
                        {route.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="min-w-0 overflow-hidden">
          <p className="text-[10px] text-sidebar-foreground/60 leading-tight truncate">{greeting()}</p>
          <p className="text-[13px] font-semibold text-sidebar-accent-foreground leading-tight truncate">
            {user.name || user.email}
          </p>
        </div>
      </SidebarFooter>

    </Sidebar>
  );
}
