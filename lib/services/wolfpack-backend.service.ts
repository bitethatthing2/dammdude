import { createClient } from '@/lib/supabase/client';
import { WolfpackErrorHandler } from './wolfpack-error.service';

const supabase = createClient();

// Standardized table names - consolidates scattered references
export const WOLFPACK_TABLES = {
  // Core tables
  USERS: 'users',
  LOCATIONS: 'locations',
  
  // Wolfpack specific tables
  WOLFPACK_MEMBERSHIPS: 'wolfpack_memberships',
  WOLF_PACK_MEMBERS: 'wolf_pack_members', // Legacy support
  WOLF_PROFILES: 'wolf_profiles',
  WOLF_CHAT: 'wolfpack_chat_messages',
  WOLF_REACTIONS: 'wolfpack_chat_reactions',
  WOLF_PRIVATE_MESSAGES: 'wolf_private_messages',
  WOLF_INTERACTIONS: 'wolf_pack_interactions',
  
  // DJ and events
  DJ_EVENTS: 'dj_events',
  DJ_EVENT_PARTICIPANTS: 'dj_event_participants',
  DJ_BROADCASTS: 'dj_broadcasts',
  
  // Unified view (if available)
  WOLFPACK_MEMBERS_UNIFIED: 'wolfpack_members_unified'
} as const;

// Standard query configurations
export const QUERY_CONFIGS = {
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 1000,
  DEFAULT_TIMEOUT: 10000,
  
  // Common select patterns
  MEMBER_SELECT: `
    *,
    user:users(
      id,
      email,
      first_name,
      last_name,
      role,
      avatar_url
    ),
    location:locations(
      id,
      name,
      address
    )
  `,
  
  PROFILE_SELECT: `
    *,
    wolf_profile:wolf_profiles(*)
  `,
  
  CHAT_MESSAGE_SELECT: `
    *,
    wolfpack_chat_reactions(
      id,
      message_id,
      user_id,
      emoji,
      created_at
    )
  `,
  
  EVENT_SELECT: `
    *,
    dj_event_participants(
      id,
      participant_id,
      joined_at
    )
  `
} as const;

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  timeout?: number;
}

export interface QueryResult<T> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

export interface SingleQueryResult<T> {
  data: T | null;
  error: string | null;
}

