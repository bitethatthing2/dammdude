"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { verifyAndStoreTableSession, type Table } from '@/lib/utils/table-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableNumber.trim()) {
      setError('Please enter a table number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use shared utility to verify and store table session
      const result = await verifyAndStoreTableSession(tableNumber.trim(), supabase);
      
      if (!result.success || !result.table) {
        // Make sure to handle case where result.error might be undefined
        setError(result.error || 'Table not found. Please try again.');
        return;
      }
      
      // We have asserted that result.table exists
      const tableData = result.table;
      
      // Show success message
      toast.success('Table identified', {
        description: `You're now at Table ${tableData.name}${tableData.section ? ` (${tableData.section})` : ''}`,
      });
      
      // Redirect to bar-tap page
      router.push(`/bar-tap?table=${tableData.id}`);
    } catch (error) {
      console.error('Error identifying table:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="tableNumber">Table Number</Label>
        <Input
          id="tableNumber"
          placeholder="Enter your table number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          required
          className="text-lg"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Identifying Table...' : 'Continue to Menu'}
      </Button>
      
      <p className="text-center text-sm text-muted-foreground pt-2">
        Your table number is usually displayed on your table or ask your server.
      </p>
    </form>
  );
}
