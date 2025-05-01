import { Metadata } from 'next';
import { TableManagement } from '@/components/bartap/TableManagement';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'BarTap Admin - Tables',
  description: 'Manage tables and generate QR codes'
};

interface Table {
  id: string;
  name: string;
  section: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Admin tables page for managing all tables and generating QR codes
 * Uses server-side rendering for initial data load
 */
export default async function TablesPage() {
  // Create Supabase client
  const supabase = createSupabaseServerClient();
  
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
      
      <TableManagement initialTables={tables || []} />
    </div>
  );
}
