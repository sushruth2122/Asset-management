import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Activity, TrendingUp } from 'lucide-react';
import { useMTBFMTTRSummary, useMonthlyMTBFMTTR, useCategoryFailures } from '@/hooks/useMaintenanceMetrics';
import { ReportFilters } from '@/hooks/useReports';

interface MTBFMTTRTabProps {
  filters: ReportFilters;
}

const CATEGORY_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'];

export function MTBFMTTRTab({ filters }: MTBFMTTRTabProps) {
  const { data: summary, isLoading: loadingSummary } = useMTBFMTTRSummary(filters);
  const { data: monthlyData = [], isLoading: loadingMonthly } = useMonthlyMTBFMTTR(filters);
  const { data: categoryFailures = [], isLoading: loadingFailures } = useCategoryFailures(filters);

  const isLoading = loadingSummary || loadingMonthly || loadingFailures;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl">Maintenance Performance Metrics</CardTitle>
          <CardDescription>
            Track Mean Time Between Failures (MTBF) and Mean Time To Repair (MTTR)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* MTBF Chart */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Mean Time Between Failures (MTBF)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} days`, 'MTBF']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mtbf"
                      name="MTBF (days)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* MTTR Chart */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Mean Time To Repair (MTTR)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} hours`, 'MTTR']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mttr"
                      name="MTTR (hours)"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--warning))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Failure Frequency Chart */}
          <div>
            <h4 className="font-medium mb-4 text-foreground">Asset Failure Frequency</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryFailures} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="failureCount" 
                    name="Failure Count" 
                    fill="#f87171" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{summary?.avgMTBF || 0} days</p>
                <p className="text-sm text-muted-foreground">Average MTBF</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-warning" />
                <p className="text-3xl font-bold text-foreground">{summary?.avgMTTR || 0} hours</p>
                <p className="text-sm text-muted-foreground">Average MTTR</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="text-3xl font-bold text-foreground">{summary?.availability || 0}%</p>
                <p className="text-sm text-muted-foreground">Asset Availability</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
