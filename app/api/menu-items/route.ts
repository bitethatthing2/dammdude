import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

interface MenuItemWithModifiers {
  id: string;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  category_name: string;
  menu_type: string;
  category_icon: string;
  modifiers: Array<{
    type: string;
    options: Array<{
      id: string;
      name: string;
      price_adjustment: number;
    }>;
    required: boolean;
    max_selections: number;
  }>;
}
export async function GET(request: NextRequest) {
  try {
    // Get the category ID from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    
    const supabase = await createServerClient();
    
    // Use the function that returns menu items with modifiers
    const { data, error } = await supabase.rpc('get_menu_items_with_modifiers');
    
    if (error) {
      console.error('Error fetching menu items with modifiers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menu items' },
        { status: 500 }
      );
    }
    
    let menuItems = data || [];
    
    // If categoryId is provided, filter by it
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId, 10);
      if (isNaN(categoryIdNum)) {
        return NextResponse.json(
          { error: 'Invalid category ID' },
          { status: 400 }
        );
      }
      // Filter by category name since the function returns category_name
      menuItems = menuItems.filter((item: MenuItemWithModifiers) => {
        // You may need to adjust this based on how categories are mapped
        return item.category_name === categoryId;
      });
    }
    
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Unexpected error in menu-items API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
