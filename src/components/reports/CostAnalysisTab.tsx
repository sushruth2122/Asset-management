import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
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
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  useCostBreakdown, 
  useMonthlyCostTrend, 
  useCategoryWiseCost, 
  useTopExpenseItems,
  useCostSummary 
} from '@/hooks/useCostAnalysis';
import { ReportFilters } from '@/hooks/useReports';

interface CostAnalysisTabProps {
  filters: ReportFilters;
}

const COST_COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7'];

export function CostAnalysisTab({ filters }: CostAnalysisTabProps) {
  const { data: costBreakdown = [], isLoading: loadingBreakdown } = useCostBreakdown(filters);
  const { data: monthlyCosts = [], isLoading: loadingMonthly } = useMonthlyCostTrend(filters);
  const { data: categoryCosts = [], isLoading: loadingCategory } = useCategoryWiseCost(filters);
  const { data: topExpenses = [], isLoading: loadingExpenses } = useTopExpenseItems(filters);
  const { data: summary, isLoading: loadingSummary } = useCostSummary(filters);

  const isLoading = loadingBreakdown || loadingMonthly || loadingCategory || loadingExpenses || loadingSummary;

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
          <CardTitle className="text-xl">Cost Breakdown Analysis</CardTitle>
          <CardDescription>
            Analyze maintenance and repair costs across your asset portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Cost Breakdown Pie Chart */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Maintenance & Repair Cost Breakdown</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      labelLine={false}
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COST_COLORS[index % COST_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Trend Line Chart */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Maintenance vs. Repair Costs Trend</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyCosts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="maintenanceCost"
                      name="Maintenance Cost"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="repairCost"
                      name="Repair Cost"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--destructive))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Cost by Asset Type */}
          <div className="mb-8">
            <h4 className="font-medium mb-4 text-foreground">Cost by Asset Type</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryCosts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="maintenanceCost" name="Maintenance Cost" fill="hsl(var(--primary))" stackId="a" />
                  <Bar dataKey="repairCost" name="Repair Cost" fill="#f87171" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Expense Items */}
          <div className="mb-8">
            <h4 className="font-medium mb-4 text-foreground">Top Expense Items</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-muted-foreground">Asset</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No expense data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topExpenses.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{item.asset}</TableCell>
                        <TableCell className="text-muted-foreground">{item.type}</TableCell>
                        <TableCell className="text-muted-foreground">{item.date}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          ${item.cost.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="text-3xl font-bold text-foreground">
                  ${(summary?.totalCost || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Maintenance & Repair Costs</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  ${(summary?.avgCostPerAsset || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Average Cost Per Asset</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-6 text-center">
                {(summary?.costReductionYoY || 0) >= 0 ? (
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 text-success" />
                ) : (
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-destructive" />
                )}
                <p className="text-3xl font-bold text-foreground">
                  {Math.abs(summary?.costReductionYoY || 0)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Cost {(summary?.costReductionYoY || 0) >= 0 ? 'Reduction' : 'Increase'} YoY
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
