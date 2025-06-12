import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TableDisplay } from '@/components/bartap/TableDisplay';

interface TableIdentificationProps {
  tableId?: string;
}

/**
 * Server component that handles table identification and session creation
 * Used when customers scan QR codes to identify their table
 */
export async function TableIdentification({ tableId }: TableIdentificationProps) {
  // Create a server-side Supabase client
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  
  // If no table ID is provided, show a manual entry form
  if (!tableId) {
    return <ManualTableEntry />;
  }
  
  // Validate table ID against the database
  const { data: tableData, error } = await supabase
    .from('tables')
    .select('id, name, section')
    .eq('id', tableId)
    .single();
  
  // If table doesn't exist or there's an error, show error state
  if (error || !tableData) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="flex items-center justify-center mb-4">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-white">Invalid Table</h2>
        <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
          This table ID could not be found. Please scan the QR code again or enter your table number manually.
        </p>
        <div className="mt-6">
          <ManualTableEntry />
        </div>
      </div>
    );
  }
  
  // Store the table information in the session
  const { error: sessionError } = await supabase
    .from('active_sessions')
    .upsert({
      table_id: tableData.id,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    });
  
  if (sessionError) {
    console.error('Failed to create session:', sessionError);
  }

  // Set table ID cookie and redirect to the menu
  await cookieStore.set('table_id', tableData.id, { 
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  });
  
  // Redirect to menu with the table context
  redirect(`/menu?table=${tableData.id}`);
  
  // This will not be reached due to redirect, but TypeScript requires a return
  return <TableDisplay tableData={tableData} />;
}

/**
 * Client component for manual table entry
 * Used when QR code is not available or doesn't work
 */
function ManualTableEntry() {
  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-white">Enter Your Table Number</h2>
      <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
        Please enter your table number to continue ordering.
      </p>
      <form className="mt-6" action="/api/table-identification" method="POST">
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            name="tableNumber"
            placeholder="Table Number"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Continue to Menu
          </button>
        </div>
      </form>
    </div>
  );
}
