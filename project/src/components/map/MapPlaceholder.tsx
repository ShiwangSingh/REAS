import { useEffect, useRef } from 'react';
import { Fuel } from 'lucide-react';
import { MapContainer, TileLayer, useMap, Marker, Polyline, Circle, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapStore } from '@/stores';
import { ALERT_CONFIG } from '@/data/mockData';

const TRAFFIC_COLORS = {
  low: '#22c55e',    // Green
  medium: '#eab308', // Yellow
  heavy: '#ef4444',  // Red
  jam: '#7f1d1d'     // Dark Red
};

const MOCK_TRAFFIC_LEVELS = ['low', 'medium', 'heavy', 'jam'];

// Fix for default marker icons in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapContainerProps {
  className?: string;
  center?: [number, number]; // Mapbox expects [lng, lat], Leaflet expects [lat, lng]. We'll swap them.
  zoom?: number;
  interactive?: boolean;
  children?: React.ReactNode;
  alerts?: any[];
}

// A helper component to keep the map centered when props change
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  const lastViewRef = useRef({ lat: center[1], lng: center[0], z: zoom });

  useEffect(() => {
    // Only apply view if the coordinates or zoom actually changed from the last time we applied them
    const isNew = center[1] !== lastViewRef.current.lat || 
                  center[0] !== lastViewRef.current.lng || 
                  zoom !== lastViewRef.current.z;
    
    if (isNew) {
      map.setView([center[1], center[0]], zoom);
      lastViewRef.current = { lat: center[1], lng: center[0], z: zoom };
    }
    
    // Still invalidate size for layout changes
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map, center, zoom]);

  return null;
}

