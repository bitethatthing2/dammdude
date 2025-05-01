import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { CartProvider } from '@/components/bartap/CartContext';
import { ClientCheckoutForm } from '@/components/bartap/ClientCheckoutForm';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'BarTap - Checkout',
  description: 'Review and submit your order',
};

/**
 * Checkout page where customers can review and submit their order
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get the table ID from either the URL or cookie
  const cookieStore = await cookies();
  const tableId = 
    (searchParams.table as string | undefined) || 
    cookieStore.get('table_id')?.value;
  
  // If no table ID, redirect to table identification
  if (!tableId) {
    redirect('/table');
  }
  
  // Create Supabase client
  const supabase = createClient(cookieStore);
  
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
    <CartProvider tableId={tableId} deliveryFee={0}>
      <div className="container max-w-md mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">Review Your Order</h1>
        <p className="text-muted-foreground mb-6">
          Table {tableData.name}{tableData.section ? ` (${tableData.section})` : ''}
        </p>
        
        <ClientCheckoutForm tableData={tableData} />
      </div>
    </CartProvider>
  );
}
