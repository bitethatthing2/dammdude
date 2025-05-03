"use client";

import { Suspense } from 'react';
import { Calendar } from 'lucide-react';

export default function EventsPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Calendar className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
      </div>
      
      <Suspense fallback={<EventsPageSkeleton />}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Our events calendar is currently being updated. Check back soon for upcoming games, 
            live music, and special events at both our Salem and Portland locations.
          </p>
        </div>
      </Suspense>
    </div>
  );
}

function EventsPageSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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