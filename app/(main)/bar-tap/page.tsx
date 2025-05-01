import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { BarTapWrapper } from '@/components/unified-menu/BarTapWrapper';
import { getCategories } from '@/lib/menu-data';

export const metadata: Metadata = {
  title: 'BarTap | Side Hustle',
  description: 'Order food and drinks directly from your table',
};

/**
 * BarTap page for ordering food and drinks
 * Uses server components for data fetching and client components for interactivity
 */
export default async function BarTapPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get table ID from search params
  const tableId = searchParams.table as string | undefined;
  
  // Get categories for the menu display
  const categories = await getCategories();
  
  // Get cookies for authentication
  const cookieStore = await cookies();
  const storedTableId = cookieStore.get('table_id')?.value;
  
  // If no table ID provided, check for cookie
  const activeTableId = tableId || storedTableId || '1';
  
  // Create a Supabase client
  const supabase = createClient(await cookieStore);
  
  // Update last activity time for the table session if we have a table ID
  if (tableId) {
    await supabase
      .from('active_sessions')
      .upsert({
        table_id: activeTableId,
        last_activity: new Date().toISOString(),
      });
  }
  
  // Render with client component wrapper
  return <BarTapWrapper initialCategories={categories} initialTableNumber={activeTableId} />;
}
