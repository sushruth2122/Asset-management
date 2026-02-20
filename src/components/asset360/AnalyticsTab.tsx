import { memo, useMemo } from 'react';
import { differenceInYears } from 'date-fns';
import { BarChart3, TrendingUp, Wrench, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAssetWorkOrders, useAssetCosts, useAssetLifecycleEvents } from '@/hooks/useAsset360';
import type { Asset } from '@/hooks/useAssets';

interface Props {
  assetId: string;
  asset: Asset;
}

function AnalyticsTab({ assetId, asset }: Props) {
  const { data: workOrders } = useAssetWorkOrders(assetId);
  const { data: costs } = useAssetCosts(assetId);
  const { data: events } = useAssetLifecycleEvents(assetId);

  const metrics = useMemo(() => {
    const totalWOs = workOrders?.length ?? 0;
    const completedWOs = workOrders?.filter(
      (wo) => wo.status === 'completed' || wo.status === 'closed',
    ).length ?? 0;
    const completionRate = totalWOs > 0 ? Math.round((completedWOs / totalWOs) * 100) : null;

    const totalCost = costs?.reduce((sum, c) => sum + c.amount, 0) ?? 0;
    const costByType = (costs ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.cost_type] = (acc[c.cost_type] ?? 0) + c.amount;
      return acc;
    }, {});

    const purchaseDate = asset.acquisition_date ?? asset.purchase_date;
    const ageYears = purchaseDate
      ? Math.max(differenceInYears(new Date(), new Date(purchaseDate)), 1)
      : null;
    const annualCost = ageYears ? Math.round(totalCost / ageYears) : null;

    const lifecycleCount = events?.length ?? 0;

    return { totalWOs, completedWOs, completionRate, totalCost, costByType, annualCost, lifecycleCount };
  }, [workOrders, costs, events, asset]);

  const statCards: { label: string; value: string; icon: React.ElementType; sub?: string }[] = [
    {
      label: 'Total Work Orders',
      value: String(metrics.totalWOs),
      icon: Wrench,
      sub: metrics.completionRate !== null ? `${metrics.completionRate}% completed` : undefined,
    },
    {
      label: 'Total Maintenance Cost',
      value: `$${metrics.totalCost.toLocaleString()}`,
      icon: DollarSign,
      sub: metrics.annualCost !== null ? `$${metrics.annualCost.toLocaleString()}/yr` : undefined,
    },
    {
      label: 'Lifecycle Events',
      value: String(metrics.lifecycleCount),
      icon: TrendingUp,
    },
    {
      label: 'Completion Rate',
      value: metrics.completionRate !== null ? `${metrics.completionRate}%` : '—',
      icon: BarChart3,
      sub: `${metrics.completedWOs} of ${metrics.totalWOs}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                  {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(metrics.costByType).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cost Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.costByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, amount]) => {
                  const pct = metrics.totalCost > 0 ? (amount / metrics.totalCost) * 100 : 0;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                        <span className="font-medium">${amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default memo(AnalyticsTab);
