import { AppShell } from '@/components/layout/AppShell';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { useStatsStore, useUserStore } from '@/stores';
import { TrendingUp, TrendingDown, AlertTriangle, FileText, CheckCircle, MapPin, Award, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { day: 'Mon', cctv: 45, breaker: 120, construction: 30, accident: 12 },
  { day: 'Tue', cctv: 52, breaker: 98, construction: 35, accident: 8 },
  { day: 'Wed', cctv: 48, breaker: 110, construction: 28, accident: 15 },
  { day: 'Thu', cctv: 61, breaker: 105, construction: 42, accident: 10 },
  { day: 'Fri', cctv: 55, breaker: 130, construction: 38, accident: 18 },
  { day: 'Sat', cctv: 38, breaker: 85, construction: 22, accident: 6 },
  { day: 'Sun', cctv: 42, breaker: 90, construction: 25, accident: 9 },
];

const topLocations = [
  { road: 'NH48 — Manesar Section', type: 'Speed Camera', count: 45, status: 'Active' },
  { road: 'Ring Road — ITO', type: 'Construction', count: 38, status: 'Active' },
  { road: 'MG Road — Gurugram', type: 'Speed Breaker', count: 32, status: 'Verified' },
  { road: 'Outer Ring Road — Noida', type: 'Accident Zone', count: 28, status: 'Active' },
  { road: 'Dwarka Expressway', type: 'Pothole', count: 24, status: 'Reported' },
];

export default function DashboardPage() {
  const { stats } = useStatsStore();
  const { leaderboard, user } = useUserStore();

  const kpis = [
    { label: 'Active Alerts Today', value: (stats?.activeAlerts || 0).toLocaleString(), trend: 12, icon: AlertTriangle, up: true },
    { label: 'Your Karma Points', value: (user?.karmaPoints || 0).toLocaleString(), trend: 8, icon: Award, up: true },
    { label: 'Verified Reports %', value: '87%', trend: 3, icon: CheckCircle, up: true },
    { label: 'Roads Covered', value: '15,430 km', trend: -2, icon: MapPin, up: false },
  ];

  return (
    <AppShell>
      <div className="container py-6 space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <kpi.icon className="h-5 w-5 text-primary" />
                <span className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? 'text-alert-info' : 'text-alert-critical'}`}>
                  {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(kpi.trend)}%
                </span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Alert Activity</h3>
              <div className="flex gap-1">
                {['24h', '7d', '30d'].map((t) => (
                  <button
                    key={t}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${t === '7d' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCctv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBreaker" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(46, 97%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(46, 97%, 40%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAccident" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 19%, 22%)" />
                <XAxis dataKey="day" stroke="hsl(215, 14%, 64%)" fontSize={12} />
                <YAxis stroke="hsl(215, 14%, 64%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(218, 28%, 16%)',
                    border: '1px solid hsl(217, 19%, 22%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 98%)',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="cctv" stroke="hsl(38, 92%, 50%)" fillOpacity={1} fill="url(#colorCctv)" />
                <Area type="monotone" dataKey="breaker" stroke="hsl(46, 97%, 40%)" fillOpacity={1} fill="url(#colorBreaker)" />
                <Area type="monotone" dataKey="accident" stroke="hsl(0, 72%, 51%)" fillOpacity={1} fill="url(#colorAccident)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Top Reporters</h3>
            <div className="space-y-3">
              {leaderboard.slice(0, 7).map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.reportsCount} reports</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-alert-high">
                    <Award className="h-3 w-3" />
                    {entry.karmaScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coverage Map + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-display text-lg font-semibold text-foreground">City Coverage</h3>
            </div>
            <MapPlaceholder className="h-64" />
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-display text-lg font-semibold text-foreground">Top Alert Locations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Road</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Count</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topLocations.map((loc, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3 text-foreground">{loc.road}</td>
                      <td className="p-3 text-muted-foreground">{loc.type}</td>
                      <td className="p-3 font-medium text-foreground">{loc.count}</td>
                      <td className="p-3">
                        <span className={`text-xs font-medium ${loc.status === 'Active' ? 'text-alert-info' : 'text-muted-foreground'}`}>
                          {loc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
