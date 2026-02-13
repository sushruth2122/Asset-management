import { Asset } from '@/hooks/useAssets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface AssetViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
}

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-foreground">{value || '-'}</span>
    </div>
  );
}

export default function AssetViewModal({ open, onOpenChange, asset }: AssetViewModalProps) {
  if (!asset) return null;

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'maintenance':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'inactive':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{asset.asset_name}</DialogTitle>
            <Badge className={getStatusClasses(asset.status)}>{asset.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {asset.manufacturer} {asset.model}
          </p>
        </DialogHeader>

        <Tabs defaultValue="technical" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="technical">Technical Data</TabsTrigger>
            <TabsTrigger value="financial">Financial Data</TabsTrigger>
            <TabsTrigger value="ownership">Ownership & Location</TabsTrigger>
          </TabsList>

          <TabsContent value="technical" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Asset Type" value={asset.asset_type} />
              <DetailRow label="Serial Number" value={asset.serial_number} />
              <DetailRow label="Model" value={asset.model} />
              <DetailRow label="Manufacturer" value={asset.manufacturer} />
              <DetailRow label="Specification" value={asset.specification} />
              <DetailRow label="Voltage" value={asset.voltage} />
              <DetailRow label="Wattage" value={asset.wattage} />
              <DetailRow label="Category" value={asset.category} />
            </div>
          </TabsContent>

          <TabsContent value="financial" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Asset Code" value={asset.asset_code} />
              <DetailRow label="Purchase Value" value={`$${asset.purchase_value.toLocaleString()}`} />
              <DetailRow label="Depreciation" value={asset.depreciation} />
              <DetailRow label="Insurance" value={asset.insurance} />
              <DetailRow label="AMC" value={asset.amc} />
              <DetailRow label="Lease Status" value={asset.lease_status} />
              <DetailRow 
                label="Warranty Expiry" 
                value={asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'dd-MM-yyyy') : null} 
              />
            </div>
          </TabsContent>

          <TabsContent value="ownership" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Custodian" value={asset.custodian} />
              <DetailRow label="Location" value={asset.location} />
              <DetailRow label="Building No" value={asset.building_no} />
              <DetailRow 
                label="Purchase Date" 
                value={asset.purchase_date ? format(new Date(asset.purchase_date), 'dd-MM-yyyy') : null} 
              />
              <DetailRow 
                label="Created At" 
                value={format(new Date(asset.created_at), 'dd-MM-yyyy HH:mm')} 
              />
              <DetailRow 
                label="Updated At" 
                value={format(new Date(asset.updated_at), 'dd-MM-yyyy HH:mm')} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
