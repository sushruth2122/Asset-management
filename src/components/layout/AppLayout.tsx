import { useState, useCallback, useEffect } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * AppLayout – wraps every authenticated page.
 * Provides: collapsible sidebar (desktop), sheet drawer (mobile), header bar.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  // Close mobile drawer on route change (handled by children remount)
  useEffect(() => {
    setMobileOpen(false);
  }, [children]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar (hidden below lg) */}
      <div className="hidden lg:block">
        <AppSidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[var(--sidebar-width)] p-0">
          <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <AppHeader
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={() => setMobileOpen(true)}
      />

      {/* Main content area */}
      <main
        className={cn(
          'pt-[var(--header-height)] transition-[margin-left] duration-200 ease-in-out',
          collapsed ? 'lg:ml-[var(--sidebar-width-collapsed)]' : 'lg:ml-[var(--sidebar-width)]'
        )}
      >
        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
