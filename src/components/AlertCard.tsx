import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Sparkles, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MaintenanceAlert {
  id: string;
  assetId: string;
  assetName: string;
  category: string;
  type: 'critical' | 'recommendation';
  daysUntilAction: number;
  confidence: number;
  estimatedCost: number;
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  riskLevel: string;
}

interface AlertCardProps {
  alert: MaintenanceAlert;
  onScheduleNow: (alert: MaintenanceAlert) => void;
  onViewDetails: (alert: MaintenanceAlert) => void;
}

export default function AlertCard({
  alert,
  onScheduleNow,
  onViewDetails,
}: AlertCardProps) {
  const isCritical = alert.type === 'critical';
  
  const title = isCritical 
    ? 'Critical Maintenance Alert' 
    : 'AI-Powered Recommendation';
  
  const description = isCritical
    ? `Early warning signs detected for ${alert.assetName}. Action recommended within ${alert.daysUntilAction} days (${alert.confidence}% confidence).`
    : `Preventive maintenance suggested for ${alert.assetName} within ${alert.daysUntilAction} days (${alert.confidence}% confidence).`;
  
  return (
    <Card className={cn(
      'transition-shadow duration-200',
      isCritical ? 'card-alert-critical' : 'card-alert-warning'
    )}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            isCritical ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}>
            {isCritical ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm text-foreground">{title}</h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{alert.impact}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Est. ${alert.estimatedCost.toLocaleString()}</span>
            <span>{alert.category}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isCritical ? 'destructive' : 'default'}
            size="sm"
            className="h-8 text-xs gap-1.5 flex-1"
            onClick={() => onScheduleNow(alert)}
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule Now
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1.5"
            onClick={() => onViewDetails(alert)}
          >
            <Info className="h-3.5 w-3.5" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
