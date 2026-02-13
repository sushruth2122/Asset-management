import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Filter, Calendar, DollarSign, Clock, TrendingUp, AlertTriangle, Package, Sparkles, ShieldAlert } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { 
  useAssetStatusDistribution, 
  useMonthlyAssetAcquisitions, 
  useCategoryDistribution,
  useAssetLifecycleStats,
  ReportFilters 
} from '@/hooks/useReports';
import { useAssets } from '@/hooks/useAssets';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { MTBFMTTRTab } from '@/components/reports/MTBFMTTRTab';
import { CostAnalysisTab } from '@/components/reports/CostAnalysisTab';
import { PredictiveMaintenanceTab } from '@/components/reports/PredictiveMaintenanceTab';
import { ExpiriesTab } from '@/components/reports/ExpiriesTab';

const COLORS = ['#22c55e', '#f97316', '#64748b', '#eab308', '#3b82f6', '#a855f7'];

const statusColors: Record<string, string> = {
  'Active': '#22c55e',
  'Inactive': '#64748b',
  'Maintenance': '#f97316',
  'Disposed': '#ef4444',
};

export default function Reports() {
  const navigate = useNavigate();
  const { role } = useAuth();
  // Redirect non-admins to dashboard
  useEffect(() => {
    if (role && role !== 'admin') {
      toast.error('Access denied. Reports are only accessible to administrators.');
      navigate('/dashboard');
    }
  }, [role, navigate]);

  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'last_year',
    assetType: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('lifecycle');

  const { data: statusDistribution = [] } = useAssetStatusDistribution(filters);
  const { data: monthlyAcquisitions = [] } = useMonthlyAssetAcquisitions(filters);
  const { data: categoryDistribution = [] } = useCategoryDistribution(filters);
  const { data: lifecycleStats } = useAssetLifecycleStats(filters);
  const { data: assets = [] } = useAssets();

  // Show access denied if not admin
  if (role && role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Reports & Analytics are only accessible to administrators.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const categories = ['all', ...new Set(assets.map(a => a.category))];

  const pieData = statusDistribution.map(item => ({
    name: item.status,
    value: item.count,
    color: statusColors[item.status] || '#64748b',
  }));

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const headers = ['Asset Code', 'Asset Name', 'Category', 'Status', 'Purchase Value', 'Location'];
      const rows = assets.map(a => [a.asset_code, a.asset_name, a.category, a.status, a.purchase_value, a.location]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    toast.info('PDF export coming soon');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Gain insights from asset data with dynamic reports and analytics</p>
        </div>

        {/* Filters Bar */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                    <SelectItem value="last_year">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.assetType || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, assetType: value }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Asset Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Assets' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="lifecycle" className="data-[state=active]:bg-secondary">
              <Calendar className="h-4 w-4 mr-2" />
              Lifecycle
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-secondary">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="mtbf" className="data-[state=active]:bg-secondary">
              <Clock className="h-4 w-4 mr-2" />
              MTBF/MTTR
            </TabsTrigger>
            <TabsTrigger value="cost" className="data-[state=active]:bg-secondary">
              <TrendingUp className="h-4 w-4 mr-2" />
              Cost Analysis
            </TabsTrigger>
            <TabsTrigger value="predictive" className="data-[state=active]:bg-secondary">
              <Sparkles className="h-4 w-4 mr-2" />
              Predictive
            </TabsTrigger>
            <TabsTrigger value="expiries" className="data-[state=active]:bg-secondary">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Expiries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lifecycle" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Asset Lifecycle Overview</CardTitle>
                <CardDescription>Track asset acquisition, utilization, and disposal cycles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium mb-4">Asset Acquisition Timeline</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyAcquisitions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Acquisitions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Current Asset Status</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Card className="bg-secondary/30"><CardContent className="p-4 text-center"><Package className="h-8 w-8 mx-auto mb-2 text-primary" /><p className="text-3xl font-bold">{lifecycleStats?.totalAssets || 0}</p><p className="text-sm text-muted-foreground">Total Assets</p></CardContent></Card>
                  <Card className="bg-secondary/30"><CardContent className="p-4 text-center"><Calendar className="h-8 w-8 mx-auto mb-2 text-primary" /><p className="text-3xl font-bold">{lifecycleStats?.avgAge || 0}</p><p className="text-sm text-muted-foreground">Avg. Asset Age (Years)</p></CardContent></Card>
                  <Card className="bg-secondary/30"><CardContent className="p-4 text-center"><AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" /><p className="text-3xl font-bold">{lifecycleStats?.maintenanceAssets || 0}</p><p className="text-sm text-muted-foreground">Pending Maintenance</p></CardContent></Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Financial Analysis</CardTitle>
                <CardDescription>Asset value distribution and financial metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium mb-4">Value by Category</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryDistribution} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis dataKey="category" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                          <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Asset Count by Category</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="category" label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                            {categoryDistribution.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <Card className="bg-secondary/30"><CardContent className="p-4 text-center"><DollarSign className="h-8 w-8 mx-auto mb-2 text-success" /><p className="text-3xl font-bold">${(lifecycleStats?.totalValue || 0).toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Asset Value</p></CardContent></Card>
                  <Card className="bg-secondary/30"><CardContent className="p-4 text-center"><TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" /><p className="text-3xl font-bold">${lifecycleStats?.totalAssets ? Math.round((lifecycleStats.totalValue || 0) / lifecycleStats.totalAssets).toLocaleString() : 0}</p><p className="text-sm text-muted-foreground">Avg. Asset Value</p></CardContent></Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mtbf"><MTBFMTTRTab filters={filters} /></TabsContent>
          <TabsContent value="cost"><CostAnalysisTab filters={filters} /></TabsContent>
          <TabsContent value="predictive"><PredictiveMaintenanceTab filters={filters} /></TabsContent>
          <TabsContent value="expiries"><ExpiriesTab filters={filters} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
