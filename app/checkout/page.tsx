import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { CheckoutForm } from '@/components/bartap/CheckoutForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'BarTap - Checkout',
  description: 'Review and submit your order',
};

interface CheckoutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Checkout page where customers can review and submit their order
 */
export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  // Get the table ID from either the URL or cookie
  const cookieStore = await cookies();
  
  // Properly handle searchParams - must await them in Next.js 15
  const searchParamsObj = await searchParams;
  const tableParam = searchParamsObj?.table;
  const tableIdFromParam = typeof tableParam === 'string' ? tableParam : undefined;
  
  const tableCookie = cookieStore.get('table_id');
  const tableId = tableIdFromParam || tableCookie?.value;
  
  console.log('[CheckoutPage] searchParams:', JSON.stringify(searchParamsObj));
  console.log('[CheckoutPage] tableIdFromParam:', tableIdFromParam);
  const logCookie = cookieStore.get('table_id');
  console.log('[CheckoutPage] cookie table_id:', logCookie?.value);
  console.log('[CheckoutPage] final tableId:', tableId);
  
  // If no table ID, redirect to table identification
  if (!tableId) {
    console.log('[CheckoutPage] No tableId found, redirecting to /table');
    redirect('/table');
  }
  
  // Create Supabase client
  const supabase = await createSupabaseServerClient(cookieStore);
  
  // Verify the table exists
  const { data: tableData, error } = await supabase
    .from('tables')
    .select('id, name, section')
    .eq('id', tableId)
    .single();
  
  console.log('[CheckoutPage] tableData:', JSON.stringify(tableData));
  console.log('[CheckoutPage] table query error:', error?.message);
  
  // If table doesn't exist, redirect to table identification
  if (error || !tableData) {
    console.log('[CheckoutPage] Table not found or error, redirecting to /table');
    cookieStore.delete('table_id');
    redirect('/table');
  }
  
  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Review Your Order</h1>
      <p className="text-muted-foreground mb-6">
        Table {tableData.name}{tableData.section ? ` (${tableData.section})` : ''}
      </p>
      
      <CheckoutForm tableData={tableData} />
    </div>
  );
}
