import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Box,
  LayoutDashboard,
  Database,
  Wrench,
  BarChart3,
  LogOut,
  User,
  MapPin,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function TopNav() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', href: role === 'admin' ? '/admin' : '/dashboard', icon: LayoutDashboard },
    { label: 'Asset Master', href: '/assets', icon: Database },
    { label: 'Asset Health', href: '/asset-health', icon: Activity },
    { label: 'Work Orders', href: '/work-orders', icon: ClipboardList },
    { label: 'Spare Parts', href: '/spare-parts', icon: Wrench },
    { label: 'GIS Tracking', href: '/gis-tracking', icon: MapPin },
    { label: 'Reports', href: '/reports', icon: BarChart3, adminOnly: true },
  ];

  const isActive = (href: string) => location.pathname === href;

  const getUserInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  // Filter out admin-only items for non-admin users
  const visibleNavItems = navItems.filter(item => !item.adminOnly || role === 'admin');

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Box className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Astrikos Asset Manager</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`nav-item ${isActive(item.href) ? 'nav-item-active' : ''}`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationDropdown />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {role || 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
