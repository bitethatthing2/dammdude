'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorComponentProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BarTapError({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('BarTap error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="mb-6">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          We couldn&apos;t load the bar menu. Please try again.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 justify-center">
          <Button 
            onClick={() => reset()} 
            className="gap-1"
            variant="default"
          >
            Try again
          </Button>
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="outline"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
