import { AppShell } from '@/components/layout/AppShell';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { ArrowUp, X, Navigation, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NavigatePage() {
  return (
    <AppShell fullScreen>
      <div className="relative h-[calc(100vh-3.5rem)]">
        <MapPlaceholder className="h-full w-full">
          {/* Top HUD - Next Turn */}
          <div className="absolute top-4 left-4 right-4">
            <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <ArrowUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-display font-bold text-foreground">Continue on NH48</p>
                <p className="text-sm text-muted-foreground">for 2.4 km</p>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Alert Countdown Strip */}
          <div className="absolute left-4 right-4 bottom-28">
            <div className="rounded-xl border border-alert-high/50 bg-alert-high/10 backdrop-blur-sm p-3 flex items-center gap-3 animate-slide-in-right">
              <div className="h-2 w-2 rounded-full bg-alert-high animate-alert-pulse" />
              <span className="text-sm font-semibold text-alert-high">Speed Camera</span>
              <span className="ml-auto text-lg font-display font-bold text-alert-high">500m</span>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="font-display text-lg font-bold text-foreground">12:45 PM</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-display text-lg font-bold text-foreground">18.2 km</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <div className="flex items-center gap-1">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <p className="font-display text-lg font-bold text-foreground">62</p>
                    <span className="text-xs text-muted-foreground">km/h</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Limit</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-alert-critical">
                    <span className="text-xs font-bold text-foreground">80</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MapPlaceholder>
      </div>
    </AppShell>
  );
}
