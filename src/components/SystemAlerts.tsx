import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface SystemAlert {
  id: string;
  type: 'asset' | 'user' | 'system';
  message: string;
  timestamp: string;
}

const mockAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'asset',
    message: 'Asset XYZ123 requires maintenance',
    timestamp: '15/9/2023 at 10:30 am',
  },
  {
    id: '2',
    type: 'user',
    message: 'New user registration pending approval',
    timestamp: '15/9/2023 at 9:45 am',
  },
  {
    id: '3',
    type: 'system',
    message: 'System backup completed successfully',
    timestamp: '14/9/2023 at 11:00 pm',
  },
];

export default function SystemAlerts() {
  return (
    <Card className="card-glow bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">System Alerts</CardTitle>
        <p className="text-sm text-muted-foreground">Recent alerts and notifications</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
          >
            <div className="p-1.5 bg-warning/20 rounded-full mt-0.5">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium capitalize">{alert.type}:</span>{' '}
                {alert.message}
              </p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {alert.timestamp}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
