import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WorkOrderCard from './WorkOrderCard';
import type { WorkOrder } from '@/hooks/useWorkOrders';

interface DraggableWorkOrderCardProps {
  workOrder: WorkOrder;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStartWork?: (workOrder: WorkOrder) => void;
  onComplete?: (workOrder: WorkOrder) => void;
}

function DraggableWorkOrderCardInner({
  workOrder,
  onViewDetails,
  onStartWork,
  onComplete,
}: DraggableWorkOrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: workOrder.id,
    data: {
      workOrder,
      status: workOrder.status,
    },
    animateLayoutChanges: () => true,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WorkOrderCard
        workOrder={workOrder}
        onViewDetails={onViewDetails}
        onStartWork={onStartWork}
        onComplete={onComplete}
      />
    </div>
  );
}

export const DraggableWorkOrderCard = memo(DraggableWorkOrderCardInner);
