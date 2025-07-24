'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, Instagram, Mail, ExternalLink } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
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
            <p className="text-base text-gray-300 leading-relaxed max-w-sm">
              Where high-energy entertainment meets authentic Mexican cuisine. 
              <span className="text-red-400 font-medium"> Unlock your potential and live your best life with the Wolf Pack.</span>
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-gray-400 hover:text-red-400 hover:bg-red-600/10 border border-zinc-700 hover:border-red-600/30 transition-all duration-300 rounded-xl"
                asChild
              >
                <a 
                  href="https://instagram.com/sidehustle_bar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-gray-400 hover:text-red-400 hover:bg-red-600/10 border border-zinc-700 hover:border-red-600/30 transition-all duration-300 rounded-xl"
                asChild
              >
                <a 
                  href="mailto:info@sidehustlelounge.com" 
                  aria-label="Email us"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </Button>
            </div>
            <div className="text-sm text-gray-400">
              <span className="font-semibold text-white">101K+</span> followers on Instagram
            </div>
          </div>

          {/* Salem Location */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Salem Location</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3 group">
                <div className="h-8 w-8 bg-red-600/20 rounded-lg flex items-center justify-center mt-0.5">
                  <MapPin className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <address className="not-italic text-gray-300 leading-relaxed">
                    <div className="font-medium text-white">Historic Downtown</div>
                    145 Liberty St NE, Suite #101<br />
                    Salem, OR 97301
                  </address>
                </div>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="h-8 w-8 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-red-500" />
                </div>
                <a 
                  href="tel:+15033919977"
                  className="text-gray-300 hover:text-red-400 transition-colors font-medium"
                >
                  (503) 391-9977
                </a>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="h-8 w-8 bg-red-600/20 rounded-lg flex items-center justify-center mt-0.5">
                  <Clock className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-gray-300">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span>Mon-Wed:</span><span className="font-medium">10AM - 11PM</span></div>
                    <div className="flex justify-between"><span>Thursday:</span><span className="font-medium">10AM - 12AM</span></div>
                    <div className="flex justify-between"><span>Fri-Sat:</span><span className="font-medium text-red-400">10AM - 2AM</span></div>
                    <div className="flex justify-between"><span>Sunday:</span><span className="font-medium">10AM - 11PM</span></div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-red-600/30 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-300 rounded-lg"
                asChild
              >
                <a 
                  href="https://maps.google.com/?q=145+Liberty+St+NE+Suite+101+Salem+OR+97301"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Directions <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>

          {/* Portland Location */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Portland Location</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3 group">
                <div className="h-8 w-8 bg-blue-600/20 rounded-lg flex items-center justify-center mt-0.5">
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <address className="not-italic text-gray-300 leading-relaxed">
                    <div className="font-medium text-white">Downtown Portland</div>
                    327 SW Morrison Street<br />
                    Portland, OR 97204
                  </address>
                </div>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="h-8 w-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-gray-300 font-medium">Coming Soon</span>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="h-8 w-8 bg-blue-600/20 rounded-lg flex items-center justify-center mt-0.5">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-gray-300">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span>Mon-Wed & Sun:</span><span className="font-medium">10AM - 1AM</span></div>
                    <div className="flex justify-between"><span>Thursday:</span><span className="font-medium">10AM - 1AM</span></div>
                    <div className="flex justify-between"><span>Fri-Sat:</span><span className="font-medium text-blue-400">10AM - 3AM</span></div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-blue-600/30 text-blue-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 rounded-lg"
                asChild
              >
                <a 
                  href="https://maps.google.com/?q=327+SW+Morrison+Street+Portland+OR+97204"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Directions <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>

          {/* Experience & Links */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">The Experience</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-green-600 to-green-400 rounded-full"></div>
            </div>
            
            {/* Key Features */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Oregon's UFC House</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Legendary Birria</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Live Music</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Gaming Area</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Family-Friendly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">4.7★ Rating</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Quick Order</h4>
              <div className="flex flex-col space-y-2">
                <a 
                  href="https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors text-sm py-1 px-2 rounded-lg hover:bg-red-600/10"
                >
                  <div className="h-6 w-6 bg-red-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <span>DoorDash</span>
                </a>
                <a 
                  href="https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors text-sm py-1 px-2 rounded-lg hover:bg-green-600/10"
                >
                  <div className="h-6 w-6 bg-green-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">U</span>
                  </div>
                  <span>Uber Eats</span>
                </a>
                <a 
                  href="https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-orange-400 transition-colors text-sm py-1 px-2 rounded-lg hover:bg-orange-600/10"
                >
                  <div className="h-6 w-6 bg-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <span>Postmates</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-3">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-white">© {currentYear} Side Hustle Bar. All rights reserved.</p>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Founded by <span className="text-white font-medium">James Mullins</span></p>
              <p>Executive Chef <span className="text-red-400 font-medium">Rebecca Sanchez</span></p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end space-y-3">
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/accessibility" 
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                Accessibility
              </Link>
            </div>
            <div className="text-xs text-gray-500 text-center md:text-right">
              <p>Crafted with ❤️ for the Wolf Pack</p>
            </div>
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