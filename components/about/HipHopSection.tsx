'use client';

import { Play, Users, Music, Star } from 'lucide-react';
import { useState } from 'react';

export function HipHopSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const majorHeadliners = [
    { name: 'ILOVEMAKONNEN', date: 'April 27, 2024', note: 'First-ever Salem show' },
    { name: 'Trinidad James', date: 'October 4, 2024' },
    { name: 'Kirko Bangz', date: 'June 22, 2024', note: 'Summer 24 kickoff' },
    { name: 'Casey Veggies', date: 'August 16, 2024', note: 'Oregon tour' },
    { name: 'Adrian Marcel', note: 'R&B showcase' }
  ];

  const residentDJs = [
    { name: 'DJ Inferno', note: 'Rhythm & Flow co-founder' },
    { name: 'Kaniel The One & Finxx Live', note: 'Portland\'s hottest' },
    { name: 'DJ Infamous', note: 'Ludacris\'s tour DJ' },
    { name: 'DJ New Era', note: 'Alabama Crimson Tide official' },
    { name: 'DJ Carlos PDX', note: 'TikTok viral sets' }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Salem&apos;s Premier Hip-Hop Venue
          </h2>
          <p className="text-xl text-white/80 max-w-4xl mx-auto mb-8">
            Since 2023, we&apos;ve brought major touring artists to Oregon&apos;s capital through our Rhythm & Flow partnership. 
            From coast-to-coast headliners to the hottest DJs, Side Hustle Bar has become the Pacific Northwest&apos;s 
            destination for authentic hip-hop and R&B experiences.
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-16">
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl">
            {!isVideoPlaying ? (
              <div 
                className="relative aspect-video bg-black cursor-pointer group"
                onClick={() => setIsVideoPlaying(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-red-600 rounded-full p-6 mb-4 group-hover:bg-red-700 transition-colors">
                      <Play className="h-12 w-12 text-white ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Experience the Energy</h3>
                    <p className="text-white/80">Click to watch our hip-hop showcase</p>
                  </div>
                </div>
              </div>
            ) : (
              <video 
                className="w-full aspect-video" 
                controls 
                autoPlay
                onEnded={() => setIsVideoPlaying(false)}
              >
                <source src="/icons/hip-hop.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>

        {/* Major Headliners */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Star className="h-8 w-8 text-red-500" />
              <h3 className="text-3xl font-bold text-white">Major Headliners</h3>
            </div>
            <div className="space-y-4">
              {majorHeadliners.map((artist, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">{artist.name}</h4>
                      {artist.date && (
                        <p className="text-red-400 font-semibold">{artist.date}</p>
                      )}
                      {artist.note && (
                        <p className="text-white/70 text-sm mt-1">{artist.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resident DJ Lineup */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Music className="h-8 w-8 text-red-500" />
              <h3 className="text-3xl font-bold text-white">Resident DJ Lineup</h3>
            </div>
            <div className="space-y-4">
              {residentDJs.map((dj, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <h4 className="text-xl font-bold text-white mb-1">{dj.name}</h4>
                  <p className="text-white/70 text-sm">{dj.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 mx-auto max-w-3xl">
          <Users className="h-12 w-12 text-white mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Experience Salem&apos;s Hottest Hip-Hop Scene?
          </h3>
          <p className="text-white/90 mb-6">
            Join us for upcoming shows and be part of the Pacific Northwest&apos;s premier hip-hop destination.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/events" 
              className="bg-white text-red-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              View Upcoming Events
            </a>
            <a 
              href="/contact" 
              className="border-2 border-white text-white hover:bg-white hover:text-red-600 font-bold py-3 px-6 rounded-lg transition-all"
            >
              Book Your Event
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}