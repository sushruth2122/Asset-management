import { memo, useMemo } from 'react';
import { differenceInDays, differenceInYears, format } from 'date-fns';
import { RefreshCw, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Asset } from '@/hooks/useAssets';

interface Props {
  asset: Asset;
}

function ReplacementTab({ asset }: Props) {
  const analysis = useMemo(() => {
    const purchaseDate = asset.acquisition_date ?? asset.purchase_date;
    const useful = asset.useful_life_years;
    const purchasePrice = asset.purchase_price ?? asset.purchase_value;
    const salvage = asset.salvage_value ?? 0;

    if (!purchaseDate) {
      return { hasData: false as const };
    }

    const startDate = new Date(purchaseDate);
    const ageYears = differenceInYears(new Date(), startDate);
    const ageDays = differenceInDays(new Date(), startDate);

    let remainingYears: number | null = null;
    let replacementDate: Date | null = null;
    let urgency: 'low' | 'medium' | 'high' = 'low';

    if (useful) {
      remainingYears = useful - ageYears;
      replacementDate = new Date(startDate);
      replacementDate.setFullYear(replacementDate.getFullYear() + useful);

      if (remainingYears <= 0) urgency = 'high';
      else if (remainingYears <= 2) urgency = 'medium';
    }

    const annualDepreciation = useful && useful > 0 ? (purchasePrice - salvage) / useful : null;
    const residualValue = annualDepreciation
      ? Math.max(purchasePrice - annualDepreciation * ageYears, salvage)
      : null;

    return {
      hasData: true as const,
      ageYears,
      ageDays,
      remainingYears,
      replacementDate,
      urgency,
      purchasePrice,
      salvage,
      residualValue,
    };
  }, [asset]);

  if (!analysis.hasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No acquisition date available to compute replacement schedule.
        </CardContent>
      </Card>
    );
  }

  const urgencyColors = {
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Asset Age</CardTitle>
            {analysis.remainingYears !== null && (
              <Badge variant="outline" className={urgencyColors[analysis.urgency]}>
                {analysis.urgency === 'high' ? (
                  <><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</>
                ) : analysis.urgency === 'medium' ? (
                  <><Clock className="h-3 w-3 mr-1" /> Soon</>
                ) : 'On Track'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Age</dt>
              <dd className="text-2xl font-bold">{analysis.ageYears} yrs</dd>
            </div>
            {analysis.remainingYears !== null && (
              <div>
                <dt className="text-muted-foreground text-xs">Remaining Life</dt>
                <dd className="text-2xl font-bold">
                  {analysis.remainingYears > 0 ? `${analysis.remainingYears} yrs` : 'Expired'}
                </dd>
              </div>
            )}
            {analysis.replacementDate && (
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs">Estimated Replacement Date</dt>
                <dd className="font-medium">{format(analysis.replacementDate, 'dd MMM yyyy')}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Replacement Cost Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Original Price</dt>
              <dd className="font-semibold">${analysis.purchasePrice.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Salvage Value</dt>
              <dd className="font-semibold">${analysis.salvage.toLocaleString()}</dd>
            </div>
            {analysis.residualValue !== null && (
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs">Current Residual Value</dt>
                <dd className="text-xl font-bold text-emerald-400">
                  ${Math.round(analysis.residualValue).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(ReplacementTab);
