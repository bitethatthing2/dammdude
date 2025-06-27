'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationSwitcher, LOCATIONS, type LocationKey } from './LocationSwitcher';

interface DynamicGoogleMapsProps {
  className?: string;
  showLocationSwitcher?: boolean;
  height?: string;
}

export function DynamicGoogleMaps({ 
  className = '', 
  showLocationSwitcher = true,
  height = '400px'
}: DynamicGoogleMapsProps) {
  const [selectedLocationKey, setSelectedLocationKey] = useState<LocationKey>('salem');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedLocationKey = localStorage.getItem('sidehustle-selected-location') as LocationKey;
      if (savedLocationKey && LOCATIONS.find(loc => loc.key === savedLocationKey)) {
        setSelectedLocationKey(savedLocationKey);
      }
    }
  }, []);

  const selectedLocation = LOCATIONS.find(loc => loc.key === selectedLocationKey) || LOCATIONS[0];

  // Generate Google Maps embed URL
  const generateMapEmbedUrl = (location: typeof selectedLocation) => {
    const query = encodeURIComponent(location.address);
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${query}&zoom=15&maptype=roadmap`;
  };

  // Generate directions URL
  const generateDirectionsUrl = (location: typeof selectedLocation) => {
    const query = encodeURIComponent(location.address);
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  // Handle location change from LocationSwitcher
  const handleLocationChange = (location: typeof selectedLocation) => {
    setSelectedLocationKey(location.key);
  };

  if (!mounted) {
    return (
      <div className={`animate-pulse bg-muted rounded-lg ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedLocation.name} Location
            </CardTitle>
            <CardDescription>
              {selectedLocation.address}
            </CardDescription>
          </div>
          {showLocationSwitcher && (
            <LocationSwitcher 
              onLocationChange={handleLocationChange}
              className="ml-4"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Maps Embed */}
        <div className="relative rounded-lg overflow-hidden border bg-muted">
          <iframe
            width="100%"
            height={height}
            style={{ border: 0 }}
            src={generateMapEmbedUrl(selectedLocation)}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${selectedLocation.name} Location Map`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1"
            onClick={() => window.open(generateDirectionsUrl(selectedLocation), '_blank')}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Get Directions
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => window.open(`tel:${selectedLocation.key === 'salem' ? '5035550123' : '5035550456'}`, '_blank')}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Call Location
          </Button>
        </div>

        {/* Location Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <h4 className="font-medium text-sm mb-1">Address</h4>
            <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Distance</h4>
            <p className="text-sm text-muted-foreground">
              Within {selectedLocation.radius}m radius
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Static Instagram embed component
export function InstagramEmbed({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Follow Us on Instagram
        </CardTitle>
        <CardDescription>
          Stay connected with Side Hustle Bar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg overflow-hidden border bg-muted">
          <iframe
            src="https://www.instagram.com/sidehustlebar/embed"
            width="100%"
            height="400"
            frameBorder="0"
            scrolling="no"
            allowTransparency={true}
            title="Side Hustle Bar Instagram"
            style={{ border: 0 }}
          />
        </div>
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open('https://www.instagram.com/sidehustlebar/', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Our Instagram
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}