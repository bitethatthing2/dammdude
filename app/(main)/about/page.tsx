import { Metadata } from 'next';
import { AboutHero } from '@/components/about/AboutHero';
import { ValuesHighlight } from '@/components/about/ValuesHighlight';
import { TestimonialCarousel } from '@/components/about/TestimonialCarousel';
import { TeamSection } from '@/components/about/TeamSection';
import { LocationsSection } from '@/components/about/LocationsSection';
import { StoryBlock } from '@/components/about/StoryBlock';
import { MilestoneTimeline } from '@/components/about/MilestoneTimeline';
import { CommunityInvolvement } from '@/components/about/CommunityInvolvement';
import { FrequentlyAskedQuestions } from '@/components/about/FrequentlyAskedQuestions';

export const metadata: Metadata = {
  title: 'About Side Hustle | Salem & Portland Sports Bar',
  description: 'Learn about Side Hustle, Salem and Portland\'s premier sports bar and Wolf Pack community. Discover our story, values, team, and commitment to creating an exceptional experience.',
  keywords: 'Side Hustle, sports bar, Salem, Portland, Oregon, Wolf Pack, community, about us, team, locations',
  openGraph: {
    title: 'About Side Hustle - Your Local Sports Bar & Community Hub',
    description: 'Discover the story behind Side Hustle, where sports, community, and great times come together in Salem and Portland.',
    type: 'website',
    url: 'https://sidehustlelounge.com/about',
    images: [
      {
        url: '/images/about/hero-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Side Hustle Sports Bar'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Side Hustle | Salem & Portland Sports Bar',
    description: 'Learn about Salem and Portland\'s premier sports bar and Wolf Pack community.',
    images: ['/images/about/hero-og.jpg']
  },
  alternates: {
    canonical: 'https://sidehustlelounge.com/about'
  }
};

// Structured data for local business
const structuredData = {
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  "name": "Side Hustle",
  "description": "Premier sports bar and Wolf Pack community in Salem and Portland, Oregon",
  "url": "https://sidehustlelounge.com",
  "telephone": "+15035550123",
  "priceRange": "$$",
  "servesCuisine": "American",
  "hasMenu": "https://sidehustlelounge.com/menu",
  "acceptsReservations": "true",
  "location": [
    {
      "@type": "Place",
      "name": "Side Hustle Salem",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Liberty St SE",
        "addressLocality": "Salem",
        "addressRegion": "OR",
        "postalCode": "97301",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 44.9429,
        "longitude": -123.0351
      }
    },
    {
      "@type": "Place",
      "name": "Side Hustle Portland",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "456 Burnside St",
        "addressLocality": "Portland",
        "addressRegion": "OR",
        "postalCode": "97204",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 45.5152,
        "longitude": -122.6784
      }
    }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "11:00",
      "closes": "00:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "10:00",
      "closes": "02:00"
    }
  ]
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <AboutHero />
        
        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">Our Story</h2>
              <div className="space-y-8">
                <StoryBlock isPortland={false} />
                <StoryBlock isPortland={true} />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <ValuesHighlight />

        {/* Milestones */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Our Journey</h2>
            <MilestoneTimeline />
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">What Our Customers Say</h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Don&apos;t just take our word for it - hear from our amazing Wolf Pack community
            </p>
            <TestimonialCarousel />
          </div>
        </section>

        {/* Team */}
        <TeamSection />

        {/* Locations */}
        <LocationsSection />

        {/* Community Involvement */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Giving Back</h2>
            <CommunityInvolvement />
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Got questions? We&apos;ve got answers!
            </p>
            <FrequentlyAskedQuestions />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Join the Pack?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Experience the best sports bar atmosphere in Salem and Portland. 
              Join our Wolf Pack community today!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/wolfpack"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-purple-900 hover:bg-purple-100 h-11 px-8"
              >
                Join Wolf Pack
              </a>
              <a
                href="/menu"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white text-white hover:bg-white/10 h-11 px-8"
              >
                View Menu
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}