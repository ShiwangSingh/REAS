import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { AlertCard } from '@/components/alerts/AlertCard';
import { useAlertStore } from '@/stores';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertBadge } from '@/components/alerts/AlertBadge';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { AlertType } from '@/types';
import { ALERT_CONFIG } from '@/data/mockData';

const FILTER_TYPES: AlertType[] = ['cctv', 'speed_breaker', 'construction', 'accident', 'waterlogging', 'fog', 'toll', 'pothole'];

export default function AlertsPage() {
  const { alerts, alertFilters, toggleFilter } = useAlertStore();
  const [cityFilter, setCityFilter] = useState('');

  const filtered = alerts.filter((a) => {
    if (alertFilters.length > 0 && !alertFilters.includes(a.type)) return false;
    if (cityFilter && !a.location.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)]">
        {/* Map - Left half */}
        <div className="h-64 lg:h-full lg:flex-1 border-b lg:border-b-0 lg:border-r border-border">
          <MapPlaceholder className="h-full w-full">
            <div className="absolute bottom-4 left-4 flex gap-1.5">
              <AlertBadge severity="critical">Critical</AlertBadge>
              <AlertBadge severity="high">High</AlertBadge>
              <AlertBadge severity="medium">Medium</AlertBadge>
              <AlertBadge severity="info">Info</AlertBadge>
            </div>
          </MapPlaceholder>
        </div>

        {/* Alert List - Right half */}
        <div className="flex-1 lg:w-1/2 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by city..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button variant="outline" size="icon" className="border-border text-foreground hover:bg-secondary">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TYPES.map((type) => {
                const config = ALERT_CONFIG[type];
                const active = alertFilters.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-secondary text-muted-foreground border border-transparent hover:bg-secondary/80'
                    }`}
                  >
                    {config.label.split('/')[0].trim().split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-xs text-muted-foreground px-1">{filtered.length} alerts found</p>
            {filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>

          {/* Report button */}
          <div className="p-4 border-t border-border">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <a href="/report"><Plus className="h-4 w-4" /> Report New Alert</a>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
