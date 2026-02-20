import { format } from 'date-fns';
import { Calendar, User, MapPin, Eye, Play, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '@/hooks/useWorkOrders';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStartWork?: (workOrder: WorkOrder) => void;
  onComplete?: (workOrder: WorkOrder) => void;
}

const priorityColors: Record<WorkOrderPriority, string> = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  High: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30',
  Critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
};

const statusColors: Record<WorkOrderStatus, string> = {
  Open: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  'On Hold': 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/30',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  Cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
};

const typeColors: Record<WorkOrderType, string> = {
  Preventive: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
  Corrective: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
  Inspection: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30',
  Warranty: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  Emergency: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
};

export default function WorkOrderCard({
  workOrder,
  onViewDetails,
  onStartWork,
  onComplete,
}: WorkOrderCardProps) {
  const showStartButton = workOrder.status === 'Open' || workOrder.status === 'On Hold';
  const showCompleteButton = workOrder.status === 'In Progress';

  return (
    <Card className="card-elevated hover:border-primary/30 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {workOrder.work_order_number}
          </span>
          <Badge variant="outline" className={statusColors[workOrder.status]}>
            {workOrder.status}
          </Badge>
        </div>
        <h3 className="font-semibold text-foreground line-clamp-2 mt-1">
          {workOrder.title}
        </h3>
        {workOrder.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workOrder.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {workOrder.assignee && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{workOrder.assignee.name || workOrder.assignee.email}</span>
          </div>
        )}

        {workOrder.due_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Due: {format(new Date(workOrder.due_date), 'yyyy-MM-dd')}</span>
          </div>
        )}

        {workOrder.asset && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">
              Asset: {workOrder.asset.asset_name}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className={priorityColors[workOrder.priority]}>
            {workOrder.priority}
          </Badge>
          {workOrder.work_order_type && (
            <Badge variant="outline" className={typeColors[workOrder.work_order_type]}>
              {workOrder.work_order_type}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 gap-1.5 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => onViewDetails(workOrder)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Details
        </Button>
        {showStartButton && onStartWork && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onStartWork(workOrder)}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Start
          </Button>
        )}
        {showCompleteButton && onComplete && (
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onComplete(workOrder)}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
