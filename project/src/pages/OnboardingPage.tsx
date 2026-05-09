import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Bell, Navigation, ArrowRight, Shield } from 'lucide-react';

const STEPS = [
  {
    icon: Map,
    title: 'Smart Map Navigation',
    description: 'Full-screen interactive map of India with real-time traffic and road alerts. Plan your route with hazard awareness.',
    color: 'text-primary',
  },
  {
    icon: Bell,
    title: 'Real-Time Alerts',
    description: 'Get proximity-based warnings for speed cameras, construction, accidents, and more — with voice and haptic alerts.',
    color: 'text-alert-high',
  },
  {
    icon: Shield,
    title: 'Community Powered',
    description: 'Join thousands of drivers reporting road hazards. Earn karma points and help make Indian roads safer for everyone.',
    color: 'text-alert-info',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 rounded-2xl border border-border overflow-hidden" style={{ height: '200px' }}>
                <MapPlaceholder className="h-full w-full" />
              </div>

              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10`}>
                {(() => {
                  const Icon = STEPS[step].icon;
                  return <Icon className={`h-7 w-7 ${STEPS[step].color}`} />;
                })()}
              </div>

              <h2 className="font-display text-2xl font-bold text-foreground">{STEPS[step].title}</h2>
              <p className="mt-3 text-muted-foreground max-w-sm mx-auto">{STEPS[step].description}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex gap-3">
            {step < STEPS.length - 1 ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/map')}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  Skip
                </Button>
                <Button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/map')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                size="lg"
              >
                <Navigation className="h-4 w-4" /> Start Navigating
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
