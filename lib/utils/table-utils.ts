import { supabase } from '@/lib/supabase/client';
// Import the actual function to derive the type
// Derive the type from the return type of createClient
type SupabaseClientType = ReturnType<typeof createClient>;

// Type for the tables table based on actual schema
export interface Table {
  id: string;
  name: string;
  section: string | null;
  is_active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Type for active_sessions table based on actual schema
export interface ActiveSession {
  id?: string;
  table_id: string;
  session_id?: string | null;
  created_at?: string | null;
  last_activity?: string | null;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Type for verification result
export type VerificationResult = {
  success: boolean;
  table?: Table;
  error?: string;
};

// Constants
const TABLE_SESSION_COOKIE_NAME = 'wolfpack_table_id';
const TABLE_SESSION_STORAGE_KEY = 'wolfpack_table_id';
const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Verifies a table exists in the database and creates/updates an active session
 * Used by both manual table entry and QR code scanning flows
 */
export async function verifyAndStoreTableSession(
  tableIdentifier: string,
  supabase: SupabaseClientType
): Promise<VerificationResult> {
  try {
    // Sanitize input
    const sanitizedIdentifier = tableIdentifier.trim();
    
    if (!sanitizedIdentifier) {
      return {
        success: false,
        error: 'Please enter a table number'
      };
    }

    // Query for the table - try both name and ID
    // Using ilike for case-insensitive name matching
    let query = supabase
      .from('tables')
      .select('id, name, section, is_active, created_at, updated_at');

    // Check if it's a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sanitizedIdentifier);
    
    if (isUUID) {
      // If it looks like a UUID, search by ID
      query = query.eq('id', sanitizedIdentifier);
    } else {
      // Otherwise search by name (case-insensitive)
      query = query.ilike('name', sanitizedIdentifier);
    }

    // Only get active tables
    query = query.eq('is_active', true);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[table-utils] Database error:', error);
      return { 
        success: false, 
        error: 'Failed to verify table. Please try again.' 
      };
    }

    if (!data) {
      return { 
        success: false, 
        error: 'Table not found. Please check the number and try again.' 
      };
    }

    // Generate a session ID for tracking
    const sessionId = generateSessionId();

    // Create or update the active session
    // The unique constraint on (table_id, session_id) means we can upsert
    const sessionData: ActiveSession = {
      table_id: data.id,
      session_id: sessionId,
      last_activity: new Date().toISOString(),
      metadata: {
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        timestamp: new Date().toISOString(),
        table_name: data.name,
        table_section: data.section
      }
    };

    const { error: sessionError } = await supabase
      .from('active_sessions')
      .upsert(sessionData, {
        onConflict: 'table_id,session_id',
        ignoreDuplicates: false
      });

    if (sessionError) {
      console.error('[table-utils] Session creation error:', sessionError);
      // Continue even if session creation fails - the table verification succeeded
    }

    // Store table ID in browser storage
    if (typeof window !== 'undefined') {
      console.log('[table-utils] Setting table_id in storage:', data.id);
      
      // Store in localStorage
      try {
        localStorage.setItem(TABLE_SESSION_STORAGE_KEY, data.id);
        localStorage.setItem(`${TABLE_SESSION_STORAGE_KEY}_session`, sessionId);
        localStorage.setItem(`${TABLE_SESSION_STORAGE_KEY}_table_name`, data.name);
        if (data.section) {
          localStorage.setItem(`${TABLE_SESSION_STORAGE_KEY}_table_section`, data.section);
        }
      } catch (e) {
        console.error('[table-utils] LocalStorage error:', e);
      }
      
      // Store as a cookie for server-side access
      const cookieValue = `${data.id}:${sessionId}`;
      document.cookie = `${TABLE_SESSION_COOKIE_NAME}=${cookieValue}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`;
    }

    return { 
      success: true, 
      table: data as Table 
    };
  } catch (err) {
    console.error('[table-utils] Unexpected error:', err);
    return { 
      success: false, 
      error: 'An unexpected error occurred. Please try again.' 
    };
  }
}

/**
 * Retrieves the current table ID from storage
 */
export function getStoredTableId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try localStorage first
    const tableId = localStorage.getItem(TABLE_SESSION_STORAGE_KEY);
    if (tableId) return tableId;
    
    // Fallback to cookie
    const cookies = document.cookie.split(';');
    const tableCookie = cookies.find(c => c.trim().startsWith(`${TABLE_SESSION_COOKIE_NAME}=`));
    if (tableCookie) {
      const [tableId] = tableCookie.split('=')[1].split(':');
      return tableId;
    }
  } catch (e) {
    console.error('[table-utils] Error reading storage:', e);
  }
  
  return null;
}

/**
 * Retrieves the full table session details from storage
 */
export function getStoredTableSession(): { 
  tableId: string; 
  sessionId?: string; 
  tableName?: string; 
  tableSection?: string;
} | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const tableId = localStorage.getItem(TABLE_SESSION_STORAGE_KEY);
    if (!tableId) return null;
    
    return {
      tableId,
      sessionId: localStorage.getItem(`${TABLE_SESSION_STORAGE_KEY}_session`) || undefined,
      tableName: localStorage.getItem(`${TABLE_SESSION_STORAGE_KEY}_table_name`) || undefined,
      tableSection: localStorage.getItem(`${TABLE_SESSION_STORAGE_KEY}_table_section`) || undefined
    };
  } catch (e) {
    console.error('[table-utils] Error reading session:', e);
  }
  
  return null;
}

/**
 * Clears the stored table session
 */
export function clearTableSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear all localStorage items
    localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
    localStorage.removeItem(`${TABLE_SESSION_STORAGE_KEY}_session`);
    localStorage.removeItem(`${TABLE_SESSION_STORAGE_KEY}_table_name`);
    localStorage.removeItem(`${TABLE_SESSION_STORAGE_KEY}_table_section`);
    
    // Clear cookie
    document.cookie = `${TABLE_SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch (e) {
    console.error('[table-utils] Error clearing storage:', e);
  }
}

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Updates the last activity timestamp for a session
 */
export async function updateSessionActivity(
  tableId: string,
  sessionId: string,
  supabase: SupabaseClientType
): Promise<void> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .update({ 
        last_activity: new Date().toISOString() 
      })
      .eq('table_id', tableId)
      .eq('session_id', sessionId);
    
    if (error) {
      console.error('[table-utils] Error updating session activity:', error);
    }
  } catch (err) {
    console.error('[table-utils] Unexpected error updating activity:', err);
  }
}
