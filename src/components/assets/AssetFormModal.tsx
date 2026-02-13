import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset, AssetInsert } from '@/hooks/useAssets';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const assetSchema = z.object({
  asset_name: z.string().min(1, 'Asset name is required').max(100),
  asset_type: z.string().max(100).optional(),
  serial_number: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  specification: z.string().max(255).optional(),
  voltage: z.string().max(50).optional(),
  wattage: z.string().max(50).optional(),
  asset_code: z.string().min(1, 'Asset code is required').max(50),
  purchase_value: z.coerce.number().min(0, 'Value must be positive'),
  depreciation: z.string().max(100).optional(),
  insurance: z.string().max(100).optional(),
  amc: z.string().max(100).optional(),
  lease_status: z.string().max(100).optional(),
  custodian: z.string().max(100).optional(),
  location: z.string().min(1, 'Location is required').max(100),
  building_no: z.string().max(50).optional(),
  purchase_date: z.date().nullable().optional(),
  category: z.string().max(100),
  status: z.string().max(50),
  warranty_expiry: z.date().nullable().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  onSubmit: (data: AssetInsert) => void;
  isLoading?: boolean;
}

export default function AssetFormModal({
  open,
  onOpenChange,
  asset,
  onSubmit,
  isLoading,
}: AssetFormModalProps) {
  const [activeTab, setActiveTab] = useState('technical');
  const isEditing = !!asset;

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      asset_name: '',
      asset_type: '',
      serial_number: '',
      model: '',
      manufacturer: '',
      specification: '',
      voltage: '',
      wattage: '',
      asset_code: '',
      purchase_value: 0,
      depreciation: '',
      insurance: '',
      amc: '',
      lease_status: '',
      custodian: '',
      location: '',
      building_no: '',
      purchase_date: null,
      category: 'General',
      status: 'Active',
      warranty_expiry: null,
    },
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        asset_name: asset.asset_name,
        asset_type: asset.asset_type || '',
        serial_number: asset.serial_number || '',
        model: asset.model || '',
        manufacturer: asset.manufacturer || '',
        specification: asset.specification || '',
        voltage: asset.voltage || '',
        wattage: asset.wattage || '',
        asset_code: asset.asset_code,
        purchase_value: asset.purchase_value,
        depreciation: asset.depreciation || '',
        insurance: asset.insurance || '',
        amc: asset.amc || '',
        lease_status: asset.lease_status || '',
        custodian: asset.custodian || '',
        location: asset.location,
        building_no: asset.building_no || '',
        purchase_date: asset.purchase_date ? new Date(asset.purchase_date) : null,
        category: asset.category,
        status: asset.status,
        warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry) : null,
      });
    } else {
      form.reset({
        asset_name: '',
        asset_type: '',
        serial_number: '',
        model: '',
        manufacturer: '',
        specification: '',
        voltage: '',
        wattage: '',
        asset_code: '',
        purchase_value: 0,
        depreciation: '',
        insurance: '',
        amc: '',
        lease_status: '',
        custodian: '',
        location: '',
        building_no: '',
        purchase_date: null,
        category: 'General',
        status: 'Active',
        warranty_expiry: null,
      });
    }
    setActiveTab('technical');
  }, [asset, form, open]);

  const handleSubmit = (data: AssetFormData) => {
    const payload: AssetInsert = {
      asset_name: data.asset_name,
      asset_code: data.asset_code,
      location: data.location,
      category: data.category,
      status: data.status,
      purchase_value: data.purchase_value,
      purchase_date: data.purchase_date ? format(data.purchase_date, 'yyyy-MM-dd') : null,
      warranty_expiry: data.warranty_expiry ? format(data.warranty_expiry, 'yyyy-MM-dd') : null,
      asset_type: data.asset_type || '',
      serial_number: data.serial_number || '',
      model: data.model || '',
      manufacturer: data.manufacturer || '',
      specification: data.specification || '',
      voltage: data.voltage || '',
      wattage: data.wattage || '',
      depreciation: data.depreciation || '',
      insurance: data.insurance || '',
      amc: data.amc || '',
      lease_status: data.lease_status || '',
      custodian: data.custodian || '',
      building_no: data.building_no || '',
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Top row - always visible */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="asset_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="asset_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tabbed content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="technical">Technical Data</TabsTrigger>
                <TabsTrigger value="financial">Financial Data</TabsTrigger>
                <TabsTrigger value="ownership">Ownership & Location</TabsTrigger>
              </TabsList>

              <TabsContent value="technical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter serial number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter model" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter make" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specification</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter specification" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="voltage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voltage</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter voltage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wattage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wattage</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter wattage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="asset_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter asset code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchase_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="depreciation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Depreciation</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter depreciation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter insurance details" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AMC</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter AMC details" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lease_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lease Status</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter lease status" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ownership" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="custodian"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Custodian</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter custodian name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="building_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building No</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter building number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acquisition Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'dd-MM-yyyy')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                            <SelectItem value="Furniture">Furniture</SelectItem>
                            <SelectItem value="Machinery">Machinery</SelectItem>
                            <SelectItem value="Vehicle">Vehicle</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                            <SelectItem value="Disposed">Disposed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
