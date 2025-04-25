"use client";

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { useLocationState } from '@/lib/hooks/useLocationState';
import type { Event } from '@/lib/types/event';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { location } = useLocationState();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const eventDate = new Date(event.event_date);
      const today = new Date();
      return eventDate >= today && !event.is_cancelled;
    }
    if (filter === 'featured') return event.featured && !event.is_cancelled;
    return event.category === filter && !event.is_cancelled;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events & Specials</h1>
          <p className="text-muted-foreground">
            Check out our upcoming events and daily specials
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          {/* Add aria-label for accessibility */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background text-foreground"
            aria-label="Filter Events"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="featured">Featured</option>
            <option value="sports">Sports</option>
            <option value="entertainment">Entertainment</option>
            <option value="food">Food & Drink</option>
            <option value="special">Special Events</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <CalendarDays className="h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground max-w-md">
            {filter !== 'all'
              ? `There are no ${filter} events currently scheduled. Try changing your filter.`
              : `There are no events currently scheduled for ${
                  location === 'portland' ? 'Portland' : 'Salem'
                }.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}