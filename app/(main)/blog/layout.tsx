import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Side Hustle Blog - Salem\'s Premier Hip-Hop & R&B Venue | Artist Roster & Event Coverage',
  description: 'Complete guide to Side Hustle Bar\'s artist lineup, DJ roster, and event programming. Featuring major hip-hop headliners like ILOVEMAKONNEN, Trinidad James, Kirko Bangz, and Casey Veggies in Salem and Portland, Oregon.',
  keywords: [
    'Side Hustle Bar',
    'Salem hip-hop venue',
    'Portland hip-hop',
    'ILOVEMAKONNEN Salem', 
    'Trinidad James Oregon',
    'Kirko Bangz',
    'Casey Veggies tour',
    'DJ Inferno',
    'Rhythm Flow events',
    'Oregon hip-hop shows',
    'Salem nightlife',
    'Pacific Northwest hip-hop',
    'R&B events Oregon',
    'hip-hop blog Salem'
  ].join(', '),
  openGraph: {
    title: 'Side Hustle Blog - Complete Artist Roster & Event Coverage',
    description: 'Salem\'s premier hip-hop destination featuring major touring artists, resident DJs, and weekly event programming. 101K+ Instagram followers, 750+ five-star reviews.',
    url: 'https://sidehustlelounge.com/blog',
    siteName: 'Side Hustle Bar',
    images: [
      {
        url: '/icons/wolf-and-title.png',
        width: 1200,
        height: 630,
        alt: 'Side Hustle Bar - Salem & Portland Hip-Hop Venue',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Side Hustle Blog - Hip-Hop Artist Roster & Event Coverage',
    description: 'Complete guide to Salem\'s premier hip-hop venue featuring major artists, DJs, and event programming.',
    images: ['/icons/wolf-and-title.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://sidehustlelounge.com/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
}