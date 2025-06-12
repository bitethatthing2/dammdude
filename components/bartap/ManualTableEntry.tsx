"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { verifyAndStoreTableSession } from '@/lib/utils/table-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle, TableIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBarTap } from '@/lib/contexts/bartap-context';

/**
 * Component for manually entering table number/name
 * Validates the input against the database and creates a session
 */
export function ManualTableEntry() {
  const [tableNumber, setTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { setTableId } = useBarTap();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTableNumber = tableNumber.trim();
    
    if (!trimmedTableNumber) {
      setError('Please enter a table number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use shared utility to verify and store table session
      const result = await verifyAndStoreTableSession(trimmedTableNumber, supabase);
      
      if (!result.success || !result.table) {
        // Handle error case with better messaging
        const errorMessage = result.error || 'Table not found. Please check the number and try again.';
        setError(errorMessage);
        
        // Log for debugging in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Table verification failed:', result);
        }
        
        return;
      }
      
      // Success case - we have a valid table
      const tableData = result.table;
      
      // Show success message with table details
      toast.success('Table identified!', {
        description: `You're now at Table ${tableData.name}${tableData.section ? ` (${tableData.section})` : ''}`,
        icon: <TableIcon className="h-4 w-4" />,
      });
      
      // Update BarTap context with the table ID
      setTableId(tableData.id);
      
      // Small delay for better UX - allows toast to be seen
      setTimeout(() => {
        // Redirect to menu page with order mode
        router.push(`/menu?mode=order&table=${tableData.id}`);
      }, 500);
      
    } catch (error) {
      console.error('Error identifying table:', error);
      
      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          setError('Connection error. Please check your internet and try again.');
        } else if (error.message.includes('timeout')) {
          setError('Request timed out. Please try again.');
        } else {
          setError('Something went wrong. Please try again or ask for assistance.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="tableNumber" className="text-base font-medium">
            Table Number
          </Label>
          <div className="relative">
            <TableIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="tableNumber"
              type="text"
              inputMode="numeric"
              pattern="[0-9A-Za-z\s-]+"
              placeholder="Enter your table number"
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value);
                // Clear error when user starts typing
                if (error) setError(null);
              }}
              required
              disabled={isLoading}
              className="pl-10 text-lg h-12"
              autoComplete="off"
              autoFocus
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Usually displayed on your table or provided by your server
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium"
          disabled={isLoading || !tableNumber.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Identifying Table...
            </>
          ) : (
            'Continue to Menu'
          )}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Need help?
            </span>
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          If you&#39;re having trouble, please ask a staff member for assistance.
          They&#39;ll be happy to help you get started with your order.
        </p>
      </form>
    </div>
  );
}