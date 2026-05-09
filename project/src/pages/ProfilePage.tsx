import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Mail, Phone, MapPin, Award, FileText, Edit, Shield } from 'lucide-react';
import { useUserStore } from '@/stores';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user } = useUserStore();

  return (
    <AppShell>
      <div className="container py-6 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
              <AvatarFallback className="rounded-2xl text-2xl">{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-foreground">{user?.name || 'Rahul Sharma'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Member since March 2026</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
                {user?.phone && (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {user?.phone}</span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1 border-border text-foreground hover:bg-secondary">
              <Edit className="h-3 w-3" /> Edit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Karma Points', value: (user?.karmaPoints || 0).toLocaleString(), icon: Award, color: 'text-alert-high' },
            { label: 'Reports', value: '234', icon: FileText, color: 'text-primary' },
            { label: 'Verified', value: '198', icon: Shield, color: 'text-alert-info' },
            { label: 'Cities', value: '12', icon: MapPin, color: 'text-alert-medium' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Reports */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {[
              { title: 'Speed Camera — NH48', city: 'Gurugram', time: '2 hours ago', verified: true },
              { title: 'Pothole — MG Road', city: 'Delhi', time: '1 day ago', verified: true },
              { title: 'Construction — Ring Road', city: 'Delhi', time: '3 days ago', verified: false },
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{report.title}</p>
                  <p className="text-xs text-muted-foreground">{report.city} · {report.time}</p>
                </div>
                {report.verified && (
                  <span className="text-xs font-medium text-alert-info flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
