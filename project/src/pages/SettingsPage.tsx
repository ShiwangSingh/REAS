import { AppShell } from '@/components/layout/AppShell';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, Navigation, Map as MapIcon, Globe, Eye, Volume2 } from 'lucide-react';

function SettingSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, defaultChecked = true }: { label: string; description?: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="container py-6 max-w-2xl space-y-4">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Settings</h1>

        <SettingSection icon={Bell} title="Alert Preferences">
          <ToggleRow label="CCTV / Speed Camera" description="Warn about surveillance zones" />
          <ToggleRow label="Speed Breakers" description="Countdown warnings for speed humps" />
          <ToggleRow label="Construction Zones" description="Active road construction alerts" />
          <ToggleRow label="Accidents" description="Real-time accident reports" />
          <ToggleRow label="Weather Alerts" description="Fog, rain, visibility warnings" />
          <ToggleRow label="Toll Plazas" description="Toll information ahead" />
          <ToggleRow label="Fuel Stations" description="Nearby fuel stations on route" defaultChecked={false} />
          <div className="pt-2">
            <label className="text-sm font-medium text-foreground mb-2 block">Warning Distance: 500m</label>
            <Slider defaultValue={[500]} min={100} max={2000} step={100} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>100m</span><span>2000m</span>
            </div>
          </div>
          <ToggleRow label="Voice Alerts" description="Audio announcements for alerts" />
          <ToggleRow label="Vibration" description="Haptic feedback on alert proximity" />
        </SettingSection>

        <SettingSection icon={Navigation} title="Navigation Preferences">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Default Travel Mode</label>
            <select className="w-full rounded-lg border border-border bg-secondary text-foreground p-2.5 text-sm">
              <option>Car</option><option>Bike</option><option>Auto</option><option>Walk</option>
            </select>
          </div>
          <ToggleRow label="Avoid Toll Roads" defaultChecked={false} />
          <ToggleRow label="Avoid Highways" defaultChecked={false} />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Route Preference</label>
            <select className="w-full rounded-lg border border-border bg-secondary text-foreground p-2.5 text-sm">
              <option>Fastest</option><option>Shortest</option><option>Least Alerts</option>
            </select>
          </div>
        </SettingSection>

        <SettingSection icon={MapIcon} title="Map Preferences">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Map Style</label>
            <div className="grid grid-cols-4 gap-2">
              {['Dark', 'Light', 'Satellite', 'Terrain'].map((style) => (
                <button
                  key={style}
                  className={`rounded-lg border p-3 text-xs font-medium transition-all ${
                    style === 'Dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          <ToggleRow label="Kilometers" description="Toggle between km and miles" />
        </SettingSection>

        <SettingSection icon={Globe} title="Language & Accessibility">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">App Language</label>
            <select className="w-full rounded-lg border border-border bg-secondary text-foreground p-2.5 text-sm">
              <option>English</option><option>हिन्दी</option><option>தமிழ்</option><option>తెలుగు</option>
              <option>ಕನ್ನಡ</option><option>മലയാളം</option><option>বাংলা</option><option>मराठी</option>
            </select>
          </div>
          <ToggleRow label="High Contrast Mode" defaultChecked={false} />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Text Size</label>
            <Slider defaultValue={[1]} min={0} max={2} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Small</span><span>Medium</span><span>Large</span>
            </div>
          </div>
        </SettingSection>
      </div>
    </AppShell>
  );
}
