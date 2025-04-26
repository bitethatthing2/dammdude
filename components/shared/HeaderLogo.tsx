"use client";

import { useState, useEffect } from 'react';

export default function HeaderLogo() {
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return (
      <div className="flex items-center">
        <span className="font-extrabold text-lg tracking-wider uppercase font-sans">SIDE HUSTLE</span>
      </div>
    );
  }
    
  return (
    <div className="flex items-center">
      <span className="font-extrabold text-lg tracking-wider uppercase font-sans">SIDE HUSTLE</span>
    </div>
  );
}
