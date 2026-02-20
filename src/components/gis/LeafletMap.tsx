import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Asset } from '@/hooks/useAssets';

// Declare Leaflet types for TypeScript
declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

// Validate coordinate is a valid number within lat/lng ranges
const isValidLatitude = (lat: number | null | undefined): lat is number => {
  if (lat == null || typeof lat !== 'number') return false;
  return !isNaN(lat) && lat >= -90 && lat <= 90;
};

const isValidLongitude = (lng: number | null | undefined): lng is number => {
  if (lng == null || typeof lng !== 'number') return false;
  return !isNaN(lng) && lng >= -180 && lng <= 180;
};

// Get marker color based on health status and risk level
const getMarkerColor = (healthStatus: string, riskLevel: string): string => {
  if (riskLevel === 'Severe' || riskLevel === 'High') return '#ef4444'; // red
  if (healthStatus === 'Critical' || healthStatus === 'Poor') return '#f97316'; // orange
  if (healthStatus === 'Fair' || riskLevel === 'Medium') return '#eab308'; // yellow
  return '#22c55e'; // green for Excellent/Good + Low risk
};

interface LeafletMapProps {
  assets: Asset[];
}

export default function LeafletMap({ assets }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Filter to only assets with valid coordinates
  const validAssets = assets.filter(asset => 
    isValidLatitude(Number(asset.latitude)) && 
    isValidLongitude(Number(asset.longitude))
  );

  // Calculate center from valid assets
  const getCenter = (): [number, number] => {
    if (validAssets.length === 0) {
      return [39.8283, -98.5795]; // Center of US as default
    }
    
    const avgLat = validAssets.reduce((sum, a) => sum + Number(a.latitude), 0) / validAssets.length;
    const avgLng = validAssets.reduce((sum, a) => sum + Number(a.longitude), 0) / validAssets.length;
    
    if (!isValidLatitude(avgLat) || !isValidLongitude(avgLng)) {
      return [39.8283, -98.5795];
    }
    
    return [avgLat, avgLng];
  };

  // Load Leaflet from CDN
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (window.L) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before load
      if (!window.L) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!isLoaded || !window.L || !mapContainerRef.current) return;

    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) return;

    const L = window.L;
    const center = getCenter();

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 4,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  // Update markers when assets change
  useEffect(() => {
    if (!isLoaded || !window.L || !mapInstanceRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    validAssets.forEach(asset => {
      const lat = Number(asset.latitude);
      const lng = Number(asset.longitude);

      if (!isValidLatitude(lat) || !isValidLongitude(lng)) return;

      const color = getMarkerColor(asset.health_status || 'Good', asset.risk_level || 'Low');

      // Create custom icon using divIcon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      // Create marker with popup showing REAL DATA ONLY
      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px; padding: 8px;">
            <h3 style="font-weight: 600; margin-bottom: 4px;">${asset.asset_name}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${asset.asset_code}</p>
            <div style="font-size: 13px; line-height: 1.6;">
              <p><strong>Category:</strong> ${asset.category}</p>
              <p><strong>Status:</strong> ${asset.status}</p>
              <p><strong>Health:</strong> ${asset.health_status || 'Good'}</p>
              <p><strong>Risk:</strong> ${asset.risk_level || 'Low'}</p>
              <p><strong>Location:</strong> ${asset.location}</p>
            </div>
          </div>
        `);

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (validAssets.length > 0) {
      const bounds = L.latLngBounds(
        validAssets.map(a => [Number(a.latitude), Number(a.longitude)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [validAssets, isLoaded]);

  // Error fallback - static map placeholder
  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20">
        <Card className="max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold">Map unavailable</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The interactive map couldn't be loaded.
              </p>
            </div>
            {/* Static fallback with asset count */}
            <div className="bg-muted rounded-lg p-4 text-left">
              <p className="text-sm font-medium mb-2">Asset Summary:</p>
              <p className="text-sm text-muted-foreground">
                {validAssets.length} assets with location data
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>🟢 Healthy: {validAssets.filter(a => (a.health_status === 'Good' || a.health_status === 'Excellent') && (a.risk_level === 'Low')).length}</p>
                <p>🟠 Warning: {validAssets.filter(a => a.health_status === 'Fair' || a.health_status === 'Poor' || a.risk_level === 'Medium').length}</p>
                <p>🔴 Critical: {validAssets.filter(a => a.health_status === 'Critical' || a.risk_level === 'High' || a.risk_level === 'Severe').length}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Loading Map
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
        style={{ minHeight: '500px', background: '#1a1a2e' }}
      />
      
      {/* Asset Count Badge */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="bg-card/90 backdrop-blur">
          <CardContent className="p-3">
            <p className="text-sm">
              <span className="font-semibold">{validAssets.length}</span> assets displayed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
