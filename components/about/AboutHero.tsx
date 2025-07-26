// AboutHero.tsx
'use client';

import { MapPin, Clock, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function AboutHero() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-black text-white -mt-16">
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative container mx-auto px-4 py-32 sm:py-40 pt-40">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/icons/sidehustle.png"
              alt="Side Hustle Bar"
              width={300}
              height={100}
              className="max-w-[250px] sm:max-w-[300px] lg:max-w-[350px] h-auto"
            />
          </div>
          <p className="text-xl sm:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Where high-energy entertainment meets authentic Mexican cuisine in the heart of Oregon. Unlock your potential and live your best life with the Wolf Pack.
          </p>
          
          <div className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
            <p>From family-friendly dining by day to vibrant nightlife after dark, we&apos;re your community hub for sports, great food, and unforgettable experiences.</p>
          </div>
          
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
              className="bg-red-600 hover:bg-red-700 text-white touch-manipulation"
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
              className="border-white text-white bg-transparent hover:bg-white hover:text-black active:bg-white/80 active:text-black touch-manipulation font-semibold"
            >
              Join the Wolfpack
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
