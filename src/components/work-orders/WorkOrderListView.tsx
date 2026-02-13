import { format } from 'date-fns';
import { Eye, Play, CheckCircle, Flag, Wrench, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '@/hooks/useWorkOrders';

interface WorkOrderListViewProps {
  workOrders: WorkOrder[];
  onViewDetails: (workOrder: WorkOrder) => void;
  onStartWork: (workOrder: WorkOrder) => void;
  onComplete: (workOrder: WorkOrder) => void;
}

const priorityConfig: Record<WorkOrderPriority, { color: string; bgColor: string }> = {
  Low: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
  Medium: { color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  High: { color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' },
  Critical: { color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
};

const statusConfig: Record<WorkOrderStatus, { color: string; bgColor: string }> = {
  Open: { color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  'In Progress': { color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  'On Hold': { color: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30' },
  Completed: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
  Cancelled: { color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
};

const typeConfig: Record<WorkOrderType, { color: string; bgColor: string; icon: React.ReactNode }> = {
  Preventive: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30', icon: <Wrench className="h-3 w-3" /> },
  Corrective: { color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30', icon: <Wrench className="h-3 w-3" /> },
  Inspection: { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
  Warranty: { color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30', icon: <Wrench className="h-3 w-3" /> },
  Emergency: { color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
};

// Map status to display labels
const getStatusLabel = (status: WorkOrderStatus): string => {
  if (status === 'Open' || status === 'On Hold') return 'Pending';
  if (status === 'In Progress') return 'In Progress';
  return status;
};

export default function WorkOrderListView({
  workOrders,
  onViewDetails,
  onStartWork,
  onComplete,
}: WorkOrderListViewProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-muted-foreground font-medium">ID</TableHead>
            <TableHead className="text-muted-foreground font-medium">Title</TableHead>
            <TableHead className="text-muted-foreground font-medium">Asset</TableHead>
            <TableHead className="text-muted-foreground font-medium">Assigned To</TableHead>
            <TableHead className="text-muted-foreground font-medium">Priority</TableHead>
            <TableHead className="text-muted-foreground font-medium">Type</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Due Date</TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No work orders found
              </TableCell>
            </TableRow>
          ) : (
            workOrders.map((wo) => {
              const showStartButton = wo.status === 'Open' || wo.status === 'On Hold';
              const showCompleteButton = wo.status === 'In Progress';
              const priorityCfg = priorityConfig[wo.priority];
              const statusCfg = statusConfig[wo.status];
              const typeCfg = wo.work_order_type ? typeConfig[wo.work_order_type] : null;
              const statusLabel = getStatusLabel(wo.status);

              return (
                <TableRow key={wo.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {wo.work_order_number}
                  </TableCell>
                  <TableCell className="font-medium text-foreground max-w-[200px]">
                    <span className="line-clamp-2">{wo.title}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[150px]">
                    <span className="line-clamp-2">
                      {wo.asset?.asset_name || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {wo.assignee?.name || wo.assignee?.email || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${priorityCfg.bgColor} ${priorityCfg.color} gap-1`}>
                      <Flag className="h-3 w-3" />
                      {wo.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {typeCfg ? (
                      <Badge variant="outline" className={`${typeCfg.bgColor} ${typeCfg.color} gap-1`}>
                        {typeCfg.icon}
                        {wo.work_order_type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusCfg.bgColor} ${statusCfg.color}`}>
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-sm ${wo.due_date && new Date(wo.due_date) < new Date() ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {wo.due_date ? format(new Date(wo.due_date), 'yyyy-MM-dd') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(wo)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      {showStartButton && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStartWork(wo)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Start
                        </Button>
                      )}
                      {showCompleteButton && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onComplete(wo)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
