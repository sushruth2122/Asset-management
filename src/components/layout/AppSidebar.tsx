import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  LayoutDashboard,
  Database,
  Activity,
  ClipboardList,
  Wrench,
  MapPin,
  BarChart3,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Admin Overview', href: '/admin', icon: ShieldCheck, adminOnly: true },
  { label: 'Asset Master', href: '/assets', icon: Database },
  { label: 'Asset Health', href: '/asset-health', icon: Activity },
  { label: 'Work Orders', href: '/work-orders', icon: ClipboardList },
  { label: 'Spare Parts', href: '/spare-parts', icon: Wrench },
  { label: 'GIS Tracking', href: '/gis-tracking', icon: MapPin },
  { label: 'Reports', href: '/reports', icon: BarChart3, adminOnly: true },
];

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { role } = useAuth();
  const location = useLocation();
  const isAdmin = role === 'admin';

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.href === '/admin' || item.href === '/dashboard') {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Logo */}
      <div className="flex h-[var(--header-height)] items-center border-b border-sidebar-border px-4">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Box className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-semibold text-sidebar-foreground animate-fade-in">
              Astrikos
            </span>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const active = isActive(item);
          const link = (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'nav-item',
                active && 'nav-item-active',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.label} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onToggle}
          className="nav-item w-full justify-center"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
