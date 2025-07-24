'use client';

import { MapPin, Clock, Phone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DynamicGoogleMaps } from '@/components/shared/DynamicGoogleMaps';
import { InstagramEmbed } from '@/components/shared/InstagramEmbed';
import { LOCATIONS } from '@/components/shared/LocationSwitcher';

interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  hours: {
    weekdays: string;
    weekends: string;
  };
  mapUrl: string;
}

const locations: Location[] = [
  {
    name: "Side Hustle Salem - The Original",
    address: "145 Liberty St NE Suite #101",
    city: "Salem",
    state: "OR",
    zip: "97301",
    phone: "503-585-7827",
    hours: {
      weekdays: "Mon-Wed: 10:00 AM - 11:00 PM, Thu: 10:00 AM - 12:00 AM",
      weekends: "Fri-Sat: 10:00 AM - 2:00 AM, Sun: 10:00 AM - 11:00 PM"
    },
    mapUrl: "https://maps.google.com/?q=44.9429,-123.0351"
  },
  {
    name: "Side Hustle Portland - Now Open",
    address: "327 SW Morrison Street",
    city: "Portland",
    state: "OR",
    zip: "97204",
    phone: "Contact for current hours",
    hours: {
      weekdays: "Mon-Wed & Sun: 10:00 AM - 1:00 AM, Thu: 10:00 AM - 1:00 AM",
      weekends: "Fri-Sat: 10:00 AM - 3:00 AM"
    },
    mapUrl: "https://maps.google.com/?q=45.5152,-122.6784"
  }
];

export function LocationsSection() {
  return (
    <section className="py-16 bg-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Two Locations, One Wolf Pack</h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            From our flagship Salem location in the heart of downtown to our expanding Portland presence, each Side Hustle venue brings the same legendary birria tacos, electric UFC atmosphere, and community spirit that defines the Wolf Pack experience.
          </p>
        </div>

        {/* Location Details Cards - removed maps and instagram, will move to front page */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {locations.map((location) => (
            <Card key={location.name} className="overflow-hidden">
              <CardHeader className="bg-red-600 text-white">
                <CardTitle className="text-2xl">{location.name}</CardTitle>
                <CardDescription className="text-red-100">
                  {location.city}, {location.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {location.address}<br />
                        {location.city}, {location.state} {location.zip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Hours</p>
                      <p className="text-sm text-muted-foreground">
                        {location.city === "Salem" ? (
                          <>
                            Mon-Wed: 10:00 AM - 11:00 PM<br />
                            Thu: 10:00 AM - 12:00 AM<br />
                            Fri-Sat: 10:00 AM - 2:00 AM<br />
                            Sun: 10:00 AM - 11:00 PM
                          </>
                        ) : (
                          <>
                            Mon-Wed & Sun: 10:00 AM - 1:00 AM<br />
                            Thu: 10:00 AM - 1:00 AM<br />
                            Fri-Sat: 10:00 AM - 3:00 AM
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => window.open(location.mapUrl, '_blank')}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Get Directions
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}