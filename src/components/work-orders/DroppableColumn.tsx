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
      className={`bg-muted/30 rounded-lg border transition-colors flex flex-col min-h-[500px] ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <div className="p-3 border-b border-border sticky top-0 bg-muted/50 backdrop-blur-sm rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <span className={`font-medium ${color}`}>{displayName}</span>
          <span className="text-sm text-muted-foreground ml-auto">
            ({workOrders.length})
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
