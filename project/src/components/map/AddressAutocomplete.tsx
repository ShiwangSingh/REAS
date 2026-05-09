import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';
import { useMapStore } from '@/stores';

interface AddressAutocompleteProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  showCurrentLocation?: boolean;
}

export function AddressAutocomplete({
  placeholder,
  value,
  onChange,
  icon,
  showCurrentLocation = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { userLocation } = useMapStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Avoid fetching if it's a small query or if it matches user location request
      if (!value || value.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (e) {
        console.error('Error fetching suggestions:', e);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleCurrentLocationClick = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Set to "Current Location" so MapPage routing logic catches it correctly
          onChange('Current Location');
          
          // Optionally we could still do reverse geocoding to update the store with the address,
          // but for the input field, "Current Location" is more reliable for routing.
        } catch (error) {
          console.error('Geolocation error:', error);
          onChange('Current Location');
        } finally {
          setLoadingLocation(false);
          setShowSuggestions(false);
        }
      }, (error) => {
        console.error('Geolocation error:', error);
        setLoadingLocation(false);
      });
    } else {
      setLoadingLocation(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-muted-foreground flex items-center justify-center">
        {icon}
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        className="pl-8 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground w-full"
      />
      
      {showSuggestions && (showCurrentLocation || suggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {showCurrentLocation && (
            <button
              onClick={handleCurrentLocationClick}
              disabled={loadingLocation}
              className="w-full flex items-center gap-2 p-3 text-sm hover:bg-secondary text-left text-primary transition-colors border-b border-border/50"
            >
              <Navigation className="h-4 w-4" />
              {loadingLocation ? 'Fetching location...' : 'Use Current Location'}
            </button>
          )}
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(suggestion.display_name);
                setShowSuggestions(false);
              }}
              className="w-full flex items-start gap-2 p-3 text-sm hover:bg-secondary text-left transition-colors border-b border-border/10 last:border-0"
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span className="truncate text-foreground text-xs">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
