import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteWorkOrder, type WorkOrder } from '@/hooks/useWorkOrders';

interface DeleteWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder | null;
}

export default function DeleteWorkOrderDialog({
  open,
  onOpenChange,
  workOrder,
}: DeleteWorkOrderDialogProps) {
  const deleteMutation = useDeleteWorkOrder();

  const handleDelete = async () => {
    if (!workOrder) return;
    try {
      await deleteMutation.mutateAsync(workOrder.id);
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  if (!workOrder) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Work Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete work order{' '}
            <strong>{workOrder.work_order_number}</strong>? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
