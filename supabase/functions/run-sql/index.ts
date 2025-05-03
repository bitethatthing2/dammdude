import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types for SQL request
interface SqlRequest {
  query: string;
  params?: any[];
}

// Response types
interface SqlSuccess {
  data: any;
  error: null;
}

interface SqlError {
  data: null;
  error: {
    message: string;
    details?: string;
  };
}

type SqlResponse = SqlSuccess | SqlError;

// Helper function to validate SQL query
function validateSqlQuery(query: string): boolean {
  // Disallow destructive operations for safety
  const disallowedPatterns = [
    /DROP\s+(?:TABLE|DATABASE|SCHEMA)/i,
    /DELETE\s+FROM/i,
    /TRUNCATE\s+TABLE/i,
    /ALTER\s+(?:TABLE|DATABASE)/i,
    /CREATE\s+(?:TABLE|DATABASE|SCHEMA)/i,
  ];

  return !disallowedPatterns.some(pattern => pattern.test(query));
}

serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // Parse request
    const { query, params = [] } = await req.json() as SqlRequest;

    // Validate query
    if (!query) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { message: "Missing SQL query" },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Safety check
    if (!validateSqlQuery(query)) {
      return new Response(
        JSON.stringify({
          data: null,
          error: {
            message: "Disallowed SQL operation",
            details: "The query contains potentially destructive operations that are not permitted",
          },
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Execute the query
    const { data, error } = await supabaseClient.rpc('run_sql_query', {
      sql_query: query,
      query_params: params
    });

    // Return response
    const response: SqlResponse = error
      ? { data: null, error: { message: error.message, details: error.details } }
      : { data, error: null };

    return new Response(JSON.stringify(response), {
      status: error ? 400 : 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (err) {
    console.error("Error processing request:", err);
    
    return new Response(
      JSON.stringify({
        data: null,
        error: {
          message: "Internal server error",
          details: err instanceof Error ? err.message : String(err),
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});