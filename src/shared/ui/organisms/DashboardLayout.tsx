import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppNavbar } from './AppNavbar';
import { ManagerBillingBanner } from '@/features/billing/ManagerBillingBanner';
import { PageTransition } from '@/shared/ui/motion/PageTransition';
import { AnimatePresence, motion } from 'framer-motion';

function SidebarOverlay() {
  const { open, isMobile, setOpen } = useSidebar();
  // Soft overlay behind sidebar when expanded on desktop (subtle), helps focus
  const show = !isMobile && open;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-none fixed inset-0 z-[5] bg-black/0"
          onClick={() => setOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}

export function DashboardLayout() {
  const { isAuthenticated, user, is2FAVerified } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (user.is2FAEnabled && !is2FAVerified) return <Navigate to="/verify-2fa" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarOverlay />
        <div className="flex-1 flex flex-col min-w-0">
          <AppNavbar />
          <ManagerBillingBanner />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

