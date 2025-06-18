import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    // Get the category ID from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    
    const supabase = await createServerClient();
    
    let query = supabase
      .from('food_drink_items')
      .select(`
        *,
        images:image_id (
          id,
          url,
          storage_path,
          metadata
        ),
        category:food_drink_categories(name, type)
      `)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    // If categoryId is provided, filter by it
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId, 10);
      if (isNaN(categoryIdNum)) {
        return NextResponse.json(
          { error: 'Invalid category ID' },
          { status: 400 }
        );
      }
      query = query.eq('category_id', categoryIdNum);
    }
    
    // Get menu items
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching menu items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menu items' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in menu-items API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
