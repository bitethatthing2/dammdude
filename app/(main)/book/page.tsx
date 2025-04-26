"use client";

import { useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { BookingForm } from '@/components/booking/BookingForm';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamically import the Toaster component to avoid SSR issues
const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), { ssr: false });

// Success component to avoid any window references during SSR
const BookingSuccess = dynamic(() => 
  Promise.resolve(({ onReset }: { onReset: () => void }) => (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Booking Request Sent!</h2>
      <p className="text-muted-foreground mb-6">
        Thank you for your reservation request. We'll contact you shortly to confirm your booking.
      </p>
      <Button onClick={onReset}>Make Another Booking</Button>
    </div>
  )),
  { ssr: false }
);

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
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Calendar className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Book a Table</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        {submitted ? (
          <BookingSuccess onReset={handleReset} />
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">
                {location === 'portland' ? 'Portland Location' : 'Salem Location'}
              </h2>
              <p className="text-muted-foreground">
                {location === 'portland' 
                  ? 'Reserve a table at our Portland location. Perfect for game days and special events.'
                  : 'Book your table at our Salem location. Great for family gatherings and watching sports.'}
              </p>
            </div>
            
            <BookingForm 
              location={location}
              onSuccessAction={handleSuccess}
            />
          </>
        )}
      </div>
      
      <Toaster />
    </div>
  );
}