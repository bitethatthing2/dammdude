// app/api/menu-items/[categoryId]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  
  console.log('🍽️ API: Fetching items for category:', categoryId);
  
  try {
    const supabase = createClient();
    console.log('✅ Using service role key for menu access');
    
    // Query the correct table: food_drink_items
    const { data: items, error } = await supabase
      .from('food_drink_items')
      .select(`
        *,
        item_modifier_groups (
          id,
          group_name,
          modifier_type,
          is_required,
          min_selections,
          max_selections,
          description,
          modifier_group_items (
            id,
            modifier_id,
            display_order,
            is_default
          )
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error(`❌ Error fetching menu items for category ${categoryId}:`, error);
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    
    // Transform the data to match the expected format
    const transformedItems = items?.map(item => ({
      ...item,
      modifier_groups: item.item_modifier_groups?.map(group => ({
        ...group,
        modifiers: group.modifier_group_items || []
      })) || []
    })) || [];
    
    console.log(`✅ API: Found ${transformedItems.length} items for category:`, categoryId);
    
    return NextResponse.json({ items: transformedItems });
  } catch (error) {
    console.error('Error in menu-items API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}