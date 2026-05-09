import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { AlertCard } from '@/components/alerts/AlertCard';
import { useAlertStore, useMapStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { NavigationWindow } from '@/components/map/NavigationWindow';
import {
  ArrowUpDown, Car, Bike, Footprints, Navigation,
  Plus, Minus, Compass, Layers, X, Fuel, Menu, LocateFixed
} from 'lucide-react';
import { AlertType } from '@/types';
import { ALERT_CONFIG } from '@/data/mockData';

const TRAVEL_MODES = [
  { mode: 'car' as const, icon: Car, label: 'Car' },
  { mode: 'bike' as const, icon: Bike, label: 'Bike' },
  { mode: 'auto' as const, icon: Car, label: 'Auto' },
  { mode: 'walk' as const, icon: Footprints, label: 'Walk' },
];

const FILTER_TYPES: AlertType[] = ['cctv', 'speed_breaker', 'construction', 'accident', 'waterlogging', 'fog', 'toll', 'police', 'fuel'];

export default function MapPage() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const { alerts, alertFilters, toggleFilter } = useAlertStore();
  const { 
    travelMode, setTravelMode, zoom, setZoom, 
    setActiveRoute, setCenter, mapType, setMapType,
    isNavigating, setIsNavigating, activeRoute,
    userLocation, setUserLocation, currentCity, setCurrentCity,
    alternativeRoutes, setAlternativeRoutes,
    activeLayers, toggleLayer
  } = useMapStore();

  const mapAlerts = (alerts || []).filter((a) => {
    return !alertFilters || alertFilters.length === 0 || alertFilters.includes(a.type);
  });

  const filteredAlerts = alerts.filter((a) => {
    const typeMatch = alertFilters.length === 0 || alertFilters.includes(a.type);
    let locationMatch = !currentCity || 
      a.location.city.toLowerCase().includes(currentCity.toLowerCase()) ||
      currentCity.toLowerCase().includes(a.location.city.toLowerCase()) ||
      a.location.city === 'Kharar' || a.location.city === 'Gharuan' || a.location.city === 'Mohali';

    if (activeRoute && activeRoute.coordinates) {
      const isNearRoute = activeRoute.coordinates.some(([lon, lat]) => {
        return Math.abs(a.location.lat - lat) < 0.02 && Math.abs(a.location.lng - lon) < 0.02;
      });
      if (isNearRoute) locationMatch = true;
    }
    return typeMatch && locationMatch;
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([longitude, latitude]);
        // We no longer auto-center here to allow the user to explore the map freely.
        // They can use the 'Re-center' button to snap back.
      },
      (err) => console.error("Geolocation watch error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, setCenter, setUserLocation]);

  useEffect(() => {
    const handleInitialLocation = async () => {
      // 1. Try Browser GPS (Best but needs HTTPS)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            updateLocation(latitude, longitude, "Current Location");
          },
          async (err) => {
            console.warn("GPS blocked or failed, trying network fallbacks", err);
            tryFallbacks();
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      } else {
        tryFallbacks();
      }
    };

    const tryFallbacks = async () => {
      // Fallback 1: ipapi.co
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          updateLocation(data.latitude, data.longitude, `${data.city || "My Area"} (Approx)`);
          return;
        }
      } catch (e) {}

      // Fallback 2: geolocation-db
      try {
        const res = await fetch('https://geolocation-db.com/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          updateLocation(data.latitude, data.longitude, `${data.city || "My Area"} (Approx)`);
          return;
        }
      } catch (e) {}

      // Final Fallback: Default to Delhi center
      console.warn("All location methods failed. Using default.");
      updateLocation(28.6139, 77.2090, "New Delhi (Default)");
    };

    const updateLocation = async (lat: number, lon: number, label: string) => {
      if (!lat || !lon) return;
      setCenter([lon, lat]);
      setUserLocation([lon, lat]);
      setZoom(label.includes('Approx') || label.includes('Default') ? 11 : 16);
      setFromInput(label);
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        if (data?.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
          if (city) setCurrentCity(city);
        }
      } catch (e) {}
    };

    if (!fromInput) handleInitialLocation();
  }, []);

  const fetchRoute = async () => {
    if (!fromInput || !toInput) return;
    try {
      const parseCoords = (input: string) => {
        const match = input.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
        if (match) return [parseFloat(match[3]), parseFloat(match[1])];
        return null;
      };
      let fromCoords = parseCoords(fromInput);
      let toCoords = parseCoords(toInput);
      const isCurrentLocation = (input: string) => 
        input.toLowerCase().includes('current location') || input.toLowerCase().includes('your location');

      if (!fromCoords && isCurrentLocation(fromInput)) {
        const { userLocation: storedLoc } = useMapStore.getState();
        if (storedLoc) fromCoords = storedLoc;
      }
      if (!fromCoords) {
        const fromRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromInput)}`);
        let fromData = await fromRes.json();
        if (!fromData.length && fromInput.includes(',')) {
          const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromInput.split(',')[0])}`);
          fromData = await fallbackRes.json();
        }
        if (!fromData.length) { alert(`Could not find start location: "${fromInput}"`); return; }
        fromCoords = [parseFloat(fromData[0].lon), parseFloat(fromData[0].lat)];
      }

      if (!toCoords) {
        const toRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(toInput)}`);
        let toData = await toRes.json();
        if (!toData.length && toInput.includes(',')) {
          const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(toInput.split(',')[0])}`);
          toData = await fallbackRes.json();
        }
        if (!toData.length) { alert(`Could not find destination: "${toInput}"`); return; }
        toCoords = [parseFloat(toData[0].lon), parseFloat(toData[0].lat)];
      }
      
      let profile = 'driving';
      if (travelMode === 'bike') profile = 'cycling';
      if (travelMode === 'walk') profile = 'foot';
      
      const routeRes = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?overview=full&geometries=geojson&steps=true&alternatives=true`);
      const routeData = await routeRes.json();
      if (routeData.code !== 'Ok') { alert("Could not calculate route."); return; }
      
      const mappedRoutes = routeData.routes.map((route: any, index: number) => {
        const distanceKm = +(route.distance / 1000).toFixed(1);
        let durationMins = Math.round(route.duration / 60);
        if (travelMode === 'walk') durationMins = Math.round((distanceKm / 5) * 60);
        else if (travelMode === 'bike') durationMins = Math.round((distanceKm / 20) * 60);
        else if (travelMode === 'auto') durationMins = Math.round((distanceKm / 25) * 60);
        else if (travelMode === 'car') durationMins = Math.round((distanceKm / 40) * 60);

        return {
          id: `route-${Date.now()}-${index}`,
          name: index === 0 ? 'Primary Route' : `Alternative ${index}`,
          distance: distanceKm,
          duration: durationMins,
          alertCount: Math.floor(Math.random() * 3),
          coordinates: route.geometry.coordinates,
          steps: route.legs[0].steps.map((step: any) => ({
            instruction: step.maneuver.modifier 
              ? `${step.maneuver.type} ${step.maneuver.modifier} onto ${step.name || 'unnamed road'}`
              : `${step.maneuver.type} onto ${step.name || 'unnamed road'}`,
            distance: step.distance,
            duration: step.duration
          }))
        };
      });

      setActiveRoute(mappedRoutes[0]);
      setAlternativeRoutes(mappedRoutes);
      
      if (mappedRoutes[0].coordinates && mappedRoutes[0].coordinates.length > 0) {
        const midPoint = mappedRoutes[0].coordinates[Math.floor(mappedRoutes[0].coordinates.length / 2)];
        setCenter([midPoint[0], midPoint[1]]);
      }
      let calculatedZoom = 11;
      if (mappedRoutes[0].distance < 5) calculatedZoom = 14;
      else if (mappedRoutes[0].distance < 20) calculatedZoom = 12;
      setZoom(calculatedZoom);
    } catch (e) { console.error("Routing error:", e); alert("Error fetching route."); }
  };

  useEffect(() => { if (activeRoute && fromInput && toInput) fetchRoute(); }, [travelMode]);

  return (
    <AppShell fullScreen>
      <div className="flex h-full overflow-hidden">

        {/* Left Side Panel */}
        <div className={`
          flex-shrink-0 border-r border-border bg-card flex flex-col transition-all duration-300
          ${panelOpen ? 'w-[400px]' : 'w-0'} h-full z-30 shadow-2xl relative overflow-hidden
        `}>
          {isNavigating ? (
            <NavigationWindow />
          ) : (
            <div className="flex flex-col h-full overflow-hidden w-[400px]">
              {/* Panel Header */}
              <div className="p-6 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Route Planner</h2>
                  <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="space-y-3 relative">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    <AddressAutocomplete placeholder="Starting from" value={fromInput} onChange={setFromInput} className="pl-8 h-12 bg-secondary/50 border-none rounded-xl" />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
                    <AddressAutocomplete placeholder="Going to" value={toInput} onChange={setToInput} className="pl-8 h-12 bg-secondary/50 border-none rounded-xl" />
                  </div>
                  <button 
                    onClick={() => {const t=fromInput; setFromInput(toInput); setToInput(t);}} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-card p-2 rounded-full border border-border shadow-md hover:scale-110 transition-transform"
                  >
                    <ArrowUpDown className="h-4 w-4 text-primary"/>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {TRAVEL_MODES.map(tm => (
                    <button 
                      key={tm.mode} 
                      onClick={() => setTravelMode(tm.mode)} 
                      className={`flex-1 flex flex-col items-center gap-1.5 rounded-2xl py-3 border-2 transition-all ${travelMode===tm.mode ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-secondary/30 border-transparent text-muted-foreground hover:bg-secondary'}`}
                    >
                      <tm.icon className="h-5 w-5"/>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{tm.label}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={fetchRoute} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-lg shadow-primary/20">
                  <Navigation className="h-5 w-5" /> Calculate Route
                </Button>
              </div>

              {/* Alerts & Routes */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {activeRoute && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Suggested Route</h3>
                    {alternativeRoutes.map(r => (
                      <button 
                        key={r.id} 
                        onClick={() => setActiveRoute(r)} 
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${activeRoute.id===r.id ? 'bg-primary/5 border-primary shadow-sm' : 'border-transparent bg-secondary/30 hover:bg-secondary/50'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-2xl font-black">{r.duration} min</p>
                            <p className="text-sm text-muted-foreground font-medium">{r.distance} km via Main Road</p>
                          </div>
                          <div className={`p-2 rounded-full ${activeRoute.id===r.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                            <Navigation className="h-5 w-5" />
                          </div>
                        </div>
                      </button>
                    ))}
                    <Button onClick={() => setIsNavigating(true)} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black shadow-xl shadow-emerald-500/20 mt-4">
                      START NAVIGATION
                    </Button>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Safety Alerts</h3>
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{filteredAlerts.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_TYPES.map(type => (
                      <button 
                        key={type} 
                        onClick={() => toggleFilter(type)} 
                        className={`text-[10px] px-3 py-1.5 rounded-full border-2 font-bold transition-all ${alertFilters.includes(type) ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border'}`}
                      >
                        {ALERT_CONFIG[type].label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
                    ) : (
                      <div className="text-center py-10 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border">
                        No alerts in this view
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <MapPlaceholder className="h-full w-full" alerts={mapAlerts}>
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {/* Re-center */}
              <button 
                onClick={() => {
                  if (userLocation) {
                    setCenter(userLocation);
                    setZoom(18);
                  }
                }} 
                className="p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-secondary" 
                title="Re-center on my location"
              >
                <Compass className="h-4 w-4"/>
              </button>

              <button onClick={() => setZoom(zoom+1)} className="p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-secondary" title="Zoom In">
                <Plus className="h-4 w-4"/>
              </button>
              <button onClick={() => setZoom(zoom-1)} className="p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-secondary" title="Zoom Out">
                <Minus className="h-4 w-4"/>
              </button>

              <button 
                onClick={() => setMapType(mapType==='street'?'satellite':'street')} 
                className="p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-secondary" 
                title="Change Map Style"
              >
                <Layers className="h-4 w-4"/>
              </button>

              {/* Traffic toggle */}
              <button 
                onClick={() => toggleLayer('traffic')}
                className={`p-2 rounded-lg border border-border shadow-sm transition-colors ${activeLayers.includes('traffic') ? 'bg-primary text-white' : 'bg-card hover:bg-secondary'}`}
                title="Toggle Traffic"
              >
                <Navigation className="h-4 w-4"/>
              </button>

              {/* Fuel toggle */}
              <button 
                onClick={() => toggleFilter('fuel')}
                className={`p-2 rounded-lg border border-border shadow-sm transition-colors ${alertFilters.includes('fuel') ? 'bg-sky-500 text-white' : 'bg-card hover:bg-secondary'}`}
                title="Toggle Fuel Stations"
              >
                <Fuel className="h-4 w-4"/>
              </button>

              {/* Navigate to my spot */}
              <button 
                onClick={async () => {
                  if (userLocation) {
                    const locStr = `${userLocation[1]}, ${userLocation[0]}`;
                    setToInput(locStr);
                    setCenter(userLocation);
                    setZoom(18);
                    setTimeout(() => fetchRoute(), 100);
                  }
                }} 
                className="p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-secondary"
                title="Navigate to My Spot"
              >
                <LocateFixed className="h-4 w-4"/>
              </button>
            </div>

            {/* Panel open button when closed */}
            {!panelOpen && (
              <button 
                onClick={() => setPanelOpen(true)} 
                className="absolute top-4 left-4 p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-secondary"
                title="Open Route Planner"
              >
                <Menu className="h-4 w-4"/>
              </button>
            )}
          </MapPlaceholder>
        </div>
      </div>
    </AppShell>
  );
};
