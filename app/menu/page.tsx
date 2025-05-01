import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CartProvider } from '@/components/bartap/CartContext';
import { UnifiedMenuDisplay } from '@/components/unified-menu/UnifiedMenuDisplay';
import { getCategories } from '@/lib/menu-data';

// Client component wrapper in a separate file
import { MenuDisplayWrapper } from '@/components/unified-menu/MenuDisplayWrapper';

// Import the Category type or define it here
type Category = {
  id: string;
  name: string;
  description: string | null;
  display_order: number | null;
};

export const metadata: Metadata = {
  title: 'Menu | Side Hustle',
  description: 'Browse our menu and place your order',
};

/**
 * Unified Menu page that supports both informational browsing and ordering
 * Mode is determined by the 'mode' query parameter (default: view)
 * Ordering mode requires table identification
 */
export default async function MenuPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get mode from search params (default to 'view')
  // Use optional chaining and type checking to safely access searchParams properties
  const mode = typeof searchParams?.mode === 'string' && searchParams.mode === 'order' 
    ? 'order' 
    : 'view';
  
  const tableId = typeof searchParams?.table === 'string' 
    ? searchParams.table 
    : undefined;
  
  // Get categories for the menu display
  let categories: Category[] = [];
  try {
    categories = await getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
    // Continue with empty categories array
  }
  
  // Only check for table ID in order mode
  if (mode === 'order') {
    // Get cookies for authentication
    const cookieStore = await cookies();
    const storedTableId = cookieStore.get('table_id')?.value;
    
    // If no table ID provided, check for cookie
    const activeTableId = tableId || storedTableId;
    
    // If no table ID in URL or cookie, redirect to table entry
    if (!activeTableId) {
      redirect('/table');
    }
    
    // Create a Supabase client and update the session
    const supabase = await createClient(cookieStore);
    
    // Update last activity time for the table session
    await supabase
      .from('active_sessions')
      .upsert({
        table_id: activeTableId,
        last_activity: new Date().toISOString(),
      });
    
    // Render with client component wrapper
    return <MenuDisplayWrapper mode="order" tableNumber={activeTableId} categories={categories} />;
  }
  
  // Informational browsing mode (no ordering functionality)
  return <MenuDisplayWrapper mode="view" categories={categories} />;
}
