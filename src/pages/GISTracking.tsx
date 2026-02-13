import { useState, useMemo, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Filter, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';

// Lazy load the CDN-based Leaflet map component
const LeafletMap = lazy(() => import('@/components/gis/LeafletMap'));

const assetTypes = ['Electrical', 'Mechanical', 'IT', 'Vehicles', 'General'];
const healthStatuses = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];
const riskLevels = ['Low', 'Medium', 'High', 'Severe'];

// Loading skeleton for the map
function MapLoadingSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-muted/50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}

// Fallback component when map fails
function MapErrorFallback({ assets }: { assets: { length: number } }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-muted/20">
      <Card className="max-w-sm">
        <CardContent className="p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="font-semibold">Map unavailable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The interactive map couldn't be loaded. Showing static summary.
            </p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-left">
            <p className="text-sm font-medium mb-2">Assets with location:</p>
            <p className="text-2xl font-bold">{assets.length}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GISTracking() {
  const navigate = useNavigate();
  const { data: assets = [], isLoading, error } = useAssets();
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedHealthStatuses, setSelectedHealthStatuses] = useState<string[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>([]);

  // Filter assets that have valid coordinates
  const assetsWithLocation = useMemo(() => {
    return assets.filter(asset => 
      asset.latitude != null && 
      asset.longitude != null &&
      !isNaN(Number(asset.latitude)) &&
      !isNaN(Number(asset.longitude)) &&
      Number(asset.latitude) >= -90 && Number(asset.latitude) <= 90 &&
      Number(asset.longitude) >= -180 && Number(asset.longitude) <= 180
    );
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assetsWithLocation.filter(asset => {
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(asset.category);
      const healthMatch = selectedHealthStatuses.length === 0 || selectedHealthStatuses.includes(asset.health_status || 'Good');
      const riskMatch = selectedRiskLevels.length === 0 || selectedRiskLevels.includes(asset.risk_level || 'Low');
      return typeMatch && healthMatch && riskMatch;
    });
  }, [assetsWithLocation, selectedTypes, selectedHealthStatuses, selectedRiskLevels]);

  const toggleFilter = (value: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelected(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedHealthStatuses([]);
    setSelectedRiskLevels([]);
  };

  // Back button handler - uses router navigation (no page refresh)
  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Filters Sidebar */}
        <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto flex-shrink-0">
          {/* Back Navigation - Always visible */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 -ml-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>

          {/* Asset Type Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Asset Type</h4>
            <div className="space-y-2">
              {assetTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Health Status Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Health Status</h4>
            <div className="space-y-2">
              {healthStatuses.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`health-${status}`}
                    checked={selectedHealthStatuses.includes(status)}
                    onCheckedChange={() => toggleFilter(status, selectedHealthStatuses, setSelectedHealthStatuses)}
                  />
                  <Label htmlFor={`health-${status}`} className="text-sm cursor-pointer">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Risk Level</h4>
            <div className="space-y-2">
              {riskLevels.map(level => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`risk-${level}`}
                    checked={selectedRiskLevels.includes(level)}
                    onCheckedChange={() => toggleFilter(level, selectedRiskLevels, setSelectedRiskLevels)}
                  />
                  <Label htmlFor={`risk-${level}`} className="text-sm cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Healthy (Good/Excellent)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">Fair / Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <span className="text-xs text-muted-foreground">Warning (Poor)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">Critical / High Risk</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Total assets: {assets.length}</p>
              <p>With location: {assetsWithLocation.length}</p>
              <p>Displayed: {filteredAssets.length}</p>
            </div>
          </div>
        </div>

        {/* Map Container - explicit dimensions */}
        <div className="flex-1 relative" style={{ minHeight: '500px', width: '100%' }}>
          <div className="absolute top-4 left-4 z-[1000]">
            <Button variant="secondary" size="sm" className="shadow-lg">
              <MapPin className="h-4 w-4 mr-2" />
              Geotag
            </Button>
          </div>

          {isLoading ? (
            <MapLoadingSkeleton />
          ) : error ? (
            <div className="h-full w-full flex items-center justify-center">
              <Card className="max-w-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <div>
                    <h3 className="font-semibold">Failed to load assets</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Could not retrieve asset data. Please try again.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleBack}>
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : assetsWithLocation.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <Card className="max-w-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-semibold">No assets with location data</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add latitude and longitude to your assets to see them on the map.
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/assets">Go to Asset Master</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <ErrorBoundary fallback={<MapErrorFallback assets={filteredAssets} />}>
              <Suspense fallback={<MapLoadingSkeleton />}>
                <LeafletMap assets={filteredAssets} />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
