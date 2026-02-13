import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Sparkles, Calendar, Info } from 'lucide-react';

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
    : 'AI-Powered Maintenance Recommendation';
  
  const description = isCritical
    ? `Our AI has detected early warning signs of potential failure in your ${alert.assetName}. Immediate preventive action is recommended within ${alert.daysUntilAction} days to avoid costly downtime (${alert.confidence}% confidence).`
    : `Based on our analysis, we recommend scheduling preventive maintenance for your ${alert.assetName} within ${alert.daysUntilAction} days to avoid potential downtime (${alert.confidence}% confidence).`;
  
  const priority = `Highest Priority: ${alert.category}`;
  
  return (
    <Card className={isCritical ? 'card-alert-critical' : 'card-glow bg-card'}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-center">
          <div className={`p-3 rounded-full ${isCritical ? 'bg-destructive/20' : 'bg-primary/20'}`}>
            {isCritical ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : (
              <Sparkles className="h-6 w-6 text-primary" />
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className={`p-3 rounded-lg text-center ${isCritical ? 'bg-destructive/10' : 'bg-secondary'}`}>
          <p className="text-sm font-medium text-foreground">{priority}</p>
          <p className="text-xs text-muted-foreground">
            Estimated cost: ${alert.estimatedCost.toLocaleString()} • Impact: {alert.impact}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            variant={isCritical ? 'destructive' : 'default'}
            size="sm"
            className="gap-2"
            onClick={() => onScheduleNow(alert)}
          >
            <Calendar className="h-4 w-4" />
            Schedule Now
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => onViewDetails(alert)}
          >
            <Info className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
