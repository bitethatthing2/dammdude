import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { MenuGrid } from '@/components/unified/menu';
import { getCategories } from '@/lib/menu-data';

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
  const mode = searchParams?.mode === 'order' ? 'order' : 'view';
  
  // Get table ID from search params
  const tableId = searchParams?.table as string | undefined;
  
  // Get categories for the menu display
  const categoriesData = await getCategories();
  const categoryNames = categoriesData.map(cat => cat.name);
  
  // Get menu items from the database
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  
  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('display_order', { ascending: true });
    
  if (error) {
    console.error('Failed to load menu items:', error);
    // Continue with empty menu array
  }
  
  // Format menu items for the component
  const formattedItems = (menuItems || []).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price,
    image: item.image_url,
    category: item.category_name || 'Other',
    tags: item.tags || []
  }));
  
  // Only check for table ID in order mode
  if (mode === 'order') {
    const tableCookie = cookieStore.get('table_id');
    const storedTableId = tableCookie?.value;
    
    // If no table ID provided, check for cookie
    const activeTableId = tableId || storedTableId;
    
    // If no table ID in URL or cookie, redirect to table entry
    if (!activeTableId) {
      redirect('/table');
    }
    
    // Update last activity time for the table session
    await supabase
      .from('active_sessions')
      .upsert({
        table_id: activeTableId,
        last_activity: new Date().toISOString(),
      });
    
    // Render order mode with full cart functionality
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Our Menu</h1>
        <p className="text-muted-foreground mb-6">
          Table #{activeTableId} | Place your order below
        </p>
        
        <Suspense fallback={<MenuSkeleton />}>
          <MenuGrid
            items={formattedItems}
            categories={categoryNames}
            onAddToCart={(id, quantity) => {
              // Cart logic will be handled by client component
            }}
            onItemClick={(id) => {
              // View details logic will be handled by client component
            }}
            variant="detailed"
            showFilters={true}
          />
        </Suspense>
      </div>
    );
  }
  
  // Informational browsing mode (no ordering functionality)
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Our Menu</h1>
      <p className="text-muted-foreground mb-6">
        View our delicious food and drinks offerings
      </p>
      
      <Suspense fallback={<MenuSkeleton />}>
        <MenuGrid
          items={formattedItems}
          categories={categoryNames}
          onItemClick={(id) => {
            // View details logic will be handled by client component
          }}
          variant="default"
          showFilters={true}
        />
      </Suspense>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted/40 rounded-md w-full animate-pulse"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-48 bg-muted/40 rounded-md animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}