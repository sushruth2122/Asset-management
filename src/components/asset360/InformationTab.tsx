import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Asset } from '@/hooks/useAssets';

interface Props {
  asset: Asset;
}

const fieldGroups = [
  {
    title: 'General',
    fields: (a: Asset) => [
      { label: 'Asset Name', value: a.asset_name },
      { label: 'Asset Code', value: a.asset_code },
      { label: 'Category', value: a.category },
      { label: 'Asset Type', value: a.asset_type },
      { label: 'Status', value: a.status },
      { label: 'Lifecycle Stage', value: a.lifecycle_stage },
    ],
  },
  {
    title: 'Technical Details',
    fields: (a: Asset) => [
      { label: 'Manufacturer', value: a.manufacturer },
      { label: 'Model', value: a.model },
      { label: 'Serial Number', value: a.serial_number },
      { label: 'Specification', value: a.specification },
      { label: 'Voltage', value: a.voltage },
      { label: 'Wattage', value: a.wattage },
    ],
  },
  {
    title: 'Location & Custody',
    fields: (a: Asset) => [
      { label: 'Location', value: a.location },
      { label: 'Building No.', value: a.building_no },
      { label: 'Custodian', value: a.custodian },
      { label: 'Latitude', value: a.latitude?.toString() ?? '-' },
      { label: 'Longitude', value: a.longitude?.toString() ?? '-' },
    ],
  },
  {
    title: 'Financial & Contracts',
    fields: (a: Asset) => [
      { label: 'Purchase Value', value: `$${a.purchase_value.toLocaleString()}` },
      { label: 'Purchase Date', value: a.purchase_date ?? '-' },
      { label: 'Warranty Expiry', value: a.warranty_expiry ?? '-' },
      { label: 'Depreciation', value: a.depreciation },
      { label: 'Insurance', value: a.insurance },
      { label: 'AMC', value: a.amc },
      { label: 'Lease Status', value: a.lease_status },
    ],
  },
];

function InformationTab({ asset }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {fieldGroups.map(({ title, fields }) => (
        <Card key={title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {fields(asset).map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {value || <span className="text-muted-foreground">-</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default memo(InformationTab);