export class WolfpackBackendService {
  /**
   * Standardized query method with consistent error handling
   */
  static async query<T>(
    table: string,
    selectQuery: string = '*',
    filters: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      let query = supabase
        .from(table)
        .select(selectQuery, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.like(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply options
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }

      if (options.limit) {
        query = query.limit(Math.min(options.limit, QUERY_CONFIGS.MAX_LIMIT));
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || QUERY_CONFIGS.DEFAULT_LIMIT) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: `query_${table}`,
          additional: { filters, options }
        });
        return {
          data: null,
          error: userError.message,
          count: 0
        };
      }

      return {
        data: data as T[],
        error: null,
        count: count || 0
      };
    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: `query_${table}`
      });
      return {
        data: null,
        error: userError.message,
        count: 0
      };
    }
  }

  /**
   * Get single record with consistent error handling
   */
  static async queryOne<T>(
    table: string,
    selectQuery: string = '*',
    filters: Record<string, any> = {}
  ): Promise<SingleQueryResult<T>> {
    try {
      let query = supabase
        .from(table)
        .select(selectQuery);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.maybeSingle();

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: `query_one_${table}`,
          additional: { filters }
        });
        return {
          data: null,
          error: userError.message
        };
      }

      return {
        data: data as T,
        error: null
      };
    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: `query_one_${table}`
      });
      return {
        data: null,
        error: userError.message
      };
    }
  }

  /**
   * Insert with consistent error handling
   */
  static async insert<T>(
    table: string,
    data: Partial<T> | Partial<T>[],
    selectQuery?: string
  ): Promise<QueryResult<T>> {
    try {
      let query = supabase.from(table).insert(data);

      if (selectQuery) {
        query = query.select(selectQuery);
      }

      const { data: result, error } = await query;

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: `insert_${table}`,
          additional: { dataKeys: Array.isArray(data) ? data.map(d => Object.keys(d)) : Object.keys(data) }
        });
        return {
          data: null,
          error: userError.message
        };
      }

      return {
        data: result as T[],
        error: null
      };
    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: `insert_${table}`
      });
      return {
        data: null,
        error: userError.message
      };
    }
  }

  /**
   * Update with consistent error handling
   */
  static async update<T>(
    table: string,
    data: Partial<T>,
    filters: Record<string, any>,
    selectQuery?: string
  ): Promise<QueryResult<T>> {
    try {
      let query = supabase.from(table).update(data);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      if (selectQuery) {
        query = query.select(selectQuery);
      }

      const { data: result, error } = await query;

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: `update_${table}`,
          additional: { updateKeys: Object.keys(data), filters }
        });
        return {
          data: null,
          error: userError.message
        };
      }

      return {
        data: result as T[],
        error: null
      };
    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: `update_${table}`
      });
      return {
        data: null,
        error: userError.message
      };
    }
  }

  /**
   * Delete with consistent error handling
   */
  static async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let query = supabase.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { error } = await query;

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: `delete_${table}`,
          additional: { filters }
        });
        return {
          success: false,
          error: userError.message
        };
      }

      return { success: true };
    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: `delete_${table}`
      });
      return {
        success: false,
        error: userError.message
      };
    }
  }

  /**
   * Upsert with consistent error handling
   */
  static async upsert<T>(
    table: string,
    data: Partial<T> | Partial<T>[],
    conflictColumns?: string[],
    selectQuery?: string
  ): Promise<QueryResult<T>> {
    try {
      let query = supabase.from(table).upsert(data, {
        onConflict: conflictColumns?.join(',')
      });

      if (selectQuery) {
        query = query.select(selectQuery);
      }

      const { data: result, error } = await query;

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: `upsert_${table}`,
          additional: { conflictColumns }
        });
        return {
          data: null,
          error: userError.message
        };
      }

      return {
        data: result as T[],
        error: null
      };
    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: `upsert_${table}`
      });
      return {
        data: null,
        error: userError.message
      };
    }
  }

  /**
   * Call RPC function with consistent error handling
   */
  static async callRpc<T>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<SingleQueryResult<T>> {
    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: `rpc_${functionName}`,
          additional: { params }
        });
        return {
          data: null,
          error: userError.message
        };
      }

      return {
        data: data as T,
        error: null
      };
    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: `rpc_${functionName}`
      });
      return {
        data: null,
        error: userError.message
      };
    }
  }

  /**
   * Get active wolfpack members with standardized query
   */
  static async getActiveMembers(locationId: string) {
    return this.query(
      WOLFPACK_TABLES.WOLFPACK_MEMBERSHIPS,
      QUERY_CONFIGS.MEMBER_SELECT,
      {
        location_id: locationId,
        status: 'active'
      },
      {
        orderBy: 'joined_at',
        ascending: false,
        limit: QUERY_CONFIGS.DEFAULT_LIMIT
      }
    );
  }

  /**
   * Get chat messages with standardized query
   */
  static async getChatMessages(sessionId: string, limit = 100) {
    return this.query(
      WOLFPACK_TABLES.WOLF_CHAT,
      QUERY_CONFIGS.CHAT_MESSAGE_SELECT,
      {
        session_id: sessionId,
        is_deleted: false
      },
      {
        orderBy: 'created_at',
        ascending: true,
        limit
      }
    );
  }

  /**
   * Get active events with standardized query
   */
  static async getActiveEvents(locationId: string) {
    return this.query(
      WOLFPACK_TABLES.DJ_EVENTS,
      QUERY_CONFIGS.EVENT_SELECT,
      {
        location_id: locationId,
        status: 'active'
      },
      {
        orderBy: 'created_at',
        ascending: false
      }
    );
  }

  /**
   * Check table existence (for graceful degradation)
   */
  static async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      // If table doesn't exist, we'll get a specific error
      return !error || error.code !== '42P01';
    } catch {
      return false;
    }
  }

  /**
   * Get available tables for the current user
   */
  static async getAvailableTables(): Promise<string[]> {
    const tables = Object.values(WOLFPACK_TABLES);
    const availableTables: string[] = [];

    for (const table of tables) {
      const exists = await this.checkTableExists(table);
      if (exists) {
        availableTables.push(table);
      }
    }

    return availableTables;
  }

  /**
   * Health check for backend connectivity
   */
  static async healthCheck(): Promise<{
    connected: boolean;
    tablesAvailable: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const tablesAvailable: string[] = [];

    try {
      // Test basic connectivity
      const { error: authError } = await supabase.auth.getSession();
      if (authError) {
        errors.push(`Auth: ${authError.message}`);
      }

      // Check key tables
      const keyTables = [
        WOLFPACK_TABLES.USERS,
        WOLFPACK_TABLES.LOCATIONS,
        WOLFPACK_TABLES.WOLFPACK_MEMBERSHIPS
      ];

      for (const table of keyTables) {
        try {
          const exists = await this.checkTableExists(table);
          if (exists) {
            tablesAvailable.push(table);
          } else {
            errors.push(`Table not accessible: ${table}`);
          }
        } catch (error) {
          errors.push(`Table check failed: ${table}`);
        }
      }

      return {
        connected: errors.length === 0,
        tablesAvailable,
        errors
      };
    } catch (error) {
      return {
        connected: false,
        tablesAvailable: [],
        errors: ['Failed to connect to backend']
      };
    }
  }
}