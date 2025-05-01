import type { PostgrestSingleResponse } from '@supabase/postgrest-js';
import type { Database } from '../database.types';

// Define a type alias for the Supabase client to avoid namespace errors
type SupabaseClientType = any;

// Simplify typing approach to avoid complex type issues
export interface Table {
  id: string;
  name: string;
  section: string | null;
}

export type VerificationResult = {
  success: boolean;
  table?: Table;
  error?: string;
};

/**
 * Verifies a table exists in the database and creates/updates an active session
 * Used by both manual table entry and QR code scanning flows
 */
export async function verifyAndStoreTableSession(
  tableIdentifier: string,
  supabase: SupabaseClientType
): Promise<VerificationResult> {
  try {
    // Handle both cases: either table ID or table name provided
    const { data, error } = await supabase
      .from('tables')
      .select('id, name, section')
      .or(`name.eq."${tableIdentifier}",id.eq."${tableIdentifier}"`)
      .single();

    if (error || !data) {
      return { 
        success: false, 
        error: 'Table not found. Please check the number and try again.' 
      };
    }

    // Store the table information in the session
    await supabase
      .from('active_sessions')
      .upsert({
        table_id: data.id,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      });

    // Store table ID in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('table_id', data.id);
    }

    return { 
      success: true, 
      table: data as Table 
    };
  } catch (err) {
    console.error('Error verifying table:', err);
    return { 
      success: false, 
      error: 'An error occurred while verifying the table. Please try again.' 
    };
  }
}
