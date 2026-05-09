import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AlertCard } from '@/components/alerts/AlertCard';
import { useAlertStore } from '@/stores';
import { AlertBadge } from '@/components/alerts/AlertBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Wifi } from 'lucide-react';
import { Alert as AlertType } from '@/types';

export default function LiveAlertsPage() {
  const { alerts } = useAlertStore();

  return (
    <AppShell>
      <div className="container py-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Radio className="h-5 w-5 text-alert-critical" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-alert-critical animate-alert-pulse" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Live Alert Feed</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Wifi className="h-3 w-3" /> Real-time updates via WebSocket
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {alerts.slice(0, 20).map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <AlertCard alert={alert} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
