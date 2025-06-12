import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Menu from '@/components/menu/Menu';

export const metadata: Metadata = {
  title: 'BarTap | Side Hustle',
  description: 'Order food and drinks directly from your table',
};

/**
 * BarTap page for ordering food and drinks
 * Uses server components for data fetching and client components for interactivity
 */
export default async function BarTapPage() {
  // Get table ID from cookies
  const cookieStore = await cookies();
  const tableCookie = cookieStore.get('table_id');
  const storedTableId = tableCookie?.value || '1';
  
  // Create a Supabase client with the correct cookie store
  const supabase = await createSupabaseServerClient(cookieStore);
  
  // Record table activity
  await supabase
    .from('active_sessions')
    .upsert({
      table_id: storedTableId,
      last_activity: new Date().toISOString(),
    });
    
  // Render with Menu component (it loads its own data)
  return <Menu />;
}
