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
  Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusColors: Record<WorkOrderStatus, string> = {
  Open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'In Progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'On Hold': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const typeColors: Record<WorkOrderType, string> = {
  Preventive: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Corrective: 'bg-red-500/20 text-red-400 border-red-500/30',
  Inspection: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Warranty: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Emergency: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
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
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
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

      <CardFooter className="pt-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails(workOrder)}
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          View Details
        </Button>
        {showStartButton && onStartWork && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStartWork(workOrder)}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Start Work
          </Button>
        )}
        {showCompleteButton && onComplete && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onComplete(workOrder)}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
