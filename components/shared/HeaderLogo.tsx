"use client";

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
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '150px'
        }}
        priority // Prioritize loading the logo
      />
    </div>
  );
}
