import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST handler for manual table identification
 * Processes form submissions when users manually enter their table number
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const tableNumber = formData.get('tableNumber') as string;
  
  if (!tableNumber) {
    return NextResponse.json(
      { error: 'Table number is required' },
      { status: 400 }
    );
  }
  
  // Create a server-side Supabase client
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  
  // Find table by number/name
  const { data: tableData, error } = await supabase
    .from('tables')
    .select('id, name, section')
    .or(`name.eq.${tableNumber},id.eq.${tableNumber}`)
    .single();
  
  if (error || !tableData) {
    return NextResponse.json(
      { error: 'Table not found' },
      { status: 404 }
    );
  }
  
  // Store the table information in the session
  await supabase
    .from('active_sessions')
    .upsert({
      table_id: tableData.id,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    });
  
  // Set table ID cookie
  try {
    // Use await with cookies
    await cookieStore.set({
      name: 'table_id',
      value: tableData.id,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    });
  } catch (error) {
    console.warn('Could not set table_id cookie', error);
  }
  
  // Redirect to menu with the table context
  return NextResponse.redirect(new URL(`/menu?table=${tableData.id}`, request.url));
}
