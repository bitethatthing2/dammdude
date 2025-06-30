'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { WolfpackLocationService, SIDE_HUSTLE_LOCATIONS, LocationKey } from '@/lib/services/wolfpack-location.service';
import { toast } from 'sonner';

interface LocationToggleProps {
  className?: string;
}

export function LocationToggle({ className = '' }: LocationToggleProps) {
  const { user } = useUser();
  const [selectedLocation, setSelectedLocation] = useState<LocationKey>('salem');
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize location from user data or localStorage
  useEffect(() => {
    if (user?.location_id) {
      // Find the location key from the user's location_id
      const locationKey = WolfpackLocationService.getLocationKeyById(user.location_id);
      if (locationKey) {
        setSelectedLocation(locationKey);
        WolfpackLocationService.setSelectedLocation(locationKey);
      }
    } else {
      // Fall back to stored location
      const storedLocation = WolfpackLocationService.getSelectedLocation();
      setSelectedLocation(storedLocation);
    }
  }, [user]);

  // Update user's location in the database
  const updateUserLocation = async (locationId: string) => {
    if (!user?.id) {
      console.warn('No user ID available for location update');
      return false;
    }

    setIsUpdating(true);
    try {
      // Direct update to the users table
      const { error } = await supabase
        .from('users')
        .update({ 
          location_id: locationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating location:', error);
        toast.error('Failed to update location');
        return false;
      }

      // Optionally, trigger a user data refresh here if your useUser hook supports it
      toast.success('Location updated');
      return true;
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle location toggle
  const toggleLocation = async () => {
    // Get the next location
    const locations = Object.keys(SIDE_HUSTLE_LOCATIONS) as LocationKey[];
    const currentIndex = locations.indexOf(selectedLocation);
    const nextIndex = (currentIndex + 1) % locations.length;
    const nextLocation = locations[nextIndex];
    const nextLocationData = SIDE_HUSTLE_LOCATIONS[nextLocation];

    // Update local state immediately for responsiveness
    setSelectedLocation(nextLocation);
    WolfpackLocationService.setSelectedLocation(nextLocation);

    // Update in database if user is logged in
    if (user) {
      await updateUserLocation(nextLocationData.id);
    }
  };

  // Get the current location data
  const currentLocationData = SIDE_HUSTLE_LOCATIONS[selectedLocation];

  return (
    <button
      onClick={toggleLocation}
      disabled={isUpdating}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
        isUpdating 
          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
          : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
      } ${className}`}
      aria-label="Toggle location"
    >
      <span className="text-xs opacity-70">📍</span>
      <span>{currentLocationData.name}</span>
      {isUpdating && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </button>
  );
}

// Export a hook to get the current location for other components
export function useSelectedLocation() {
  const [location, setLocation] = useState<LocationKey>('salem');

  useEffect(() => {
    const stored = WolfpackLocationService.getSelectedLocation();
    setLocation(stored);

    // Listen for storage changes (if location is changed in another tab)
    const handleStorageChange = () => {
      const newLocation = WolfpackLocationService.getSelectedLocation();
      setLocation(newLocation);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const locationData = SIDE_HUSTLE_LOCATIONS[location];
  
  return {
    locationKey: location,
    locationId: locationData.id,
    locationName: locationData.name,
    locationData
  };
}