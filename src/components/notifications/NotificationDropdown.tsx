import { useState } from 'react';
import { Bell, Check, CheckCheck, Wrench, AlertTriangle, ClipboardList, UserCheck, Info, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  useNotifications, 
  useUnreadNotificationCount, 
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  Notification 
} from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<Notification['type'], React.ComponentType<{ className?: string }>> = {
  maintenance: Wrench,
  warranty: AlertTriangle,
  work_order: ClipboardList,
  approval: UserCheck,
  system: Info,
};

const typeColors: Record<Notification['type'], string> = {
  maintenance: 'bg-blue-500/20 text-blue-400',
  warranty: 'bg-yellow-500/20 text-yellow-400',
  work_order: 'bg-purple-500/20 text-purple-400',
  approval: 'bg-green-500/20 text-green-400',
  system: 'bg-gray-500/20 text-gray-400',
};

const priorityColors: Record<Notification['priority'], string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/20 text-primary',
  high: 'bg-warning/20 text-warning',
  critical: 'bg-destructive/20 text-destructive',
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Notification['type'] | 'all'>('all');
  
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  const filterCounts = {
    maintenance: notifications.filter(n => n.type === 'maintenance' && !n.read_status).length,
    warranty: notifications.filter(n => n.type === 'warranty' && !n.read_status).length,
    work_order: notifications.filter(n => n.type === 'work_order' && !n.read_status).length,
    approval: notifications.filter(n => n.type === 'approval' && !n.read_status).length,
    system: notifications.filter(n => n.type === 'system' && !n.read_status).length,
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Notifications</h4>
              <p className="text-sm text-muted-foreground">{unreadCount} unread notifications</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => markAllAsRead.mutate()}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {(['maintenance', 'warranty', 'work_order', 'approval'] as const).map((type) => (
              <Badge
                key={type}
                variant={activeFilter === type ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer capitalize',
                  activeFilter === type && typeColors[type]
                )}
                onClick={() => setActiveFilter(activeFilter === type ? 'all' : type)}
              >
                {type.replace('_', ' ')}
                {filterCounts[type] > 0 && (
                  <span className="ml-1 text-xs">({filterCounts[type]})</span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-muted/50 transition-colors',
                      !notification.read_status && 'bg-muted/30'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('p-2 rounded-lg', typeColors[notification.type])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className={cn(
                            'font-medium text-sm truncate',
                            !notification.read_status && 'text-foreground',
                            notification.read_status && 'text-muted-foreground'
                          )}>
                            {notification.title}
                          </h5>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="secondary" 
                            className={cn('text-xs capitalize', priorityColors[notification.priority])}
                          >
                            {notification.priority}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                            View Details
                          </Button>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.read_status && (
                            <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-sm">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
