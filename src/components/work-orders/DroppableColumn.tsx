import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DraggableWorkOrderCard } from './DraggableWorkOrderCard';
import type { WorkOrder, WorkOrderStatus } from '@/hooks/useWorkOrders';

interface DroppableColumnProps {
  id: string;
  displayName: string;
  status: WorkOrderStatus;
  workOrders: WorkOrder[];
  color: string;
  dotColor: string;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStartWork?: (workOrder: WorkOrder) => void;
  onComplete?: (workOrder: WorkOrder) => void;
}

function DroppableColumnInner({
  id,
  displayName,
  workOrders,
  color,
  dotColor,
  onViewDetails,
  onStartWork,
  onComplete,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const workOrderIds = workOrders.map((wo) => wo.id);

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/20 rounded-xl border transition-all flex flex-col min-h-[500px] ${
        isOver ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border/60'
      }`}
    >
      <div className="px-3 py-2.5 border-b border-border/60 sticky top-0 bg-background/80 backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span className={`text-sm font-medium ${color}`}>{displayName}</span>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {workOrders.length}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          <SortableContext items={workOrderIds} strategy={verticalListSortingStrategy}>
            {workOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No work orders
              </div>
            ) : (
              workOrders.map((wo) => (
                <DraggableWorkOrderCard
                  key={wo.id}
                  workOrder={wo}
                  onViewDetails={onViewDetails}
                  onStartWork={onStartWork}
                  onComplete={onComplete}
                />
              ))
            )}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}

export const DroppableColumn = memo(DroppableColumnInner);
