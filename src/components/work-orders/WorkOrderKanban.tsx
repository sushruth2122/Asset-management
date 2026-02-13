import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import WorkOrderCard from './WorkOrderCard';
import { DroppableColumn } from './DroppableColumn';
import { useUpdateWorkOrderSilent, type WorkOrder, type WorkOrderStatus } from '@/hooks/useWorkOrders';

interface WorkOrderKanbanProps {
  workOrders: WorkOrder[];
  onViewDetails: (workOrder: WorkOrder) => void;
  onStartWork: (workOrder: WorkOrder) => void;
  onComplete: (workOrder: WorkOrder) => void;
  visibleStatuses: WorkOrderStatus[];
}

// Map display columns to actual statuses
const columnConfig: {
  id: string;
  displayName: string;
  status: WorkOrderStatus;
  color: string;
  dotColor: string;
}[] = [
  {
    id: 'backlog',
    displayName: 'Backlog',
    status: 'Open',
    color: 'text-slate-400',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'scheduled',
    displayName: 'Scheduled',
    status: 'On Hold',
    color: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
  {
    id: 'in-progress',
    displayName: 'In Progress',
    status: 'In Progress',
    color: 'text-amber-400',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'completed',
    displayName: 'Completed',
    status: 'Completed',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
  },
];

export default function WorkOrderKanban({
  workOrders,
  onViewDetails,
  onStartWork,
  onComplete,
}: WorkOrderKanbanProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateWorkOrderSilent();

  // Local state for optimistic updates
  const [localWorkOrders, setLocalWorkOrders] = useState<WorkOrder[]>(workOrders);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync local state with props when not dragging
  useEffect(() => {
    if (!activeId) {
      setLocalWorkOrders(workOrders);
    }
  }, [workOrders, activeId]);

  // Use local state for rendering
  const effectiveWorkOrders = localWorkOrders;

  // Group work orders by status
  const groupedOrders = useMemo(() => {
    const groups: Record<string, WorkOrder[]> = {};
    columnConfig.forEach((col) => {
      groups[col.id] = effectiveWorkOrders.filter((wo) => wo.status === col.status);
    });
    return groups;
  }, [effectiveWorkOrders]);

  // Sensors for drag handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeWorkOrder = useMemo(
    () => effectiveWorkOrders.find((wo) => wo.id === activeId),
    [effectiveWorkOrders, activeId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the active item is in
    const activeColumn = columnConfig.find((col) =>
      groupedOrders[col.id]?.some((wo) => wo.id === activeId)
    );

    // Find which column we're over (either a droppable column or another work order)
    let overColumn = columnConfig.find((col) => col.id === overId);
    if (!overColumn) {
      // If over a work order, find its column
      overColumn = columnConfig.find((col) =>
        groupedOrders[col.id]?.some((wo) => wo.id === overId)
      );
    }

    if (!activeColumn || !overColumn) return;
    if (activeColumn.id === overColumn.id) return;

    // Optimistically move the work order between columns
    setLocalWorkOrders((prev) => {
      const updated = prev.map((wo) =>
        wo.id === activeId ? { ...wo, status: overColumn.status } : wo
      );
      return updated;
    });
  }, [groupedOrders]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) {
        // Reset if dropped outside
        setLocalWorkOrders(workOrders);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find the active work order
      const activeWorkOrder = localWorkOrders.find((wo) => wo.id === activeId);
      if (!activeWorkOrder) return;

      // Find source and destination columns
      const activeColumn = columnConfig.find((col) =>
        localWorkOrders.filter((wo) => wo.status === col.status).some((wo) => wo.id === activeId)
      );

      let overColumn = columnConfig.find((col) => col.id === overId);
      if (!overColumn) {
        overColumn = columnConfig.find((col) =>
          localWorkOrders.filter((wo) => wo.status === col.status).some((wo) => wo.id === overId)
        );
      }

      if (!activeColumn || !overColumn) {
        setLocalWorkOrders(workOrders);
        return;
      }

      // If moving within same column
      if (activeColumn.id === overColumn.id && activeId !== overId) {
        const columnItems = localWorkOrders.filter((wo) => wo.status === activeColumn.status);
        const oldIndex = columnItems.findIndex((wo) => wo.id === activeId);
        const newIndex = columnItems.findIndex((wo) => wo.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnItems, oldIndex, newIndex);
          const otherItems = localWorkOrders.filter((wo) => wo.status !== activeColumn.status);
          const newWorkOrders = [...otherItems, ...reordered];
          setLocalWorkOrders(newWorkOrders);

          // Update cache optimistically
          queryClient.setQueryData(['work_orders'], newWorkOrders);
        }
        return;
      }

      // If moving between columns
      if (activeColumn.id !== overColumn.id) {
        const newStatus = overColumn.status;
        const previousStatus = activeWorkOrder.status;

        // Optimistically update cache immediately
        const optimisticUpdate = localWorkOrders.map((wo) =>
          wo.id === activeId ? { ...wo, status: newStatus } : wo
        );
        queryClient.setQueryData(['work_orders'], optimisticUpdate);

        // Update DB in background (non-blocking)
        updateMutation.mutate(
          {
            id: activeId,
            status: newStatus,
          },
          {
            onError: () => {
              // Rollback on error
              const rollback = workOrders.map((wo) =>
                wo.id === activeId ? wo : wo
              );
              queryClient.setQueryData(['work_orders'], rollback);
              setLocalWorkOrders(rollback);
              toast.error('Failed to update work order');
            },
          }
        );
      }
    },
    [localWorkOrders, workOrders, queryClient, updateMutation]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {columnConfig.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            displayName={col.displayName}
            status={col.status}
            workOrders={groupedOrders[col.id] || []}
            color={col.color}
            dotColor={col.dotColor}
            onViewDetails={onViewDetails}
            onStartWork={onStartWork}
            onComplete={onComplete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeWorkOrder ? (
          <div className="rotate-3 scale-105">
            <WorkOrderCard
              workOrder={activeWorkOrder}
              onViewDetails={onViewDetails}
              onStartWork={onStartWork}
              onComplete={onComplete}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
