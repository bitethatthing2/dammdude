'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, Instagram, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 text-white border-t border-red-600/20 mt-0 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black opacity-60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-transparent to-transparent"></div>
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center space-x-3">
              <Image 
                src="/icons/wolf-and-title.png"
                alt="Side Hustle Bar"
                width={180}
                height={72}
                className="h-14 w-auto brightness-110"
              />
            </div>
            <p className="text-base text-gray-300 leading-relaxed text-center">
              Oregon's premier UFC House • Legendary Birria • Live Music
            </p>
            <div className="flex justify-center space-x-3">
              <a 
                href="https://instagram.com/sidehustle_bar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-400 transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="mailto:info@sidehustlelounge.com" 
                aria-label="Email us"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Salem Location */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Salem Location</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-red-600 to-red-400 rounded-full mx-auto"></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <address className="not-italic text-gray-300 text-sm">
                  145 Liberty St NE #101, Salem
                </address>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-red-500" />
                <a href="tel:+15033919977" className="text-gray-300 hover:text-red-400 text-sm">
                  (503) 391-9977
                </a>
              </div>
              <div className="space-y-1 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Hours:</span>
                </div>
                <div className="pl-6 space-y-1">
                  <div>Mon-Wed: 10AM-11PM</div>
                  <div>Thu: 10AM-12AM</div>
                  <div className="text-red-400 font-medium">Fri-Sat: 10AM-2AM</div>
                  <div>Sun: 10AM-11PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Portland Location */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Portland Location</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mx-auto"></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <address className="not-italic text-gray-300 text-sm">
                  327 SW Morrison St, Portland
                </address>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span className="text-gray-300 text-sm">Coming Soon</span>
              </div>
              <div className="space-y-1 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Hours:</span>
                </div>
                <div className="pl-6 space-y-1">
                  <div>Mon-Wed & Sun: 10AM-1AM</div>
                  <div>Thu: 10AM-1AM</div>
                  <div className="text-blue-400 font-medium">Fri-Sat: 10AM-3AM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Links */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">The Experience</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-green-600 to-green-400 rounded-full mx-auto"></div>
            </div>
            
            {/* Quick Order Online */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <a 
                href="https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-red-600/20 transition-all group"
                aria-label="Order on DoorDash"
              >
                <svg className="h-6 w-6 text-gray-400 group-hover:text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.91 8.31c-.12-.54-.42-1.02-.86-1.37-.45-.35-1-.54-1.57-.54H12.8l.08-.37c.17-.78.26-1.58.26-2.38 0-.53-.43-.96-.96-.96s-.96.43-.96.96c0 .69-.08 1.38-.22 2.04l-.1.46H2.52c-.57 0-1.12.19-1.57.54-.44.35-.74.83-.86 1.37-.11.49-.07 1 .11 1.46l2.58 6.55c.36.91 1.24 1.51 2.22 1.51h14c.98 0 1.86-.6 2.22-1.51l2.58-6.55c.18-.46.22-.97.11-1.46z"/>
                </svg>
              </a>
              <a 
                href="https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-green-600/20 transition-all group"
                aria-label="Order on Uber Eats"
              >
                <svg className="h-6 w-6 text-gray-400 group-hover:text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 8 8.5V14l.5.5 3.5-2.5 3.5 2.5.5-.5V8.5L15.5 8z"/>
                </svg>
              </a>
              <a 
                href="https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-orange-600/20 transition-all group"
                aria-label="Order on Postmates"
              >
                <svg className="h-6 w-6 text-gray-400 group-hover:text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.52 3.84 10.01 9 11 5.16-.99 9-5.48 9-11V7l-10-5z"/>
                </svg>
              </a>
            </div>

            {/* Key Features */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">★</span>
                  <span>4.7 Rating</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-red-500">•</span>
                  <span>UFC House</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-red-500">•</span>
                  <span>Live Music</span>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Executive Chef Rebecca Sanchez
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-400">© {currentYear} Side Hustle Bar. All rights reserved.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/privacy" className="text-gray-500 hover:text-red-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-red-400 transition-colors">
              Terms
            </Link>
            <Link href="/accessibility" className="text-gray-500 hover:text-red-400 transition-colors">
              Accessibility
            </Link>
          </div>
        </div>

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "Side Hustle Bar",
              "description": "High-energy sports bar and entertainment venue specializing in Mexican cuisine in Salem and Portland, Oregon.",
              "url": "https://sidehustlelounge.com",
              "telephone": "+15033919977",
              "priceRange": "$$",
              "servesCuisine": "Mexican",
              "image": "/icons/side-hustle-exterior.jpg",
              "logo": "/icons/wolf-and-title.png",
              "sameAs": [
                "https://instagram.com/sidehustle_bar",
                "https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/",
                "https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
              ],
              "location": [
                {
                  "@type": "Place",
                  "name": "Side Hustle Salem",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "145 Liberty St NE Suite #101",
                    "addressLocality": "Salem",
                    "addressRegion": "OR",
                    "postalCode": "97301",
                    "addressCountry": "US"
                  },
                  "telephone": "+15033919977",
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday"],
                      "opens": "10:00",
                      "closes": "23:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification", 
                      "dayOfWeek": "Thursday",
                      "opens": "10:00",
                      "closes": "00:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Friday", "Saturday"], 
                      "opens": "10:00",
                      "closes": "02:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": "Sunday",
                      "opens": "10:00", 
                      "closes": "23:00"
                    }
                  ]
                },
                {
                  "@type": "Place",
                  "name": "Side Hustle Portland",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "327 SW Morrison Street",
                    "addressLocality": "Portland", 
                    "addressRegion": "OR",
                    "postalCode": "97204",
                    "addressCountry": "US"
                  },
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Sunday"],
                      "opens": "10:00",
                      "closes": "01:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": "Thursday", 
                      "opens": "10:00",
                      "closes": "01:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Friday", "Saturday"],
                      "opens": "10:00",
                      "closes": "03:00"
                    }
                  ]
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.7",
                "reviewCount": "750"
              }
            })
          }}
        />
      </div>
    </footer>
  );
}