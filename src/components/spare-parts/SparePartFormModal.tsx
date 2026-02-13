import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SparePart, SparePartInsert } from '@/hooks/useSpareParts';
import { useAssets } from '@/hooks/useAssets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sparePartSchema = z.object({
  part_name: z.string().min(1, 'Part name is required').max(100),
  part_number: z.string().min(1, 'Part number is required').max(50),
  description: z.string().max(500).optional(),
  supplier: z.string().max(100).optional(),
  storage_location: z.string().max(100).optional(),
  quantity: z.coerce.number().min(0, 'Quantity must be zero or positive'),
  minimum_threshold: z.coerce.number().min(0, 'Threshold must be zero or positive'),
  reorder_quantity: z.coerce.number().min(0, 'Reorder quantity must be zero or positive'),
  unit_cost: z.coerce.number().min(0, 'Unit cost must be zero or positive'),
  warranty_days: z.coerce.number().min(0, 'Warranty days must be zero or positive'),
  status: z.string(),
  asset_id: z.string().nullable().optional(),
});

type SparePartFormData = z.infer<typeof sparePartSchema>;

interface SparePartFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: SparePart | null;
  onSubmit: (data: SparePartInsert) => void;
  isLoading?: boolean;
}

export default function SparePartFormModal({
  open,
  onOpenChange,
  part,
  onSubmit,
  isLoading,
}: SparePartFormModalProps) {
  const isEditing = !!part;
  const { data: assets } = useAssets();

  const form = useForm<SparePartFormData>({
    resolver: zodResolver(sparePartSchema),
    defaultValues: {
      part_name: '',
      part_number: '',
      description: '',
      supplier: '',
      storage_location: '',
      quantity: 0,
      minimum_threshold: 0,
      reorder_quantity: 0,
      unit_cost: 0,
      warranty_days: 0,
      status: 'In Stock',
      asset_id: null,
    },
  });

  useEffect(() => {
    if (part) {
      form.reset({
        part_name: part.part_name,
        part_number: part.part_number,
        description: part.description || '',
        supplier: part.supplier || '',
        storage_location: part.storage_location || '',
        quantity: part.quantity,
        minimum_threshold: part.minimum_threshold,
        reorder_quantity: part.reorder_quantity,
        unit_cost: part.unit_cost,
        warranty_days: part.warranty_days,
        status: part.status,
        asset_id: part.asset_id,
      });
    } else {
      form.reset({
        part_name: '',
        part_number: '',
        description: '',
        supplier: '',
        storage_location: '',
        quantity: 0,
        minimum_threshold: 0,
        reorder_quantity: 0,
        unit_cost: 0,
        warranty_days: 0,
        status: 'In Stock',
        asset_id: null,
      });
    }
  }, [part, form, open]);

  const handleSubmit = (data: SparePartFormData) => {
    const payload: SparePartInsert = {
      part_name: data.part_name,
      part_number: data.part_number,
      description: data.description || '',
      supplier: data.supplier || '',
      storage_location: data.storage_location || '',
      quantity: data.quantity,
      minimum_threshold: data.minimum_threshold,
      reorder_quantity: data.reorder_quantity,
      unit_cost: data.unit_cost,
      warranty_days: data.warranty_days,
      status: data.status,
      asset_id: data.asset_id || null,
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Spare Part' : 'Add New Spare Part'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Row 1: Part Name & Part Number */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="part_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter part name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="part_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter part number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter description" 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 3: Supplier & Storage Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storage_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter storage location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Current Stock & Minimum Threshold */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimum_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Reorder Quantity & Unit Cost */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reorder_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 6: Warranty Days & Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warranty_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Low Stock">Low Stock</SelectItem>
                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                        <SelectItem value="On Order">On Order</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 7: Compatible Asset */}
            <FormField
              control={form.control}
              name="asset_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compatible Asset</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No asset linked</SelectItem>
                      {assets?.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.asset_name} ({asset.asset_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Part'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
