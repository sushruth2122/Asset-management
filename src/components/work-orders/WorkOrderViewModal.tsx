import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  User,
  MapPin,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Package,
} from 'lucide-react';
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '@/hooks/useWorkOrders';

interface WorkOrderViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder | null;
  onEdit?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrder: WorkOrder) => void;
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

export default function WorkOrderViewModal({
  open,
  onOpenChange,
  workOrder,
  onEdit,
  onDelete,
}: WorkOrderViewModalProps) {
  if (!workOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-mono">
                {workOrder.work_order_number}
              </span>
              <DialogTitle className="text-xl mt-1">{workOrder.title}</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={statusColors[workOrder.status]}>
                {workOrder.status}
              </Badge>
              <Badge variant="outline" className={priorityColors[workOrder.priority]}>
                {workOrder.priority}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {workOrder.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h4>
              <p className="text-sm text-foreground">{workOrder.description}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              {workOrder.assignee && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium">
                      {workOrder.assignee.name || workOrder.assignee.email}
                    </p>
                  </div>
                </div>
              )}

              {workOrder.due_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(workOrder.due_date), 'PPP')}
                    </p>
                  </div>
                </div>
              )}

              {workOrder.work_order_type && (
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="outline" className={typeColors[workOrder.work_order_type]}>
                      {workOrder.work_order_type}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {workOrder.estimated_cost !== null && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Cost</p>
                    <p className="text-sm font-medium">
                      ${workOrder.estimated_cost.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {format(new Date(workOrder.created_at), 'PPP')}
                  </p>
                </div>
              </div>

              {workOrder.completed_at && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-sm font-medium text-emerald-400">
                      {format(new Date(workOrder.completed_at), 'PPP')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {workOrder.asset && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Related Asset
                </h4>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {workOrder.asset.asset_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {workOrder.asset.asset_code}
                      </p>
                      {workOrder.asset.location && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Location: {workOrder.asset.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete?.(workOrder)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => onEdit?.(workOrder)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
