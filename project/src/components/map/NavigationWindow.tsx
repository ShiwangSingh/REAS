import { useAlertStore, useMapStore } from '@/stores';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, ArrowRight, ArrowUp, Navigation, X, MapPin, 
  Map as MapIcon, ChevronRight, Bell
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { formatDuration } from '@/lib/utils';
import { AlertCard } from '../alerts/AlertCard';

export function NavigationWindow() {
  const { 
    activeRoute, isNavigating, setIsNavigating, 
    currentStepIndex, setCurrentStepIndex 
  } = useMapStore();
  const { alerts, alertFilters } = useAlertStore();
  
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = new SpeechSynthesisUtterance();
    }
  }, []);

  if (!isNavigating || !activeRoute || !activeRoute.steps || activeRoute.steps.length === 0) {
    return (
      <div className="p-8 text-center bg-card h-full flex flex-col items-center justify-center">
        <Navigation className="h-10 w-10 text-primary mb-4 animate-pulse" />
        <p className="text-muted-foreground font-medium">Preparing your route...</p>
        <Button variant="ghost" onClick={() => setIsNavigating(false)} className="mt-4">Cancel</Button>
      </div>
    );
  }

  const currentStep = activeRoute.steps[currentStepIndex];
  const isLastStep = currentStepIndex === activeRoute.steps.length - 1;

  const speakInstruction = (text: string) => {
    if (synthRef.current && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      synthRef.current.text = text;
      // Filter out raw coordinates and make instructions more natural
      let utterance = text.replace(/arrive at destination/i, "You will arrive at your destination");
      synthRef.current.text = utterance;
      window.speechSynthesis.speak(synthRef.current);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < activeRoute.steps!.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      speakInstruction(activeRoute.steps![currentStepIndex + 1].instruction);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      speakInstruction(activeRoute.steps![currentStepIndex - 1].instruction);
    }
  };

  const exitNavigation = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  // Icon mapping based on instruction text
  const getIcon = (instruction: string) => {
    const text = instruction.toLowerCase();
    if (text.includes('left')) return <ArrowLeft className="h-10 w-10 text-white" />;
    if (text.includes('right')) return <ArrowRight className="h-10 w-10 text-white" />;
    if (text.includes('arrive') || text.includes('destination')) return <MapPin className="h-10 w-10 text-white" />;
    return <ArrowUp className="h-10 w-10 text-white" />;
  };

  return (
    <div className="w-full h-full bg-card flex flex-col overflow-hidden">
      {/* Top Bar - Current Instruction */}
      <div className="bg-primary p-6 shadow-lg flex items-center gap-6">
        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          {getIcon(currentStep.instruction)}
        </div>
        <div className="flex-1 text-white">
          <div className="text-3xl font-bold mb-1">
            {currentStep.distance < 1000 
              ? `${Math.round(currentStep.distance)} m` 
              : `${(currentStep.distance / 1000).toFixed(1)} km`}
          </div>
          <div className="text-xl font-medium opacity-90 leading-tight">
            {currentStep.instruction}
          </div>
        </div>
      </div>

      {/* Middle Area - Future Steps Preview */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4 pt-8">
          <h3 className="text-muted-foreground font-medium flex items-center gap-2 mb-4">
            <MapIcon className="h-4 w-4" /> Upcoming Steps
          </h3>
          
          {activeRoute.steps.slice(currentStepIndex + 1, currentStepIndex + 4).map((step, idx) => (
            <div key={idx} className="flex flex-col p-4 bg-secondary rounded-lg border border-border">
              <span className="font-semibold text-foreground mb-1">
                {step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`}
              </span>
              <span className="text-muted-foreground">{step.instruction}</span>
            </div>
          ))}
          
          {activeRoute.steps.length - currentStepIndex > 4 && (
            <div className="text-center text-muted-foreground text-sm py-2">
              + {activeRoute.steps.length - currentStepIndex - 4} more steps
            </div>
          )}
        </div>
      </div>

      {/* Alerts on Route Section */}
      <div className="border-t border-border bg-secondary/20 p-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Bell className="h-3 w-3" /> Alerts on Route
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
          {alerts.filter(a => {
            if (!activeRoute?.coordinates) return false;
            // Only show alerts within 1km of route
            return activeRoute.coordinates.some(([lon, lat]) => 
              Math.abs(a.location.lat - lat) < 0.01 && Math.abs(a.location.lng - lon) < 0.01
            );
          }).map(alert => (
            <AlertCard key={alert.id} alert={alert} compact />
          ))}
          {alerts.filter(a => {
             if (!activeRoute?.coordinates) return false;
             return activeRoute.coordinates.some(([lon, lat]) => 
               Math.abs(a.location.lat - lat) < 0.01 && Math.abs(a.location.lng - lon) < 0.01
             );
          }).length === 0 && (
            <div className="text-[11px] text-muted-foreground italic text-center py-2">
              No hazards detected on this route.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar - Controls */}
      <div className="bg-card border-t border-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={exitNavigation} className="gap-2 shrink-0">
            <X className="h-4 w-4" /> Exit
          </Button>

          <div className="flex flex-col items-center flex-1 mx-4">
            <div className="font-bold text-foreground text-lg">
              {formatDuration(activeRoute.duration)}
            </div>
            <div className="text-muted-foreground text-sm">
              {activeRoute.distance} km total
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="icon" onClick={prevStep} disabled={currentStepIndex === 0}>
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={nextStep} disabled={isLastStep}>
               <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
