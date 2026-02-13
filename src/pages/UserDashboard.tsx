import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import MetricCard from '@/components/MetricCard';
import AlertCard, { type MaintenanceAlert } from '@/components/AlertCard';
import ChartCard from '@/components/ChartCard';
import { Button } from '@/components/ui/button';
import { Box, DollarSign, TrendingUp, Clock, BarChart3, FileText } from 'lucide-react';
import { useDashboardMetrics, useMaintenanceAlerts } from '@/hooks/useDashboardData';
import { useCreateWorkOrder } from '@/hooks/useWorkOrders';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const metrics = useDashboardMetrics();
  const alerts = useMaintenanceAlerts();
  const createWorkOrder = useCreateWorkOrder();
  const isAdmin = role === 'admin';
  
  const [viewDetailsAlert, setViewDetailsAlert] = useState<MaintenanceAlert | null>(null);

  const handleScheduleNow = async (alert: MaintenanceAlert) => {
    try {
      const dueDate = format(addDays(new Date(), alert.daysUntilAction), 'yyyy-MM-dd');
      
      await createWorkOrder.mutateAsync({
        title: `${alert.type === 'critical' ? 'Critical Maintenance' : 'Preventive Maintenance'}: ${alert.assetName}`,
        description: `Auto-generated from ${alert.type === 'critical' ? 'critical alert' : 'AI recommendation'}. ${alert.type === 'critical' ? 'Immediate attention required' : 'Scheduled preventive maintenance'}. Confidence: ${alert.confidence}%. Estimated impact: ${alert.impact}.`,
        asset_id: alert.assetId,
        priority: alert.impact === 'Critical' ? 'Critical' : 'High',
        work_order_type: alert.type === 'critical' ? 'Corrective' : 'Preventive',
        due_date: dueDate,
        estimated_cost: alert.estimatedCost,
        status: 'Open',
      });

      toast.success('Work order created successfully', {
        description: 'You can view it in the Work Orders section.',
        action: {
          label: 'View',
          onClick: () => navigate('/work-orders'),
        },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleViewDetails = (alert: MaintenanceAlert) => {
    setViewDetailsAlert(alert);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Get exactly 2 alerts for the dashboard tiles
  const dashboardAlerts = alerts.slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Dashboard</h1>
            <p className="text-muted-foreground">Track your assets and monitor your equipment status</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/work-orders')}
            >
              <BarChart3 className="h-4 w-4" />
              Work Orders
            </Button>
            {isAdmin && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => navigate('/reports')}
              >
                <FileText className="h-4 w-4" />
                Reports & Analytics
              </Button>
            )}
          </div>
        </div>

        {/* Maintenance Alerts - EXACTLY 2 TILES */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Maintenance Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onScheduleNow={handleScheduleNow}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Assets" 
            value={metrics.totalAssets.toString()} 
            change={`${metrics.assetChange >= 0 ? '+' : ''}${metrics.assetChange}% from last month`} 
            changeType={metrics.assetChange >= 0 ? 'positive' : 'negative'} 
            icon={Box} 
          />
          <MetricCard 
            title="Total Value" 
            value={formatCurrency(metrics.totalValue)} 
            change={`${metrics.valueChange >= 0 ? '+' : ''}${metrics.valueChange}% from last month`} 
            changeType={metrics.valueChange >= 0 ? 'positive' : 'negative'} 
            icon={DollarSign} 
          />
          <MetricCard 
            title="Utilization Rate" 
            value={`${metrics.utilizationRate}%`} 
            change={metrics.utilizationRate >= 70 ? 'Healthy utilization' : 'Below target'} 
            changeType={metrics.utilizationRate >= 70 ? 'positive' : 'negative'} 
            icon={TrendingUp} 
          />
          <MetricCard 
            title="Maintenance Due" 
            value={metrics.maintenanceDue.toString()} 
            change={`${metrics.openWorkOrders} open work orders`} 
            changeType={metrics.maintenanceDue > 0 ? 'negative' : 'positive'} 
            icon={Clock} 
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Asset Value Trend" type="bar" showViewAll />
          <ChartCard title="Assets by Category" type="pie" showViewAll />
        </section>
      </main>

      {/* View Details Modal */}
      <Dialog open={!!viewDetailsAlert} onOpenChange={() => setViewDetailsAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewDetailsAlert?.type === 'critical' 
                ? 'Critical Maintenance Alert' 
                : 'AI-Powered Maintenance Recommendation'}
            </DialogTitle>
            <DialogDescription>
              Details for {viewDetailsAlert?.assetName}
            </DialogDescription>
          </DialogHeader>
          
          {viewDetailsAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset</p>
                  <p className="font-medium">{viewDetailsAlert.assetName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p className="font-medium">{viewDetailsAlert.impact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="font-medium">${viewDetailsAlert.estimatedCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Impact Level</p>
                  <p className="font-medium">{viewDetailsAlert.impact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="font-medium">{viewDetailsAlert.confidence}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recommended Action</p>
                  <p className="font-medium">
                    {viewDetailsAlert.type === 'critical' ? 'Immediate Corrective' : 'Preventive Maintenance'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    handleScheduleNow(viewDetailsAlert);
                    setViewDetailsAlert(null);
                  }}
                  className="flex-1"
                >
                  Schedule Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setViewDetailsAlert(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
