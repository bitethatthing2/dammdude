'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

export function InstagramEmbed({ className = '' }: { className?: string }) {
  const embedRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let scriptElement: HTMLScriptElement | null = null;

    const loadInstagramEmbed = () => {
      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');
      
      if (existingScript) {
        // Script already exists, just process embeds
        setScriptLoaded(true);
        return;
      }

      // Create and load the script
      scriptElement = document.createElement('script');
      scriptElement.async = true;
      scriptElement.defer = true;
      scriptElement.src = '//www.instagram.com/embed.js';
      
      scriptElement.onload = () => {
        setScriptLoaded(true);
      };
      
      scriptElement.onerror = () => {
        console.warn('Instagram embed script failed to load');
        if (retryCount < 2) {
          timeoutId = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      };
      
      document.body.appendChild(scriptElement);
    };

    // Delay loading to ensure DOM is ready
    timeoutId = setTimeout(loadInstagramEmbed, 100);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [retryCount]);

  useEffect(() => {
    if (scriptLoaded && window.instgrm?.Embeds && embedRef.current) {
      // Small delay to ensure DOM is updated
      const processTimeout = setTimeout(() => {
        try {
          window.instgrm?.Embeds.process();
        } catch (error) {
          console.warn('Instagram embed processing error:', error);
        }
      }, 100);

      return () => clearTimeout(processTimeout);
    }
  }, [scriptLoaded]);

  return (
    <div className={`${className} space-y-3`} ref={embedRef}>
      <blockquote 
        className="instagram-media" 
        data-instgrm-captioned
        data-instgrm-permalink="https://www.instagram.com/sidehustle_bar/" 
        data-instgrm-version="14" 
        style={{ 
          background: '#FFF', 
          border: 0, 
          borderRadius: '3px', 
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)', 
          margin: '1px auto', 
          maxWidth: '540px', 
          minWidth: '326px', 
          padding: 0, 
          width: '99.375%'
        }}
      >
        <a href="https://www.instagram.com/sidehustle_bar/" target="_blank" rel="noopener noreferrer">View this profile on Instagram</a>
      </blockquote>
      
      <div className="flex justify-center">
        <Button
          onClick={() => window.open('https://www.instagram.com/sidehustle_bar/', '_blank', 'noopener,noreferrer')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
        >
          <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>View Full Profile on Instagram</span>
          <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    </div>
  );
}