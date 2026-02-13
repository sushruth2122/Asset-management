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

export default function ChartCard({ title, subtitle, type, showViewAll = false }: ChartCardProps) {
  const assetValueTrend = useAssetValueTrend();
  const assetsByCategory = useAssetsByCategory();
  const userGrowthData = useUserGrowthData();
  const assetGrowthData = useAssetGrowthData();

  const chartColor = 'hsl(187, 92%, 55%)';
  const chartSecondaryColor = 'hsl(152, 70%, 50%)';

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assetValueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 20%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis 
                stroke="hsl(215, 20%, 55%)" 
                fontSize={12}
                tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 9%)',
                  border: '1px solid hsl(220, 25%, 18%)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 20%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 9%)',
                  border: '1px solid hsl(220, 25%, 18%)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke={chartColor}
                strokeWidth={2}
                dot={{ fill: chartColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'asset-growth':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assetGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 20%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 9%)',
                  border: '1px solid hsl(220, 25%, 18%)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              />
              <Bar dataKey="assets" fill={chartSecondaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = assetsByCategory.length > 0 
          ? assetsByCategory 
          : [{ name: 'No Data', value: 100, color: 'hsl(220, 25%, 45%)' }];
        
        return (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="text-foreground font-medium">{entry.value}%</span>
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
    <Card className="card-glow bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {showViewAll && (
          <Button variant="link" size="sm" className="text-primary gap-1">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">{renderChart()}</CardContent>
    </Card>
  );
}
