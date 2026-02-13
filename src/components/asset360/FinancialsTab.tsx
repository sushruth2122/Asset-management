import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { DollarSign, TrendingDown, TrendingUp, Wrench, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAssetFinancials } from '@/hooks/useAsset360';
import type { Asset } from '@/hooks/useAssets';

interface Props {
  assetId: string;
  asset: Asset;
}

const typeLabels: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  depreciation: { label: 'Depreciation', icon: TrendingDown, color: 'text-red-400' },
  maintenance_cost: { label: 'Maintenance', icon: Wrench, color: 'text-amber-400' },
  repair_cost: { label: 'Repair', icon: Wrench, color: 'text-orange-400' },
  upgrade_cost: { label: 'Upgrade', icon: TrendingUp, color: 'text-blue-400' },
  valuation: { label: 'Valuation', icon: DollarSign, color: 'text-emerald-400' },
};

function FinancialsTab({ assetId, asset }: Props) {
  const { data: records, isLoading } = useAssetFinancials(assetId);

  const summary = useMemo(() => {
    if (!records?.length) return null;
    const totals: Record<string, number> = {};
    for (const r of records) {
      totals[r.record_type] = (totals[r.record_type] ?? 0) + r.amount;
    }
    return totals;
  }, [records]);

  // Memoized depreciation calculation — never computed inside render
  const depreciation = useMemo(() => {
    const price = asset.purchase_price ?? asset.purchase_value;
    const salvage = asset.salvage_value ?? 0;
    const useful = asset.useful_life_years;
    const rate = asset.depreciation_rate;
    const acqDate = asset.acquisition_date ?? asset.purchase_date;

    if (!price || price <= 0) return null;

    const yearsOwned = acqDate
      ? (Date.now() - new Date(acqDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      : 0;

    // Straight-line if useful_life_years exists
    if (useful && useful > 0) {
      const annual = (price - salvage) / useful;
      const total = Math.min(annual * yearsOwned, price - salvage);
      const current = price - total;
      return { method: 'Straight-Line', annual, totalDepreciation: total, currentValue: Math.max(current, salvage), yearsOwned: Math.round(yearsOwned * 10) / 10 };
    }

    // Declining-balance if rate given
    if (rate && rate > 0) {
      const factor = 1 - rate / 100;
      const current = price * Math.pow(factor, yearsOwned);
      return { method: 'Declining Balance', annual: price * (rate / 100), totalDepreciation: price - current, currentValue: Math.max(current, salvage), yearsOwned: Math.round(yearsOwned * 10) / 10 };
    }

    return null;
  }, [asset]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!records?.length && !depreciation) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No financial records yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Depreciation Card */}
      {depreciation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Depreciation ({depreciation.method})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Purchase Price</dt>
                <dd className="font-semibold">${(asset.purchase_price ?? asset.purchase_value).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Current Value</dt>
                <dd className="font-semibold text-emerald-400">${Math.round(depreciation.currentValue).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Total Depreciation</dt>
                <dd className="font-semibold text-red-400">${Math.round(depreciation.totalDepreciation).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Annual Depreciation</dt>
                <dd className="font-semibold">${Math.round(depreciation.annual).toLocaleString()}/yr</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Years Owned</dt>
                <dd className="font-semibold">{depreciation.yearsOwned}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Object.entries(summary).map(([type, total]) => {
            const meta = typeLabels[type] ?? { label: type, icon: DollarSign, color: 'text-primary' };
            const Icon = meta.icon;
            return (
              <Card key={type}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                    <p className="text-lg font-semibold">${total.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const meta = typeLabels[r.record_type];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(r.effective_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {meta?.label ?? r.record_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.description || '-'}</TableCell>
                    <TableCell className="text-right font-medium">${r.amount.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(FinancialsTab);
