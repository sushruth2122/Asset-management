import { Suspense, lazy, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Box, MapPin, Calendar, DollarSign, Shield, Activity, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import TopNav from '@/components/TopNav';
import { useAsset, useUpdateAsset, type Asset, type LifecycleStage } from '@/hooks/useAssets';
import { useCreateLifecycleEvent } from '@/hooks/useAsset360';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ── Lazy Tab Components ──
const InformationTab = lazy(() => import('@/components/asset360/InformationTab'));
const LifecycleTab = lazy(() => import('@/components/asset360/LifecycleTab'));
const DocumentsTab = lazy(() => import('@/components/asset360/DocumentsTab'));
const InsuranceTab = lazy(() => import('@/components/asset360/InsuranceTab'));
const WarrantyTab = lazy(() => import('@/components/asset360/WarrantyTab'));
const FinancialsTab = lazy(() => import('@/components/asset360/FinancialsTab'));
const ReplacementTab = lazy(() => import('@/components/asset360/ReplacementTab'));
const HealthTab = lazy(() => import('@/components/asset360/HealthTab'));
const SensorsTab = lazy(() => import('@/components/asset360/SensorsTab'));
const AnalyticsTab = lazy(() => import('@/components/asset360/AnalyticsTab'));

const TABS = [
  'information', 'lifecycle', 'documents', 'insurance', 'warranty',
  'financials', 'replacement', 'health', 'sensors', 'analytics',
] as const;

type TabKey = (typeof TABS)[number];

function TabFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

const lifecycleBadgeColors: Record<string, string> = {
  planning: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  retired: 'bg-red-500/20 text-red-400 border-red-500/30',
  disposed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const statusEmoji: Record<string, string> = {
  active: '\u{1F7E2}',
  inactive: '\u26AA',
  maintenance: '\u{1F7E0}',
  retired: '\u{1F534}',
  disposed: '\u26AB',
  planning: '\u{1F7E3}',
};

const ALL_STAGES: LifecycleStage[] = ['planning', 'active', 'maintenance', 'inactive', 'retired', 'disposed'];

// ── Memoized Header ──
interface HeaderProps {
  asset: Asset;
  onBack: () => void;
  onStatusChange: (stage: LifecycleStage) => void;
}

const AssetHeader = memo(function AssetHeader({ asset, onBack, onStatusChange }: HeaderProps) {
  const summaryCards = useMemo(() => [
    { icon: MapPin, label: 'Location', value: asset.location || '-' },
    { icon: Calendar, label: 'Purchase Date', value: asset.purchase_date ? format(new Date(asset.purchase_date), 'dd MMM yyyy') : '-' },
    { icon: DollarSign, label: 'Purchase Value', value: `$${asset.purchase_value.toLocaleString()}` },
    { icon: Shield, label: 'Warranty', value: asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'dd MMM yyyy') : 'N/A' },
    { icon: Activity, label: 'Health', value: asset.health_status || 'Good' },
  ], [asset]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Box className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground truncate">{asset.asset_name}</h1>
            <Badge variant="outline" className="font-mono text-xs">{asset.asset_code}</Badge>

            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-1 ${lifecycleBadgeColors[asset.lifecycle_stage] ?? ''}`}>
                  {statusEmoji[asset.lifecycle_stage] ?? ''} {asset.lifecycle_stage}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {ALL_STAGES.filter((s) => s !== asset.lifecycle_stage).map((stage) => (
                  <DropdownMenuItem key={stage} onClick={() => onStatusChange(stage)} className="capitalize">
                    {statusEmoji[stage]} {stage}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {asset.manufacturer} {asset.model} &middot; {asset.category}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryCards.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="bg-card">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
});

// ── Main Page ──

export default function Asset360() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const rawTab = searchParams.get('tab') ?? 'information';
  const activeTab: TabKey = TABS.includes(rawTab as TabKey) ? (rawTab as TabKey) : 'information';

  const { data: asset, isLoading, error } = useAsset(id ?? null);
  const updateAsset = useUpdateAsset();
  const createLifecycleEvent = useCreateLifecycleEvent();

  const handleBack = useCallback(() => navigate('/assets'), [navigate]);

  const handleTabChange = useCallback((value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  }, [setSearchParams]);

  const handleStatusChange = useCallback((newStage: LifecycleStage) => {
    if (!asset || !id) return;
    const oldStage = asset.lifecycle_stage;

    updateAsset.mutate(
      { id, lifecycle_stage: newStage },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['assets', id] });
          createLifecycleEvent.mutate({
            asset_id: id,
            event_type: 'transferred',
            title: `Status changed: ${oldStage} \u2192 ${newStage}`,
            from_stage: oldStage,
            to_stage: newStage,
            description: `Lifecycle stage changed from ${oldStage} to ${newStage}`,
            performed_by: null,
            event_date: new Date().toISOString(),
            metadata: { auto: true },
          });
          toast.success(`Status changed to ${newStage}`);
        },
      },
    );
  }, [asset, id, updateAsset, createLifecycleEvent, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-destructive mb-4">
              {error ? 'Failed to load asset details.' : 'Asset not found.'}
            </p>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assets
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <AssetHeader asset={asset} onBack={handleBack} onStatusChange={handleStatusChange} />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-muted/50">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="replacement">Replacement</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="information">
              {activeTab === 'information' && (
                <Suspense fallback={<TabFallback />}><InformationTab asset={asset} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="lifecycle">
              {activeTab === 'lifecycle' && (
                <Suspense fallback={<TabFallback />}><LifecycleTab assetId={asset.id} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="documents">
              {activeTab === 'documents' && (
                <Suspense fallback={<TabFallback />}><DocumentsTab assetId={asset.id} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="insurance">
              {activeTab === 'insurance' && (
                <Suspense fallback={<TabFallback />}><InsuranceTab assetId={asset.id} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="warranty">
              {activeTab === 'warranty' && (
                <Suspense fallback={<TabFallback />}><WarrantyTab assetId={asset.id} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="financials">
              {activeTab === 'financials' && (
                <Suspense fallback={<TabFallback />}><FinancialsTab assetId={asset.id} asset={asset} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="replacement">
              {activeTab === 'replacement' && (
                <Suspense fallback={<TabFallback />}><ReplacementTab asset={asset} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="health">
              {activeTab === 'health' && (
                <Suspense fallback={<TabFallback />}><HealthTab asset={asset} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="sensors">
              {activeTab === 'sensors' && (
                <Suspense fallback={<TabFallback />}><SensorsTab assetId={asset.id} /></Suspense>
              )}
            </TabsContent>
            <TabsContent value="analytics">
              {activeTab === 'analytics' && (
                <Suspense fallback={<TabFallback />}><AnalyticsTab assetId={asset.id} asset={asset} /></Suspense>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
