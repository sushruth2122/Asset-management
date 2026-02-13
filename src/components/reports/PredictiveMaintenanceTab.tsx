import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, AlertTriangle, Calendar, DollarSign, Activity, ExternalLink } from 'lucide-react';
import { 
  useMaintenancePredictionTrend, 
  useAssetFailureProbability, 
  useMaintenanceAlerts,
  useUpcomingPredictedMaintenance
} from '@/hooks/usePredictiveMaintenance';
import { ReportFilters } from '@/hooks/useReports';

interface PredictiveMaintenanceTabProps {
  filters: ReportFilters;
}

export function PredictiveMaintenanceTab({ filters }: PredictiveMaintenanceTabProps) {
  const { data: predictionTrend = [], isLoading: loadingTrend } = useMaintenancePredictionTrend(filters);
  const { data: failureProbability = [], isLoading: loadingProbability } = useAssetFailureProbability(filters);
  const { data: alerts = [], isLoading: loadingAlerts } = useMaintenanceAlerts(filters);
  const { data: upcomingMaintenance = [], isLoading: loadingUpcoming } = useUpcomingPredictedMaintenance(filters);

  const isLoading = loadingTrend || loadingProbability || loadingAlerts || loadingUpcoming;

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

  const criticalAlert = alerts.find(a => a.severity === 'critical');
  const recommendationAlert = alerts.find(a => a.severity === 'high' || a.severity === 'medium');

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Predictive Maintenance Insights</CardTitle>
          </div>
          <CardDescription>
            AI-powered predictions and recommendations for optimal maintenance scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Maintenance Prediction Trend */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Maintenance Prediction Trend</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actualEvents"
                      name="Actual Maintenance Events"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictedEvents"
                      name="Predicted Maintenance Events"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'hsl(var(--warning))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Failure Probability Scatter */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Asset Failure Probability Analysis</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="age" 
                      name="Age (years)" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      label={{ value: 'Asset Age (years)', position: 'bottom', fontSize: 10 }}
                    />
                    <YAxis 
                      dataKey="probability" 
                      name="Probability (%)" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'probability' ? `${value}%` : `${value} yrs`,
                        name === 'probability' ? 'Failure Probability' : 'Age'
                      ]}
                      labelFormatter={(label) => `Age: ${label} years`}
                    />
                    <Scatter 
                      name="Assets" 
                      data={failureProbability.slice(0, 20)} 
                      fill="#f97316"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Critical Maintenance Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-medium mb-4 text-foreground">Critical Maintenance Alerts</h4>
              {criticalAlert ? (
                <Card className="border-destructive/50 bg-destructive/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-destructive/20">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground">{criticalAlert.title}</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {criticalAlert.description}
                        </p>
                        <div className="mt-4 p-3 bg-destructive/20 rounded-lg">
                          <p className="text-sm font-medium text-destructive">
                            Highest Priority: {criticalAlert.priority}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estimated cost: ${criticalAlert.estimatedCost.toLocaleString()} • Impact: {criticalAlert.impact}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="bg-destructive hover:bg-destructive/90">
                            Schedule Now
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border bg-secondary/30">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No critical maintenance alerts</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-4 text-foreground">Preventive Maintenance Recommendations</h4>
              {recommendationAlert ? (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primary/20">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground">AI-Powered Maintenance Recommendation</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          Based on our analysis, we recommend scheduling preventive maintenance for your {recommendationAlert.assetName} within {recommendationAlert.daysUntilFailure} days to avoid potential downtime ({recommendationAlert.confidence}% confidence).
                        </p>
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium text-foreground">
                            Highest Priority: {recommendationAlert.priority}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estimated cost: ${recommendationAlert.estimatedCost.toLocaleString()} • Impact: {recommendationAlert.impact}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">
                            Schedule Now
                          </Button>
                          <Button size="sm" variant="ghost">
                            View Details <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border bg-secondary/30">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No maintenance recommendations at this time</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Upcoming Predicted Maintenance */}
          <div>
            <h4 className="font-medium mb-4 text-foreground">Upcoming Predicted Maintenance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMaintenance.length === 0 ? (
                <Card className="col-span-full border-border bg-secondary/30">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming predicted maintenance</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingMaintenance.map((maintenance, index) => (
                  <Card key={index} className="border-border bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-foreground">{maintenance.assetName}</h5>
                        <Badge 
                          variant="outline" 
                          className={
                            maintenance.likelihood >= 80 ? 'bg-destructive/20 text-destructive border-destructive/50' :
                            maintenance.likelihood >= 60 ? 'bg-warning/20 text-warning border-warning/50' :
                            'bg-success/20 text-success border-success/50'
                          }
                        >
                          {maintenance.likelihood}% Likelihood
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{maintenance.maintenanceType}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {maintenance.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>Cost: ${maintenance.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          <span>{maintenance.impact}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="link" className="p-0 mt-3 text-primary">
                        Details <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
