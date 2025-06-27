'use client';

import Image from 'next/image';

export default function HeaderLogo() {
  // Use light mode logo only
  const logoSrc = '/icons/sidehustle-font-lightscreen.png';
    
  return (
    <div className="flex items-center">
      {/* Use Next.js Image component with correct aspect ratio handling */}
      <Image 
        src={logoSrc}
        alt="Side Hustle Logo"
        width={150}
        height={24}
        className="w-auto h-auto max-w-[150px]"
        priority // Prioritize loading the logo
      />
    </div>
  );
}
