import { Metadata } from 'next';
import { Suspense } from 'react';
import { TableManagement } from '@/components/unified';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'BarTap Admin - Tables',
  description: 'Manage tables and generate QR codes'
};

/**
 * Admin tables page for managing all tables and generating QR codes
 * Uses server-side rendering for initial data load
 */
export default async function TablesPage() {
  // Create Supabase client with cookies
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  
  // Fetch all tables
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('name', { ascending: true });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
        <p className="text-muted-foreground">
          Manage tables and generate QR codes for customer ordering
        </p>
      </div>
      
      <Suspense fallback={<TableSkeleton />}>
        <TableManagement initialTables={tables || []} />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="w-1/3 h-8 bg-muted rounded"></div>
        <div className="w-24 h-8 bg-muted rounded"></div>
      </div>
      
      <div className="border rounded-md p-6">
        <div className="h-8 w-1/4 bg-muted rounded mb-4"></div>
        <div className="h-4 w-1/2 bg-muted rounded mb-8"></div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 pb-2 border-b">
            <div className="h-5 bg-muted rounded"></div>
            <div className="h-5 bg-muted rounded"></div>
            <div className="h-5 bg-muted rounded"></div>
            <div className="h-5 bg-muted rounded"></div>
          </div>
          
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 py-2">
              <div className="h-5 bg-muted rounded"></div>
              <div className="h-5 bg-muted rounded"></div>
              <div className="h-5 w-16 bg-muted rounded"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}