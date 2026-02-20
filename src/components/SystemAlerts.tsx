import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Database, User, Server } from 'lucide-react';

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

const typeIcons = {
  asset: Database,
  user: User,
  system: Server,
};

export default function SystemAlerts() {
  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <CardTitle className="text-sm font-semibold text-foreground">System Alerts</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">Recent alerts and notifications</p>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {mockAlerts.map((alert) => {
            const Icon = typeIcons[alert.type];
            return (
              <div key={alert.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{alert.type}</Badge>
                    <span className="text-[11px] text-muted-foreground">{alert.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