export function MapPlaceholder({
  className = '',
  center,
  zoom,
  interactive = true,
  children,
  alerts = []
}: MapContainerProps) {
  const { userLocation, activeRoute, alternativeRoutes, center: storeCenter, zoom: storeZoom, mapType, setActiveRoute, activeLayers } = useMapStore();

  const actualCenter = center || storeCenter;
  const actualZoom = typeof zoom !== 'undefined' ? zoom : storeZoom;
  const route = activeRoute;

  // Convert [lng, lat] to [lat, lng] for Leaflet
  const leafletCenter: [number, number] = [actualCenter[1], actualCenter[0]];

  return (
    <div className={`relative min-h-[300px] ${className}`}>
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer
          key={`map-${actualCenter[0]}-${actualCenter[1]}`}
          center={[actualCenter[1], actualCenter[0]]}
          zoom={actualZoom}
          zoomControl={interactive}
          dragging={interactive}
          scrollWheelZoom={interactive}
          doubleClickZoom={interactive}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
          <MapController center={actualCenter} zoom={actualZoom} />
          {userLocation && (
            <>
              {/* Outer pulse/accuracy circle */}
              <Circle 
                center={[userLocation[1], userLocation[0]]}
                radius={50}
                pathOptions={{ 
                  fillColor: '#3b82f6', 
                  fillOpacity: 0.15, 
                  color: '#3b82f6', 
                  weight: 1,
                  className: 'animate-pulse' 
                }} 
              />
              {/* Inner solid dot */}
              <CircleMarker 
                center={[userLocation[1], userLocation[0]]}
                radius={8}
                pathOptions={{ 
                  fillColor: '#3b82f6', 
                  fillOpacity: 1, 
                  color: '#ffffff', 
                  weight: 2 
                }}
              />
            </>
          )}

          {alternativeRoutes && alternativeRoutes.map((r) => {
            const isActive = activeRoute?.id === r.id;
            const coords = r.coordinates;
            
            if (!isActive || !activeLayers.includes('traffic')) {
              return (
                <Polyline 
                  key={r.id}
                  positions={coords.map((c: any) => [c[1], c[0]])} 
                  color={isActive ? "#3b82f6" : "#94a3b8"} 
                  weight={isActive ? 6 : 4} 
                  opacity={isActive ? 0.9 : 0.4}
                  eventHandlers={{ click: () => setActiveRoute(r) }}
                />
              );
            }

            // Render active route with traffic segments
            const segments: React.ReactNode[] = [];
            let currentLevel = 'low';
            if (!coords || coords.length === 0) return null;
            let currentPoints: [number, number][] = [[coords[0][1], coords[0][0]]];

            for (let i = 1; i < coords.length; i++) {
              // Mock congestion logic: deterministic based on index for demo
              let level = 'low';
              const progress = i / coords.length;
              if (progress > 0.3 && progress < 0.5) level = 'medium';
              else if (progress > 0.7 && progress < 0.8) level = 'heavy';
              else if (progress > 0.85 && progress < 0.95) level = 'jam';

              if (level === currentLevel) {
                currentPoints.push([coords[i][1], coords[i][0]]);
              } else {
                segments.push(
                  <Polyline 
                    key={`${r.id}-seg-${i}`}
                    positions={currentPoints}
                    color={TRAFFIC_COLORS[currentLevel as keyof typeof TRAFFIC_COLORS]}
                    weight={8}
                    opacity={1}
                    eventHandlers={{ click: () => setActiveRoute(r) }}
                  />
                );
                currentLevel = level;
                currentPoints = [[coords[i-1][1], coords[i-1][0]], [coords[i][1], coords[i][0]]];
              }
            }
            
            // Add last segment
            segments.push(
              <Polyline 
                key={`${r.id}-seg-last`}
                positions={currentPoints}
                color={TRAFFIC_COLORS[currentLevel as keyof typeof TRAFFIC_COLORS]}
                weight={8}
                opacity={1}
                eventHandlers={{ click: () => setActiveRoute(r) }}
              />
            );

            return segments;
          })}

          {alerts.map((alert) => {
            const config = ALERT_CONFIG[alert.type];
            const isFuel = alert.type === 'fuel';
            
            return (
              <CircleMarker 
                key={alert.id} 
                center={[alert.location.lat, alert.location.lng]}
                radius={isFuel ? 14 : 10}
                pathOptions={{ 
                  fillColor: isFuel ? '#0ea5e9' : (config.color === 'alert-critical' ? '#ef4444' : 
                             config.color === 'alert-high' ? '#f97316' : 
                             config.color === 'alert-medium' ? '#eab308' : '#3b82f6'), 
                  fillOpacity: 0.9, 
                  color: '#ffffff', 
                  weight: 2 
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${isFuel ? 'bg-sky-500' : `bg-${config.color}`}`} />
                      <h4 className="font-bold text-sm m-0">{alert.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground m-0 mb-1">{alert.description}</p>
                    <div className="flex justify-between items-center mt-2 border-t pt-1 border-border/50">
                      <span className="text-[10px] font-medium text-muted-foreground">{alert.location.road}</span>
                      <span className="text-[10px] bg-secondary px-1 rounded uppercase font-bold">{alert.type}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
          
          {/* Traffic Legend */}
          {activeLayers.includes('traffic') && (
            <div className="absolute top-20 left-4 z-[1001] flex flex-col gap-1 rounded-lg border border-border bg-card/90 backdrop-blur-sm p-2 shadow-sm pointer-events-auto">
              <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Traffic Density</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: TRAFFIC_COLORS.low }} />
                <span className="text-[10px] text-foreground">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: TRAFFIC_COLORS.medium }} />
                <span className="text-[10px] text-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: TRAFFIC_COLORS.heavy }} />
                <span className="text-[10px] text-foreground">Heavy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: TRAFFIC_COLORS.jam }} />
                <span className="text-[10px] text-foreground">Gridlock</span>
              </div>
            </div>
          )}
        </MapContainer>
      </div>

      {/* Overlay children (like floating buttons) on top of the map map */}
      <div className="absolute inset-0 z-[1000] pointer-events-none flex flex-col">
        <div className="w-full h-full relative *:pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
