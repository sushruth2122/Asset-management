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
  Low: { color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30' },
  Medium: { color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30' },
  High: { color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50 border-orange-200 dark:bg-orange-500/15 dark:border-orange-500/30' },
  Critical: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 border-red-200 dark:bg-red-500/15 dark:border-red-500/30' },
};

const statusConfig: Record<WorkOrderStatus, { color: string; bgColor: string }> = {
  Open: { color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30' },
  'In Progress': { color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-500/15 dark:border-blue-500/30' },
  'On Hold': { color: 'text-slate-600 dark:text-gray-400', bgColor: 'bg-slate-50 border-slate-200 dark:bg-gray-500/15 dark:border-gray-500/30' },
  Completed: { color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30' },
  Cancelled: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 border-red-200 dark:bg-red-500/15 dark:border-red-500/30' },
};

const typeConfig: Record<WorkOrderType, { color: string; bgColor: string; icon: React.ReactNode }> = {
  Preventive: { color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30', icon: <Wrench className="h-3 w-3" /> },
  Corrective: { color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50 border-orange-200 dark:bg-orange-500/15 dark:border-orange-500/30', icon: <Wrench className="h-3 w-3" /> },
  Inspection: { color: 'text-sky-700 dark:text-cyan-400', bgColor: 'bg-sky-50 border-sky-200 dark:bg-cyan-500/15 dark:border-cyan-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
  Warranty: { color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 border-purple-200 dark:bg-purple-500/15 dark:border-purple-500/30', icon: <Wrench className="h-3 w-3" /> },
  Emergency: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 border-red-200 dark:bg-red-500/15 dark:border-red-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
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
              <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Wrench className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">No work orders found</p>
                  <p className="text-xs">Try adjusting your filters</p>
                </div>
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
                <TableRow key={wo.id} className="border-border hover:bg-muted/30 group">
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
                  <TableCell className={`text-xs tabular-nums ${wo.due_date && new Date(wo.due_date) < new Date() ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                    {wo.due_date ? format(new Date(wo.due_date), 'yyyy-MM-dd') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onViewDetails(wo)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      {showStartButton && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
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
                          className="h-7 px-2 text-xs"
                          onClick={() => onComplete(wo)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Done
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
