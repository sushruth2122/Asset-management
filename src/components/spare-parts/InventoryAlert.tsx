import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InventoryAlertProps {
  outOfStock: number;
  lowStock: number;
  onDismiss?: () => void;
}

export default function InventoryAlert({ outOfStock, lowStock, onDismiss }: InventoryAlertProps) {
  if (outOfStock === 0 && lowStock === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-amber-400">Inventory Alert</h4>
          <div className="text-sm text-amber-300/80 mt-1 space-y-1">
            {outOfStock > 0 && (
              <p>{outOfStock} item(s) are out of stock and need immediate reordering.</p>
            )}
            {lowStock > 0 && (
              <p>{lowStock} item(s) are below minimum threshold and should be reordered soon.</p>
            )}
          </div>
          <div className="flex gap-3 mt-3">
            <Button size="sm" variant="outline" className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/20">
              <RefreshCw className="h-4 w-4" />
              Reorder All Low Stock Items
            </Button>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss} className="text-amber-400 hover:bg-amber-500/20">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
