import { useState, useCallback } from 'react';
import { Package, Plus, Minus, ArrowRightLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useUpdateStock, type StockAction, type SparePart } from '@/hooks/useSpareParts';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart | null;
}

export default function UpdateStockModal({ open, onOpenChange, part }: Props) {
  const { user } = useAuth();
  const updateStock = useUpdateStock();

  const [action, setAction] = useState<StockAction>('add');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setAction('add');
    setAmount('');
    setError(null);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  }, [onOpenChange, reset]);

  const handleSubmit = useCallback(async () => {
    if (!part) return;
    const num = parseInt(amount, 10);

    if (isNaN(num) || num < 0) {
      setError('Enter a valid non-negative number.');
      return;
    }

    if (action === 'remove' && num > part.quantity) {
      setError(`Cannot remove ${num} — only ${part.quantity} in stock.`);
      return;
    }

    if (action === 'adjust' && num < 0) {
      setError('Exact quantity cannot be negative.');
      return;
    }

    setError(null);
    await updateStock.mutateAsync({
      partId: part.id,
      action,
      amount: num,
      userId: user?.id ?? null,
    });
    handleOpenChange(false);
  }, [part, amount, action, user, updateStock, handleOpenChange]);

  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Update Stock
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {part.part_name} — Current: <span className="font-bold">{part.quantity}</span>
          </p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Action toggle */}
          <div className="space-y-2">
            <Label>Action</Label>
            <ToggleGroup
              type="single"
              value={action}
              onValueChange={(v) => v && setAction(v as StockAction)}
              className="justify-start"
            >
              <ToggleGroupItem value="add" className="gap-1">
                <Plus className="h-4 w-4" /> Add Stock
              </ToggleGroupItem>
              <ToggleGroupItem value="remove" className="gap-1">
                <Minus className="h-4 w-4" /> Remove Stock
              </ToggleGroupItem>
              <ToggleGroupItem value="adjust" className="gap-1">
                <ArrowRightLeft className="h-4 w-4" /> Set Exact
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>{action === 'adjust' ? 'New Quantity' : 'Amount'}</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={action === 'adjust' ? 'Enter exact quantity' : 'Enter amount'}
            />
          </div>

          {/* Preview */}
          {amount && !isNaN(parseInt(amount, 10)) && (
            <div className="rounded-md border border-border p-3 text-sm">
              <span className="text-muted-foreground">Resulting quantity: </span>
              <span className="font-bold">
                {action === 'add'
                  ? part.quantity + parseInt(amount, 10)
                  : action === 'remove'
                    ? Math.max(part.quantity - parseInt(amount, 10), 0)
                    : parseInt(amount, 10)}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateStock.isPending || !amount}>
            {updateStock.isPending ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
