'use client';

import { Suspense } from 'react';
import { Calendar } from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';

// Mock data - replace with your actual data fetching
const mockEvents = [
  {
    id: '1',
    title: 'Freestyle Friday',
    description: 'Weekly rap battle competition',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    location: 'portland' as const,
    category: 'entertainment',
    image: '/images/events/freestyle-friday.jpg',
    featured: true
  },
  {
    id: '2',
    title: 'Ladies Night',
    description: 'Special drinks and DJ spotlight',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: 'salem' as const,
    category: 'nightlife',
    image: '/images/events/ladies-night.jpg',
    featured: false
  }
];

export default function EventsPage() {
  return (
    <div className="main-content">
      <div className="container py-6 sm:py-8">
        <div className="flex items-center mb-6 sm:mb-8">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Upcoming Events</h1>
        </div>
        
        <Suspense fallback={<EventsPageSkeleton />}>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {mockEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </Suspense>
      </div>
    </div>
  );
}

function EventsPageSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 h-64 animate-pulse">
          <div className="h-32 rounded-md bg-muted mb-4" />
          <div className="h-4 w-3/4 bg-muted rounded mb-2" />
          <div className="h-4 w-1/2 bg-muted rounded mb-4" />
          <div className="h-8 w-1/3 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}