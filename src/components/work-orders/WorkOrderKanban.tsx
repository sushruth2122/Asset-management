import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import WorkOrderCard from './WorkOrderCard';
import type { WorkOrder, WorkOrderStatus } from '@/hooks/useWorkOrders';

interface WorkOrderKanbanProps {
  workOrders: WorkOrder[];
  onViewDetails: (workOrder: WorkOrder) => void;
  onStartWork: (workOrder: WorkOrder) => void;
  onComplete: (workOrder: WorkOrder) => void;
  visibleStatuses: WorkOrderStatus[];
}

// Map display columns to actual statuses - 4 columns as required
const columnConfig: { 
  displayName: string; 
  statuses: WorkOrderStatus[]; 
  color: string; 
  dotColor: string 
}[] = [
  { 
    displayName: 'Backlog', 
    statuses: ['Open'], 
    color: 'text-slate-400', 
    dotColor: 'bg-slate-400' 
  },
  { 
    displayName: 'Scheduled', 
    statuses: ['On Hold'], 
    color: 'text-blue-400', 
    dotColor: 'bg-blue-400' 
  },
  { 
    displayName: 'In Progress', 
    statuses: ['In Progress'], 
    color: 'text-amber-400', 
    dotColor: 'bg-amber-400' 
  },
  { 
    displayName: 'Completed', 
    statuses: ['Completed'], 
    color: 'text-emerald-400', 
    dotColor: 'bg-emerald-400' 
  },
];

export default function WorkOrderKanban({
  workOrders,
  onViewDetails,
  onStartWork,
  onComplete,
}: WorkOrderKanbanProps) {
  const groupedOrders = useMemo(() => {
    const groups: Record<string, WorkOrder[]> = {
      'Backlog': [],
      'Scheduled': [],
      'In Progress': [],
      'Completed': [],
    };

    workOrders.forEach((wo) => {
      if (wo.status === 'Open') {
        groups['Backlog'].push(wo);
      } else if (wo.status === 'On Hold') {
        groups['Scheduled'].push(wo);
      } else if (wo.status === 'In Progress') {
        groups['In Progress'].push(wo);
      } else if (wo.status === 'Completed') {
        groups['Completed'].push(wo);
      }
    });

    return groups;
  }, [workOrders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {columnConfig.map(({ displayName, color, dotColor }) => (
        <div
          key={displayName}
          className="bg-muted/30 rounded-lg border border-border flex flex-col min-h-[500px]"
        >
          <div className="p-3 border-b border-border sticky top-0 bg-muted/50 backdrop-blur-sm rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
              <span className={`font-medium ${color}`}>{displayName}</span>
              <span className="text-sm text-muted-foreground ml-auto">
                ({groupedOrders[displayName]?.length || 0})
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {(!groupedOrders[displayName] || groupedOrders[displayName].length === 0) ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No work orders
                </div>
              ) : (
                groupedOrders[displayName].map((wo) => (
                  <WorkOrderCard
                    key={wo.id}
                    workOrder={wo}
                    onViewDetails={onViewDetails}
                    onStartWork={onStartWork}
                    onComplete={onComplete}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
