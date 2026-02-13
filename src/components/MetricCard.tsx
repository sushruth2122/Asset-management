import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
}: MetricCardProps) {
  const changeColorClass =
    changeType === 'positive'
      ? 'text-success'
      : changeType === 'negative'
      ? 'text-destructive'
      : 'text-muted-foreground';

  return (
    <Card className="card-glow bg-card border-border hover:border-primary/30 transition-colors duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <p className={`text-sm ${changeColorClass}`}>{change}</p>
            )}
          </div>
          <div className="p-2 bg-secondary rounded-lg">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
