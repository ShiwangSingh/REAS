import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { AlertBadge } from '@/components/alerts/AlertBadge';
import { ALERT_CONFIG } from '@/data/mockData';
import { useStatsStore, useUserStore } from '@/stores';
import { AlertType } from '@/types';
import {
  Camera, AlertTriangle, Construction, CarFront, Cloud, Users,
  ArrowRight, Navigation, Shield, Bell, MapPin, ChevronRight,
  Fuel, Droplets, Eye, Map as MapIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ALERT_ICONS: Record<string, React.ElementType> = {
  Camera, AlertTriangle, Construction, CarFront, Circle: Eye, Droplets, Cloud, Landmark: MapPin, Fuel, Shield, Info: Bell,
};

function CountUpNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.span
      ref={ref}
      className="font-display text-3xl md:text-4xl font-bold text-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {isInView ? value.toLocaleString() : '0'}{suffix}
    </motion.span>
  );
}

function FloatingAlertCard({ title, delay }: { title: string; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-lg border border-border bg-card/90 backdrop-blur-sm px-3 py-2 shadow-lg"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
    >
      <div className="h-2 w-2 rounded-full bg-alert-high animate-alert-pulse" />
      <span className="text-sm font-medium text-foreground">{title}</span>
    </motion.div>
  );
}

export default function LandingPage() {
  const { stats } = useStatsStore();
  const { user } = useUserStore();

  const features = [
    { type: 'cctv' as AlertType, icon: Camera, title: 'CCTV & Speed Camera Alerts', desc: 'Get warned before you pass surveillance zones and speed cameras on your route.' },
    { type: 'speed_breaker' as AlertType, icon: AlertTriangle, title: 'Speed Breaker Alerts', desc: 'Countdown warnings at 500m, 200m, and 50m from unmarked speed breakers.' },
    { type: 'construction' as AlertType, icon: Construction, title: 'Construction Alerts', desc: 'Know about active road construction and lane closures with detour suggestions.' },
    { type: 'accident' as AlertType, icon: CarFront, title: 'Accident Alerts', desc: 'Real-time accident reports with automatic rerouting to save your time.' },
    { type: 'fog' as AlertType, icon: Cloud, title: 'Weather Alerts', desc: 'Fog, rain, and visibility warnings sourced from IMD weather data.' },
    { type: 'other' as AlertType, icon: Users, title: 'Community Reports', desc: 'Crowdsourced road reports verified by the community for accuracy.' },
  ];

  const steps = [
    { num: '01', title: 'Enter Destination', desc: 'Search any location in India — city, PIN code, or landmark.', icon: MapPin },
    { num: '02', title: 'Get Route Alerts', desc: 'See all hazards, cameras, and construction on your route before you drive.', icon: Bell },
    { num: '03', title: 'Navigate Safely', desc: 'Turn-by-turn navigation with real-time proximity alerts and voice warnings.', icon: Navigation },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <MapPlaceholder className="h-full w-full opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        </div>

        <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-12 py-20">
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex flex-col gap-2 mb-6">
                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 text-primary font-medium"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-lg">Hello, {user.name}</span>
                  </motion.div>
                )}
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Shield className="h-3 w-3" />
                  India's Road Safety Platform
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                India's Smartest{' '}
                <span className="text-primary">Road Alert</span>{' '}
                System
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                Navigate safer with real-time CCTV, speed breaker, construction & hazard alerts. Powered by community and AI.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/map">
                    Open Map <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="gap-2 border-border text-foreground hover:bg-secondary" asChild>
                  <a href="#how-it-works">
                    See How It Works <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:flex flex-col gap-3 flex-shrink-0">
            <FloatingAlertCard title="Speed Camera 300m ahead" delay={0.8} />
            <FloatingAlertCard title="Construction Ahead 1.2km" delay={1.1} />
            <FloatingAlertCard title="Pothole Cluster — Slow Down" delay={1.4} />
            <FloatingAlertCard title="Toll Plaza — ₹90 charge" delay={1.7} />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <CountUpNumber value={stats?.activeAlerts || 0} suffix="+" />
              <p className="text-sm text-muted-foreground">Active Alerts Today</p>
            </div>
            <div className="space-y-1">
              <CountUpNumber value={stats?.roadsCovered || 0} suffix=" km" />
              <p className="text-sm text-muted-foreground">Roads Covered</p>
            </div>
            <div className="space-y-1">
              <CountUpNumber value={stats?.verifiedPercent || 0} suffix="%" />
              <p className="text-sm text-muted-foreground">Verified Reports %</p>
            </div>
            <div className="space-y-1">
              <CountUpNumber value={stats?.reportsSubmitted || 0} suffix="+" />
              <p className="text-sm text-muted-foreground">Reports Submitted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Every Alert You Need
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              From speed cameras to waterlogging — get warned before you encounter any road hazard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const config = ALERT_CONFIG[f.type];
              return (
                <motion.div
                  key={f.type}
                  className={`relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${config.color}`} />
                  <div className="flex items-start gap-4 pl-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${config.color}/10`}>
                      <f.icon className={`h-5 w-5 text-${config.color}`} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Demo Map */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground">See It In Action</h2>
            <p className="mt-2 text-muted-foreground">Live alert map preview — Delhi NCR region</p>
          </div>
          <div className="relative rounded-2xl border border-border overflow-hidden" style={{ height: '500px' }}>
            <MapPlaceholder className="h-full w-full">
              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <AlertBadge severity="critical">Accident</AlertBadge>
                <AlertBadge severity="high">Camera</AlertBadge>
                <AlertBadge severity="medium">Speed Breaker</AlertBadge>
                <AlertBadge severity="info">Toll</AlertBadge>
              </div>
              {/* CTA overlay */}
              <div className="absolute bottom-4 right-4 rounded-lg border border-border bg-card/95 backdrop-blur-sm p-4">
                <p className="text-sm font-medium text-foreground mb-2">Try the full app</p>
                <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/map">Open Map <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </MapPlaceholder>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to a safer drive</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="text-xs font-mono font-semibold text-primary">{step.num}</span>
                <h3 className="mt-1 font-display text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Alert Type Showcase */}
      <section className="py-16 border-t border-border bg-card">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Alert Types</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {(Object.entries(ALERT_CONFIG) as [AlertType, typeof ALERT_CONFIG[AlertType]][]).map(([type, config]) => {
              const Icon = ALERT_ICONS[config.icon] || Bell;
              return (
                <div key={type} className={`flex-shrink-0 w-48 rounded-xl border border-border bg-background p-4`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${config.color}/10 mb-3`}>
                    <Icon className={`h-5 w-5 text-${config.color}`} />
                  </div>
                  <h4 className="font-display text-sm font-semibold text-foreground">{config.label}</h4>
                  <AlertBadge severity={config.severity} className="mt-2" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <MapIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">REAS</span>
              <span className="text-sm text-muted-foreground ml-2">Road Extraction & Alert System</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">API</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 REAS — India's Road Safety Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
