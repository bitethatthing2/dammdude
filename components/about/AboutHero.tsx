// AboutHero.tsx
'use client';

import { MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function AboutHero() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white">
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative container mx-auto px-4 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to Side Hustle
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-purple-100">
            Salem & Portland&apos;s Premier High-Energy Sports Bar & Mexican Restaurant
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <MapPin className="h-5 w-5" />
              <span>2 Locations</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="h-5 w-5" />
              <span>Open Most Days</span> {/* Adjusted based on Salem's Thursday closure */}
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Phone className="h-5 w-5" />
              <span>503-585-7827</span> {/* Confirmed from image */}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={(e) => {
                e.preventDefault();
                router.push('/menu');
              }}
              className="bg-white text-purple-900 hover:bg-purple-100 active:bg-purple-200 touch-manipulation"
            >
              View Menu
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                router.push('/wolfpack');
              }}
              className="border-white text-white bg-transparent hover:bg-white hover:text-purple-900 active:bg-white/80 active:text-purple-900 touch-manipulation font-semibold"
            >
              Join the Wolfpack
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
