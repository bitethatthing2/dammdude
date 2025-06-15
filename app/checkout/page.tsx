import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { CheckoutForm } from '@/components/bartap/CheckoutForm';
import { createServerClient } from '@/lib/supabase/server';

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
  
  
  // If no table ID, redirect to table identification
  if (!tableId) {
      redirect('/table');
  }
  
  // Create Supabase client
  const supabase = await createServerClient(cookieStore);
  
  // Verify the table exists
  const { data: tableData, error } = await supabase
    .from('tables')
    .select('id, name, section')
    .eq('id', tableId)
    .single();
  
  
  // If table doesn't exist, redirect to table identification
  if (error || !tableData) {
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
