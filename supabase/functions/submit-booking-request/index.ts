import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define types
type BookingType = 'Table' | 'Party' | 'Catering';

interface BookingRequest {
  name: string;
  contact_info: string;
  requested_date: string;
  requested_time: string;
  party_size: number;
  booking_type: BookingType;
  notes?: string;
  location_id: 'salem' | 'portland';
  status?: 'pending' | 'confirmed' | 'rejected';
}

// Error responses
const errorResponse = (message: string, status = 400) => {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
};

// Validate the booking request
function validateBookingRequest(data: any): { valid: boolean; error?: string } {
  if (!data) return { valid: false, error: "Missing request data" };
  
  // Required fields
  const requiredFields = [
    "name",
    "contact_info",
    "requested_date",
    "requested_time",
    "party_size",
    "booking_type",
    "location_id",
  ];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Type validations
  if (typeof data.party_size !== "number" || data.party_size < 1) {
    return { valid: false, error: "Invalid party size" };
  }
  
  if (!["Table", "Party", "Catering"].includes(data.booking_type)) {
    return { valid: false, error: "Invalid booking type" };
  }
  
  if (!["salem", "portland"].includes(data.location_id)) {
    return { valid: false, error: "Invalid location" };
  }
  
  // Date validation
  try {
    const date = new Date(data.requested_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return { valid: false, error: "Cannot book dates in the past" };
    }
  } catch (e) {
    return { valid: false, error: "Invalid date format" };
  }
  
  return { valid: true };
}

serve(async (req) => {
  try {
    // Handle CORS for OPTIONS requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
    
    // Only accept POST requests
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }
    
    // Parse request data
    let data: BookingRequest;
    try {
      data = await req.json();
    } catch (error) {
      return errorResponse("Invalid JSON", 400);
    }
    
    // Validate request data
    const validation = validateBookingRequest(data);
    if (!validation.valid) {
      return errorResponse(validation.error || "Invalid request data", 400);
    }
    
    // Create a Supabase client with the service role key (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    // Prepare booking data with default status
    const bookingData: BookingRequest = {
      ...data,
      status: "pending",
      notes: data.notes || null, // Convert empty string to null
    };
    
    // Insert booking request into database
    const { data: insertedData, error } = await supabaseAdmin
      .from("booking_requests")
      .insert(bookingData)
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting booking request:", error);
      return errorResponse("Failed to save booking request", 500);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking request submitted successfully",
        data: insertedData,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
});