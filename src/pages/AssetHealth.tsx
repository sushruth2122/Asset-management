import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Settings, ThumbsUp, AlertTriangle, Activity, Thermometer, Gauge, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssets } from '@/hooks/useAssets';
import { useCreateWorkOrder } from '@/hooks/useWorkOrders';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

type HealthStatus = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';

const healthStatusConfig: Record<HealthStatus, { color: string; bgColor: string; icon: React.ReactNode }> = {
  Excellent: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30', icon: <ThumbsUp className="h-3 w-3" /> },
  Good: { color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30', icon: <ThumbsUp className="h-3 w-3" /> },
  Fair: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30', icon: <Activity className="h-3 w-3" /> },
  Poor: { color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
  Critical: { color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
};

const getHealthScore = (status: string | null): number => {
  switch (status) {
    case 'Excellent': return 100;
    case 'Good': return 85;
    case 'Fair': return 65;
    case 'Poor': return 40;
    case 'Critical': return 15;
    default: return 100;
  }
};

const getProgressColor = (status: string | null): string => {
  switch (status) {
    case 'Excellent': return 'bg-emerald-500';
    case 'Good': return 'bg-green-500';
    case 'Fair': return 'bg-yellow-500';
    case 'Poor': return 'bg-orange-500';
    case 'Critical': return 'bg-red-500';
    default: return 'bg-emerald-500';
  }
};

export default function AssetHealth() {
  const navigate = useNavigate();
  const { data: assets, isLoading, refetch } = useAssets();
  const createWorkOrder = useCreateWorkOrder();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Count assets by health status
  const healthCounts = useMemo(() => {
    const counts: Record<HealthStatus, number> = {
      Excellent: 0,
      Good: 0,
      Fair: 0,
      Poor: 0,
      Critical: 0,
    };
    assets?.forEach((asset) => {
      const status = (asset.health_status as HealthStatus) || 'Excellent';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  }, [assets]);

  // Anomaly alerts (based on asset health)
  const anomalyAlerts = useMemo(() => {
    const poorOrCritical = assets?.filter(
      (a) => a.health_status === 'Poor' || a.health_status === 'Critical'
    ) || [];
    return {
      new: poorOrCritical.length,
      acknowledged: 0,
      resolved: 0,
      assets: poorOrCritical,
    };
  }, [assets]);

  // Generate sensor readings based on asset data
  const sensorReadings = useMemo(() => {
    const selectedAsset = selectedAssetId 
      ? assets?.find((a) => a.id === selectedAssetId) 
      : assets?.[0];
    
    if (!selectedAsset) return [];

    // Generate realistic sensor values based on health status
    const healthMultiplier = {
      'Excellent': 0.8,
      'Good': 0.9,
      'Fair': 1.0,
      'Poor': 1.15,
      'Critical': 1.3,
    }[selectedAsset.health_status || 'Good'] || 1;

    return [
      { 
        name: `${selectedAsset.category} Temperature`, 
        value: `${(45 + Math.random() * 30 * healthMultiplier).toFixed(2)} °C`, 
        icon: Thermometer, 
        status: healthMultiplier > 1.1 ? 'warning' : 'normal' 
      },
      { 
        name: `${selectedAsset.category} Vibration`, 
        value: `${(1.5 + Math.random() * 2 * healthMultiplier).toFixed(2)} mm/s`, 
        icon: Activity, 
        status: healthMultiplier > 1.1 ? 'warning' : 'normal' 
      },
      { 
        name: `${selectedAsset.category} Load`, 
        value: `${(400 + Math.random() * 400 * healthMultiplier).toFixed(2)} A`, 
        icon: Gauge, 
        status: healthMultiplier > 1.2 ? 'warning' : 'normal' 
      },
    ];
  }, [assets, selectedAssetId]);

  // Top 4 assets for display
  const topAssets = useMemo(() => {
    return assets?.slice(0, 4) || [];
  }, [assets]);

  // Selected asset or first one
  const selectedAsset = useMemo(() => {
    if (selectedAssetId) {
      return assets?.find((a) => a.id === selectedAssetId) || null;
    }
    return assets?.[0] || null;
  }, [assets, selectedAssetId]);

  const handleRefresh = () => {
    refetch();
  };

  const handleScheduleMaintenance = async (assetId: string, assetName: string, healthStatus: string) => {
    try {
      const dueDate = format(addDays(new Date(), healthStatus === 'Critical' ? 3 : 7), 'yyyy-MM-dd');
      const priority = healthStatus === 'Critical' ? 'Critical' : 'High';
      
      await createWorkOrder.mutateAsync({
        title: `Health Alert: ${assetName}`,
        description: `Maintenance work order auto-generated due to ${healthStatus.toLowerCase()} health status detected by sensor monitoring. Immediate attention required.`,
        asset_id: assetId,
        priority,
        work_order_type: 'Corrective',
        due_date: dueDate,
        status: 'Open',
      });

      toast.success('Work order created', {
        description: `Maintenance scheduled for ${assetName}`,
        action: {
          label: 'View',
          onClick: () => navigate('/work-orders'),
        },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Asset Health</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and IoT sensor data for your assets
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure Sensors
            </Button>
          </div>
        </div>

        {/* Top Row: Health Status + Anomaly Alerts + Asset Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-6">
          {/* Asset Health Status Card */}
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Asset Health Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(healthStatusConfig) as HealthStatus[]).map((status) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant="outline" className={`${healthStatusConfig[status].bgColor} ${healthStatusConfig[status].color} gap-1`}>
                    {healthStatusConfig[status].icon}
                    {status}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">{healthCounts[status]}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Anomaly Alerts Card */}
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Anomaly Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-3">
                {anomalyAlerts.new + anomalyAlerts.acknowledged + anomalyAlerts.resolved}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">New</span>
                  <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                    {anomalyAlerts.new}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Acknowledged</span>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {anomalyAlerts.acknowledged}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {anomalyAlerts.resolved}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Health Cards Grid */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {topAssets.map((asset) => {
              const status = (asset.health_status as HealthStatus) || 'Excellent';
              const score = getHealthScore(status);
              const config = healthStatusConfig[status] || healthStatusConfig.Excellent;

              return (
                <Card 
                  key={asset.id} 
                  className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedAssetId(asset.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-foreground line-clamp-2">{asset.asset_name}</h3>
                      <Badge variant="outline" className={`${config.bgColor} ${config.color} gap-1 shrink-0`}>
                        {config.icon}
                        {status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Progress 
                        value={score} 
                        className="h-2"
                        style={{ 
                          ['--progress-background' as string]: getProgressColor(status).replace('bg-', '')
                        }}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Health Score</span>
                        <span className="font-medium text-foreground">{score}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Asset Details Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">Asset Details</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {assets?.slice(0, 5).map((asset) => {
              const status = (asset.health_status as HealthStatus) || 'Excellent';
              const config = healthStatusConfig[status] || healthStatusConfig.Excellent;
              const isSelected = selectedAsset?.id === asset.id;

              return (
                <Button
                  key={asset.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className={`gap-2 ${isSelected ? '' : 'bg-card'}`}
                  onClick={() => setSelectedAssetId(asset.id)}
                >
                  <Badge variant="outline" className={`${config.bgColor} ${config.color} gap-1 text-xs`}>
                    {config.icon}
                    {status}
                  </Badge>
                  <span className="max-w-[120px] truncate">{asset.asset_name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Sensor Readings + Anomaly Alerts Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sensor Readings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sensor Readings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sensorReadings.map((reading, index) => {
                const Icon = reading.icon;
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{reading.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cyan-400">{reading.value}</span>
                      <div className={`h-2 w-2 rounded-full ${reading.status === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Anomaly Alerts Detail */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Anomaly Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anomalyAlerts.new === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No anomalies detected
                </div>
              ) : (
                <div className="space-y-2">
                  {anomalyAlerts.assets.map((asset) => (
                    <div 
                      key={asset.id} 
                      className="flex items-center justify-between p-2 rounded bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{asset.asset_name}</span>
                        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                          {asset.health_status}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="gap-1 text-xs"
                        onClick={() => handleScheduleMaintenance(asset.id, asset.asset_name, asset.health_status || 'Poor')}
                      >
                        <Calendar className="h-3 w-3" />
                        Schedule
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
