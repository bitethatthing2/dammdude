'use client';

import { useLocationState } from '@/lib/hooks/useLocationState';
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export const LocationToggle = () => {
  const { location, setLocation } = useLocationState();

  return (
    <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
      <Button
        variant={location === 'salem' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLocation('salem')}
        className="rounded-none px-3"
      >
        <MapPin className="h-4 w-4 mr-1" />
        Salem
      </Button>
      <Button
        variant={location === 'portland' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLocation('portland')}
        className="rounded-none px-3"
      >
        <MapPin className="h-4 w-4 mr-1" />
        Portland
      </Button>
    </div>
  );
};