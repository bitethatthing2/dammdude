import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MenuBrowser } from '@/components/bartap/MenuBrowser';
import { getCategories } from '@/lib/menu-data';

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
  const cookieStore = cookies();
  const tableCookie = cookieStore.get('table_id');
  const storedTableId = tableCookie?.value || '1';
  
  // Get categories for the menu display
  const categories = await getCategories();
  
  // Create a Supabase client with the correct cookie store
  const supabase = await createSupabaseServerClient(cookieStore);
  
  // Record table activity
  await supabase
    .from('active_sessions')
    .upsert({
      table_id: storedTableId,
      last_activity: new Date().toISOString(),
    });
  
  // Get menu items
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .order('name');
    
  // Render with client component
  return <MenuBrowser categories={categories} menuItems={menuItems || []} />;
}
