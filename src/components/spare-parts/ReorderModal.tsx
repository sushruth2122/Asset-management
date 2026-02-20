import { useState, useCallback } from 'react';
import { ShoppingCart } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreatePurchaseOrder, type SparePart } from '@/hooks/useSpareParts';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart | null;
}

export default function ReorderModal({ open, onOpenChange, part }: Props) {
  const { user } = useAuth();
  const createPO = useCreatePurchaseOrder();

  const [vendor, setVendor] = useState('');
  const [qty, setQty] = useState('');
  const [delivery, setDelivery] = useState('');
  const [notes, setNotes] = useState('');

  const reset = useCallback(() => {
    setVendor('');
    setQty('');
    setDelivery('');
    setNotes('');
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset],
  );

  // Pre-fill vendor from part.supplier when opening
  const handleOpen = useCallback(() => {
    if (part?.supplier) setVendor(part.supplier);
    if (part?.reorder_quantity) setQty(String(part.reorder_quantity));
  }, [part]);

  // Trigger pre-fill when dialog opens
  if (open && !vendor && part?.supplier) {
    handleOpen();
  }

  const handleSubmit = useCallback(async () => {
    if (!part || !vendor || !qty) return;
    const quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    await createPO.mutateAsync({
      part_id: part.id,
      quantity,
      vendor,
      status: 'pending',
      expected_delivery: delivery || null,
      notes: notes || null,
      created_by: user?.id ?? null,
    });
    handleOpenChange(false);
  }, [part, vendor, qty, delivery, notes, user, createPO, handleOpenChange]);

  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Reorder Part
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {part.part_name} ({part.part_number}) — Stock: {part.quantity}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Supplier name" />
          </div>
          <div className="space-y-2">
            <Label>Reorder Quantity *</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Expected Delivery</Label>
            <Input type="date" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createPO.isPending || !vendor || !qty}>
            {createPO.isPending ? 'Creating…' : 'Create PO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
