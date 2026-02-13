import { memo } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Asset } from '@/hooks/useAssets';

interface Props {
  asset: Asset;
}

const healthConfig: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  good: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  fair: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  poor: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/30' },
};

const riskConfig: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-red-500/20 text-red-400',
};

function HealthTab({ asset }: Props) {
  const healthKey = (asset.health_status ?? 'good').toLowerCase();
  const riskKey = (asset.risk_level ?? 'low').toLowerCase();
  const hcfg = healthConfig[healthKey] ?? healthConfig.good;
  const Icon = hcfg.icon;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Health Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${hcfg.bg}`}>
              <Icon className={`h-8 w-8 ${hcfg.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{asset.health_status ?? 'Good'}</p>
              <p className="text-sm text-muted-foreground">Current health assessment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Risk Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={`text-lg px-4 py-2 ${riskConfig[riskKey] ?? ''}`}>
              {(asset.risk_level ?? 'Low').toUpperCase()}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {riskKey === 'low' && 'Asset requires no immediate attention.'}
              {riskKey === 'medium' && 'Schedule a review within the next cycle.'}
              {riskKey === 'high' && 'Immediate inspection recommended.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operational Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Status</dt>
              <dd className="font-medium capitalize">{asset.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Lifecycle Stage</dt>
              <dd className="font-medium capitalize">{asset.lifecycle_stage}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Warranty</dt>
              <dd className="font-medium">{asset.warranty_expiry ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">AMC Status</dt>
              <dd className="font-medium">{asset.amc || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(HealthTab);
