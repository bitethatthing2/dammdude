'use client';

import { MapPin, Clock, Phone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DynamicGoogleMaps, InstagramEmbed } from '@/components/shared/DynamicGoogleMaps';
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
    name: "Side Hustle Salem",
    address: "1849 Lancaster Dr NE",
    city: "Salem",
    state: "OR",
    zip: "97305",
    phone: "(503) 555-0123",
    hours: {
      weekdays: "11:00 AM - 12:00 AM",
      weekends: "10:00 AM - 2:00 AM"
    },
    mapUrl: "https://maps.google.com/?q=44.94049607107024,-123.0413951237716"
  },
  {
    name: "Side Hustle Portland",
    address: "318 NW 11th Ave",
    city: "Portland",
    state: "OR",
    zip: "97209",
    phone: "(503) 555-0456",
    hours: {
      weekdays: "11:00 AM - 12:00 AM",
      weekends: "10:00 AM - 2:00 AM"
    },
    mapUrl: "https://maps.google.com/?q=45.51853717107486,-122.67878942374"
  }
];

export function LocationsSection() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Locations</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visit us at either of our two convenient locations in Salem and Portland. 
            Both venues offer the same great atmosphere, food, and Wolf Pack community.
          </p>
        </div>

        {/* Dynamic Google Maps Section */}
        <div className="mb-12">
          <DynamicGoogleMaps 
            className="max-w-4xl mx-auto" 
            height="450px" 
            showLocationSwitcher={true}
          />
        </div>

        {/* Location Details Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {locations.map((location) => (
            <Card key={location.name} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="text-2xl">{location.name}</CardTitle>
                <CardDescription className="text-purple-100">
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
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{location.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Mon-Fri: {location.hours.weekdays}<br />
                        Sat-Sun: {location.hours.weekends}
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

        {/* Instagram Embed Section */}
        <div className="mb-12">
          <InstagramEmbed className="max-w-2xl mx-auto" />
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Can&apos;t decide which location to visit? Both offer the same great experience!
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open('tel:5035550123')}
          >
            <Phone className="mr-2 h-4 w-4" />
            Call Us for Reservations
          </Button>
        </div>
      </div>
    </section>
  );
}