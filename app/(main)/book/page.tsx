"use client";

import { useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { BookingForm } from '@/components/booking/BookingForm';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

export default function BookingPage() {
  const { location } = useLocationState();
  const [submitted, setSubmitted] = useState(false);

  const handleSuccess = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  return (
    <div className="pb-20">
      {/* Header with Location */}
      <div className="flex justify-between items-center p-4 bg-background sticky top-0 z-50 border-b">
        <h1 className="text-2xl font-bold">Book a Reservation</h1>
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      
      <div className="max-w-3xl mx-auto px-4 py-6">
        {submitted ? (
          <div className="text-center py-10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Booking Request Received!</h2>
              <p className="text-muted-foreground">
                Thank you for your reservation request at our {location === 'portland' ? 'Portland' : 'Salem'} location.
                Our team will review your request and contact you shortly to confirm.
              </p>
            </div>
            
            <div className="pt-4">
              <Button onClick={handleReset} variant="outline">
                Make Another Reservation
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                Please fill out the form below to request a reservation at our {location === 'portland' ? 'Portland' : 'Salem'} location.
                We'll review your request and get back to you as soon as possible.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <BookingForm onSuccess={handleSuccess} />
            </div>
            
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium text-lg mb-2">Hours of Operation</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Monday - Thursday: 11:00 AM - 11:00 PM</p>
                  <p>Friday - Saturday: 11:00 AM - 1:00 AM</p>
                  <p>Sunday: 11:00 AM - 10:00 PM</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium text-lg mb-2">Reservation Policies</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Reservations are held for 15 minutes past the scheduled time</li>
                  <li>For parties of 8+, please call directly</li>
                  <li>Special event bookings require at least 48 hours notice</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
      
      <Toaster />
    </div>
  );
}