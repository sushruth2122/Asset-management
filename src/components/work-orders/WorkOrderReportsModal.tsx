import { useMemo } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '@/hooks/useWorkOrders';

interface WorkOrderReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrders: WorkOrder[];
}

const statusColors: Record<string, string> = {
  'PENDING': '#60a5fa',
  'IN PROGRESS': '#60a5fa', 
  'COMPLETED': '#60a5fa',
  'Open': '#60a5fa',
  'In Progress': '#60a5fa',
  'On Hold': '#60a5fa',
  'Completed': '#60a5fa',
  'Cancelled': '#60a5fa',
};

const priorityColors: Record<string, string> = {
  Low: '#34d399',
  Medium: '#34d399',
  High: '#34d399',
  Critical: '#34d399',
  LOW: '#34d399',
  MEDIUM: '#34d399',
  HIGH: '#34d399',
  CRITICAL: '#34d399',
};

export default function WorkOrderReportsModal({
  open,
  onOpenChange,
  workOrders,
}: WorkOrderReportsModalProps) {
  // Aggregate work orders by status (using simplified labels for chart)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      'PENDING': 0,
      'IN PROGRESS': 0,
      'COMPLETED': 0,
    };

    workOrders.forEach((wo) => {
      if (wo.status === 'Open' || wo.status === 'On Hold') {
        counts['PENDING']++;
      } else if (wo.status === 'In Progress') {
        counts['IN PROGRESS']++;
      } else if (wo.status === 'Completed' || wo.status === 'Cancelled') {
        counts['COMPLETED']++;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [workOrders]);

  // Aggregate work orders by priority
  const priorityData = useMemo(() => {
    const counts: Record<WorkOrderPriority, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    workOrders.forEach((wo) => {
      counts[wo.priority]++;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name: name.toUpperCase(),
      count,
    }));
  }, [workOrders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Work Order Reports
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Work Orders by Status */}
          <Card className="bg-muted/30 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">
                Work Orders by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#60a5fa" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center mt-2">
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <div className="h-3 w-3 rounded bg-blue-400" />
                  count
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Orders by Priority */}
          <Card className="bg-muted/30 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">
                Work Orders by Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#34d399" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center mt-2">
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <div className="h-3 w-3 rounded bg-emerald-400" />
                  count
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
