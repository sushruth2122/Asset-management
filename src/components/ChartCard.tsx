import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { 
  useAssetValueTrend, 
  useAssetsByCategory, 
  useUserGrowthData, 
  useAssetGrowthData 
} from '@/hooks/useDashboardData';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'bar' | 'line' | 'pie' | 'asset-growth';
  showViewAll?: boolean;
}

// Theme-aware color helpers that read CSS custom properties
function useChartColors() {
  return {
    grid: 'hsl(var(--border))',
    axis: 'hsl(var(--muted-foreground))',
    tooltipBg: 'hsl(var(--popover))',
    tooltipBorder: 'hsl(var(--border))',
    tooltipText: 'hsl(var(--popover-foreground))',
    primary: 'hsl(var(--chart-primary))',
    secondary: 'hsl(var(--chart-secondary))',
  };
}

export default function ChartCard({ title, subtitle, type, showViewAll = false }: ChartCardProps) {
  const assetValueTrend = useAssetValueTrend();
  const assetsByCategory = useAssetsByCategory();
  const userGrowthData = useUserGrowthData();
  const assetGrowthData = useAssetGrowthData();
  const c = useChartColors();

  const tooltipStyle = {
    backgroundColor: c.tooltipBg,
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: '8px',
    fontSize: '12px',
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assetValueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis dataKey="month" stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis 
                stroke={c.axis} 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
              />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.tooltipText }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
              <Bar dataKey="value" fill={c.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis dataKey="month" stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.tooltipText }} />
              <Line type="monotone" dataKey="users" stroke={c.primary} strokeWidth={2} dot={{ fill: c.primary, strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'asset-growth':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assetGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis dataKey="month" stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.tooltipText }} />
              <Bar dataKey="assets" fill={c.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = assetsByCategory.length > 0 
          ? assetsByCategory 
          : [{ name: 'No Data', value: 100, color: 'hsl(var(--chart-muted))' }];
        
        return (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="text-foreground font-medium ml-auto tabular-nums">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {showViewAll && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7">
            View All
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">{renderChart()}</CardContent>
    </Card>
  );
}
