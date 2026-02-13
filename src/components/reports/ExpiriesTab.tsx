import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Shield, 
  FileWarning, 
  Wrench, 
  Package,
  Download,
  Eye,
  Bell,
  Settings
} from 'lucide-react';
import { useExpiryItems, useExpirySummary, ExpiryType } from '@/hooks/useExpiryCompliance';
import { ReportFilters } from '@/hooks/useReports';
import { toast } from 'sonner';

interface ExpiriesTabProps {
  filters: ReportFilters;
}

const typeIcons: Record<ExpiryType, React.ReactNode> = {
  Insurance: <Shield className="h-4 w-4" />,
  Warranty: <FileWarning className="h-4 w-4" />,
  Maintenance: <Wrench className="h-4 w-4" />,
  Replacement: <Package className="h-4 w-4" />,
};

const typeColors: Record<ExpiryType, string> = {
  Insurance: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  Warranty: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  Maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  Replacement: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
};

const summaryColors: Record<ExpiryType, string> = {
  Insurance: 'from-blue-600/20 to-blue-500/10 border-blue-500/30',
  Warranty: 'from-purple-600/20 to-purple-500/10 border-purple-500/30',
  Maintenance: 'from-yellow-600/20 to-yellow-500/10 border-yellow-500/30',
  Replacement: 'from-pink-600/20 to-pink-500/10 border-pink-500/30',
};

export function ExpiriesTab({ filters }: ExpiriesTabProps) {
  const [expiryTab, setExpiryTab] = useState<'upcoming' | 'expired'>('upcoming');
  const { data: expiryItems = [], isLoading: loadingItems } = useExpiryItems(filters, expiryTab);
  const { data: expirySummary = [], isLoading: loadingSummary } = useExpirySummary(filters);

  const isLoading = loadingItems || loadingSummary;

  const handleExportReport = () => {
    const headers = ['Asset', 'Type', 'Document', 'Provider', 'Reference', 'Expiry Date', 'Status'];
    const rows = expiryItems.map(item => [
      item.assetName,
      item.type,
      item.documentType,
      item.provider,
      item.referenceNo,
      item.expiryDate,
      item.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expiry-report-${expiryTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Expiry report exported successfully');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Tabs value={expiryTab} onValueChange={(v) => setExpiryTab(v as 'upcoming' | 'expired')}>
            <div className="border-b border-border px-6 py-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-card">
                  <Calendar className="h-4 w-4 mr-2" />
                  Upcoming Expiries
                </TabsTrigger>
                <TabsTrigger value="expired" className="data-[state=active]:bg-card">
                  <FileWarning className="h-4 w-4 mr-2" />
                  Expired Items
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming" className="m-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Upcoming Expiry Dates
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Insurance policies, warranties, and maintenance contracts that will expire soon
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.info('Reminder configuration coming soon')}>
                      <Settings className="h-4 w-4 mr-1" />
                      Configure Reminders
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExportReport}>
                      <Download className="h-4 w-4 mr-1" />
                      Export Report
                    </Button>
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-muted-foreground">Asset</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Document</TableHead>
                        <TableHead className="text-muted-foreground">Provider</TableHead>
                        <TableHead className="text-muted-foreground">Reference #</TableHead>
                        <TableHead className="text-muted-foreground">Expiry Date</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiryItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No upcoming expiries found
                          </TableCell>
                        </TableRow>
                      ) : (
                        expiryItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">{item.assetName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={typeColors[item.type]}>
                                {typeIcons[item.type]}
                                <span className="ml-1">{item.type}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.documentType}</TableCell>
                            <TableCell className="text-muted-foreground">{item.provider}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">{item.referenceNo}</TableCell>
                            <TableCell className="text-muted-foreground">{item.expiryDate}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  item.status === 'expired' ? 'bg-destructive/20 text-destructive border-destructive/50' :
                                  item.status === 'expiring_soon' ? 'bg-warning/20 text-warning border-warning/50' :
                                  'bg-success/20 text-success border-success/50'
                                }
                              >
                                {item.daysLeft} days left
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                  <Bell className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expired" className="m-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <FileWarning className="h-5 w-5 text-destructive" />
                      Expired Items
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Documents and contracts that have already expired and need renewal
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleExportReport}>
                    <Download className="h-4 w-4 mr-1" />
                    Export Report
                  </Button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-muted-foreground">Asset</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Document</TableHead>
                        <TableHead className="text-muted-foreground">Provider</TableHead>
                        <TableHead className="text-muted-foreground">Reference #</TableHead>
                        <TableHead className="text-muted-foreground">Expired Date</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiryItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No expired items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        expiryItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">{item.assetName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={typeColors[item.type]}>
                                {typeIcons[item.type]}
                                <span className="ml-1">{item.type}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.documentType}</TableCell>
                            <TableCell className="text-muted-foreground">{item.provider}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">{item.referenceNo}</TableCell>
                            <TableCell className="text-muted-foreground">{item.expiryDate}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/50">
                                {item.daysLeft} days overdue
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Expiry Summary */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Expiry Summary</CardTitle>
          <CardDescription>Overview of expiring items by category for year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {expirySummary.map((summary) => (
              <Card 
                key={summary.type} 
                className={`border bg-gradient-to-br ${summaryColors[summary.type]}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded ${typeColors[summary.type]}`}>
                      {typeIcons[summary.type]}
                    </div>
                    <h4 className="font-medium text-foreground">{summary.type}</h4>
                  </div>
                  <div className="space-y-2">
                    {summary.type === 'Replacement' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-2xl font-bold text-foreground">{summary.plannedSoon || 0}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          planned soon
                        </div>
                        <div className="text-xs text-destructive">
                          {summary.overdue || 0} overdue
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-2xl font-bold text-foreground">{summary.expiringSoon}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          expiring soon
                        </div>
                        <div className="text-xs text-destructive">
                          {summary.expired} expired
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
