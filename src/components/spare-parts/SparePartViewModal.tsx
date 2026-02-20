import { SparePart } from '@/hooks/useSpareParts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SparePartViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart | null;
}

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-foreground">{value ?? '-'}</span>
    </div>
  );
}

export default function SparePartViewModal({ open, onOpenChange, part }: SparePartViewModalProps) {
  if (!part) return null;

  const getStockStatus = () => {
    if (part.quantity === 0) return 'Out of Stock';
    if (part.quantity <= part.minimum_threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in stock':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'low stock':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30';
      case 'out of stock':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30';
      case 'on order':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30';
    }
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{part.part_name}</DialogTitle>
            <Badge className={getStatusClasses(stockStatus)}>{stockStatus}</Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{part.part_number}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {part.description && (
            <div>
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="text-foreground mt-1">{part.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Supplier" value={part.supplier} />
            <DetailRow label="Storage Location" value={part.storage_location} />
            <DetailRow label="Current Stock" value={part.quantity} />
            <DetailRow label="Minimum Threshold" value={part.minimum_threshold} />
            <DetailRow label="Reorder Quantity" value={part.reorder_quantity} />
            <DetailRow label="Unit Cost" value={`$${part.unit_cost.toLocaleString()}`} />
            <DetailRow label="Warranty (Days)" value={part.warranty_days} />
            <DetailRow label="Total Value" value={`$${(part.quantity * part.unit_cost).toLocaleString()}`} />
          </div>

          {part.asset && (
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Linked Asset</span>
              <p className="text-foreground mt-1">
                {part.asset.asset_name} ({part.asset.asset_code})
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <DetailRow 
              label="Created At" 
              value={format(new Date(part.created_at), 'dd-MM-yyyy HH:mm')} 
            />
            <DetailRow 
              label="Updated At" 
              value={format(new Date(part.updated_at), 'dd-MM-yyyy HH:mm')} 
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
