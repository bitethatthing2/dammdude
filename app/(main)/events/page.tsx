"use client";

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { useLocationState } from '@/lib/hooks/useLocationState';
import type { Event } from '@/lib/types/event';
import dynamic from 'next/dynamic';

// Mock data for events - replace with actual data fetching
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Live Music Night',
    description: 'Join us for a night of live music featuring local bands.',
    date: new Date('2025-05-01T19:00:00'),
    location: 'portland',
    category: 'music',
    image: '/images/events/music-event.jpg'
  },
  {
    id: '2',
    title: 'Sports Trivia',
    description: 'Test your sports knowledge and win prizes!',
    date: new Date('2025-05-05T18:00:00'),
    location: 'salem',
    category: 'trivia',
    image: '/images/events/trivia-event.jpg'
  },
  {
    id: '3',
    title: 'Game Day: Blazers vs Lakers',
    description: 'Watch the big game on our giant screens with drink specials all night.',
    date: new Date('2025-05-10T17:30:00'),
    location: 'portland',
    category: 'sports',
    image: '/images/events/game-day.jpg'
  }
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { location } = useLocationState();

  useEffect(() => {
    // Replace with actual data fetching when API is ready
    setIsLoading(false);
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return new Date(event.date) > new Date();
    }
    if (filter === 'location') {
      return event.location === location;
    }
    return event.category === filter;
  });

  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <CalendarDays className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Events</h1>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'upcoming' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('location')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'location' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {location === 'portland' ? 'Portland' : 'Salem'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-secondary animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No events found</h3>
          <p className="text-muted-foreground">
            Try changing your filter or check back later for new events.
          </p>
        </div>
      )}
    </div>
  );
}