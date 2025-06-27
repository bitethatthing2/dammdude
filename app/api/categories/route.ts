import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Use type assertion to handle tables not in restricted type
    const { data, error } = await (supabase as any)
      .from('food_drink_categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in categories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
