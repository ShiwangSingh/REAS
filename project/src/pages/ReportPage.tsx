import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Camera, AlertTriangle, Construction, CarFront, Circle, Droplets, Cloud,
  MapPin, Mic, Upload, CheckCircle, ArrowLeft
} from 'lucide-react';
import { AlertType } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAlertStore } from '@/stores';

const ALERT_TYPES: { type: AlertType; icon: React.ElementType; label: string }[] = [
  { type: 'speed_breaker', icon: AlertTriangle, label: 'Speed Breaker' },
  { type: 'cctv', icon: Camera, label: 'CCTV' },
  { type: 'construction', icon: Construction, label: 'Construction' },
  { type: 'accident', icon: CarFront, label: 'Accident' },
  { type: 'pothole', icon: Circle, label: 'Pothole' },
  { type: 'waterlogging', icon: Droplets, label: 'Waterlogging' },
  { type: 'fog', icon: Cloud, label: 'Fog' },
  { type: 'other', icon: MapPin, label: 'Other' },
];

const SEVERITY_LABELS = ['Low', 'Medium', 'High', 'Critical'];

export default function ReportPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<AlertType | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState([1]);
  const [submitting, setSubmitting] = useState(false);

  const { addAlert } = useAlertStore();

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSubmitting(true);
    
    try {
      const response = await api.post('/alerts', {
        type: selectedType,
        severity: SEVERITY_LABELS[severity[0]].toLowerCase(),
        title: `${ALERT_TYPES.find(a => a.type === selectedType)?.label} — Reported via App`,
        description: description,
        // Mocking coordinates near Delhi for now
        location: { lat: 28.6139 + (Math.random() * 0.1 - 0.05), lng: 77.2090 + (Math.random() * 0.1 - 0.05), road: 'User Reported', city: 'Delhi' }
      });
      
      // Store will be updated either via the response here or via socket 'new_alert'
      // Option 1: rely on Socket.IO
      setSubmitting(false);
      toast.success('Report submitted! +10 karma points earned.', { duration: 4000 });
      navigate('/map');
    } catch (error) {
      setSubmitting(false);
      toast.error('Failed to submit report. Please try again.');
      console.error(error);
    }
  };

  return (
    <AppShell>
      <div className="container py-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild className="text-foreground hover:bg-secondary">
            <Link to="/map"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Report Road Issue</h1>
            <p className="text-sm text-muted-foreground">Help others drive safer</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Alert Type Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Alert Type</label>
            <div className="grid grid-cols-4 gap-2">
              {ALERT_TYPES.map((at) => (
                <button
                  key={at.type}
                  onClick={() => setSelectedType(at.type)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    selectedType === at.type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <at.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{at.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
            <div className="rounded-xl border border-border overflow-hidden" style={{ height: '150px' }}>
              <MapPlaceholder className="h-full w-full">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <MapPin className="h-6 w-6 text-primary" />
                    <span className="text-xs text-muted-foreground bg-card/90 px-2 py-0.5 rounded">Drag to adjust</span>
                  </div>
                </div>
              </MapPlaceholder>
            </div>
            <Input
              placeholder="Auto-detected: NH48, Gurugram"
              className="mt-2 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
            <div className="relative">
              <Textarea
                placeholder="Describe the road issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10 min-h-[80px]"
              />
              <button className="absolute right-3 bottom-3 text-muted-foreground hover:text-foreground">
                <Mic className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description.length}/200</p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Photos (optional)</label>
            <button className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-secondary p-6 w-full text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
              <Upload className="h-5 w-5" />
              <span className="text-sm">Upload up to 3 photos</span>
            </button>
          </div>

          {/* Severity */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Severity: <span className="text-primary">{SEVERITY_LABELS[severity[0]]}</span>
            </label>
            <Slider
              value={severity}
              onValueChange={setSeverity}
              min={0}
              max={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              {SEVERITY_LABELS.map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedType || submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            size="lg"
          >
            {submitting ? (
              <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
