'use client';

import * as React from 'react';
import { MapPin, Check } from 'lucide-react';
import { WolfpackLocationService } from '@/lib/services/wolfpack-location.service';

// Side Hustle Bar locations from Google Maps
const LOCATIONS = [
  {
    id: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
    key: 'salem' as const,
    name: 'Salem',
    address: '1849 Lancaster Dr NE, Salem, OR 97305',
    lat: 44.94049607107024,
    lng: -123.0413951237716,
    radius: 100
  },
  {
    id: 'ec1e8869-454a-49d2-93e5-ed05f49bb932',
    key: 'portland' as const,
    name: 'Portland',
    address: '318 NW 11th Ave, Portland, OR 97209',
    lat: 45.51853717107486,
    lng: -122.67878942374,
    radius: 100
  }
] as const;

const LOCATION_STORAGE_KEY = 'sidehustle-selected-location';

interface LocationSwitcherProps {
  onLocationChange?: (location: typeof LOCATIONS[0]) => void;
  className?: string;
}

export function LocationSwitcher({ onLocationChange, className = '' }: LocationSwitcherProps) {
  const [selectedLocation, setSelectedLocation] = React.useState<typeof LOCATIONS[0]>(LOCATIONS[0]);
  const [showLocationSelector, setShowLocationSelector] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Initialize from localStorage
  React.useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedLocationKey = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocationKey) {
        const savedLocation = LOCATIONS.find(loc => loc.key === savedLocationKey);
        if (savedLocation) {
          setSelectedLocation(savedLocation);
          onLocationChange?.(savedLocation);
        }
      }
    }
  }, [onLocationChange]);

  // Close selector when clicking outside
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = () => {
      setShowLocationSelector(false);
    };

    if (showLocationSelector) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLocationSelector]);

  // Handle location change
  const handleLocationChange = (location: typeof LOCATIONS[0]) => {
    setSelectedLocation(location);
    setShowLocationSelector(false);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCATION_STORAGE_KEY, location.key);
    }
    
    // Update the location service
    WolfpackLocationService.setSelectedLocation(location.key);
    
    // Notify parent component
    onLocationChange?.(location);
  };

  // Get distance to current location if available
  const [currentDistance, setCurrentDistance] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = WolfpackLocationService.calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          selectedLocation.lat,
          selectedLocation.lng
        );
        setCurrentDistance(distance);
      },
      () => {
        // Ignore geolocation errors
        setCurrentDistance(null);
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  }, [selectedLocation, mounted]);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Location selector button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowLocationSelector(!showLocationSelector);
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
        aria-label="Select location"
      >
        <MapPin size={16} />
        <span className="hidden sm:inline">{selectedLocation.name}</span>
        <span className="sm:hidden">{selectedLocation.key.toUpperCase()}</span>
        {currentDistance !== null && currentDistance <= selectedLocation.radius && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="You're at this location!" />
        )}
      </button>

      {/* Location selector dropdown */}
      {showLocationSelector && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-1 min-w-64 p-2 bg-card border border-border rounded-md shadow-lg z-50"
        >
          <div className="space-y-1">
            {LOCATIONS.map((location) => {
              const isSelected = selectedLocation.key === location.key;
              const distance = currentDistance !== null && selectedLocation.key === location.key ? currentDistance : null;
              const isAtLocation = distance !== null && distance <= location.radius;
              
              return (
                <button
                  key={location.key}
                  onClick={() => handleLocationChange(location)}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors ${
                    isSelected ? "bg-primary/10 border border-primary/20" : ""
                  }`}
                >
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{location.name}</span>
                      {isSelected && <Check size={14} className="text-primary" />}
                      {isAtLocation && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <span>You're here!</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {location.address}
                    </p>
                    {distance !== null && selectedLocation.key === location.key && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {distance.toFixed(0)}m away
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Location is used for wolfpack features and order delivery
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Export locations for use in other components
export { LOCATIONS };
export type Location = typeof LOCATIONS[0];
export type LocationKey = typeof LOCATIONS[0]['key'];