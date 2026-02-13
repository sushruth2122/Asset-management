import { SparePart } from '@/hooks/useSpareParts';
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

interface DeleteSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function DeleteSparePartDialog({
  open,
  onOpenChange,
  part,
  onConfirm,
  isLoading,
}: DeleteSparePartDialogProps) {
  if (!part) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Spare Part</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{part.part_name}" ({part.part_number})?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
