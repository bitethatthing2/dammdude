"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { DeviceRegistrationInsert, DeviceRegistrationUpdate } from "@/lib/database.types";

interface RegisterDeviceParams {
  deviceId: string;
  type: 'staff' | 'customer'; // Define allowed types
  staffId?: string;  // Optional: Required if type is 'staff'
  tableId?: string;  // Optional: Required if type is 'customer'
  isPrimary?: boolean; // Optional: For staff primary device
}

interface RegisterDeviceResult {
  success: boolean;
  // Define a structure that can hold relevant error info from Supabase or validation
  error?: { message: string; details?: string; hint?: string; code?: string };
}

/**
 * Registers or updates a device in the database.
 * Performs an upsert based on the deviceId.
 * @param params - The device registration parameters.
 * @returns Object indicating success or failure, with error details if applicable.
 */
export async function registerDevice(params: RegisterDeviceParams): Promise<RegisterDeviceResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { deviceId, type, staffId, tableId, isPrimary } = params;

  // Basic validation
  if (!deviceId || !type) {
    console.error("Device registration failed: deviceId and type are required.");
    return { success: false, error: { message: "Device ID and type are required", details: "", hint: "", code: "INVALID_INPUT" } };
  }
  if (type === 'staff' && !staffId) {
     console.error("Device registration failed: staffId is required for staff type.");
    return { success: false, error: { message: "Staff ID is required for staff type registration", details: "", hint: "", code: "INVALID_INPUT" } };
  }
   if (type === 'customer' && !tableId) {
     console.error("Device registration failed: tableId is required for customer type.");
    return { success: false, error: { message: "Table ID is required for customer type registration", details: "", hint: "", code: "INVALID_INPUT" } };
  }

  const registrationData: DeviceRegistrationInsert | DeviceRegistrationUpdate = {
    device_id: deviceId,
    type: type,
    staff_id: type === 'staff' ? staffId : null,
    table_id: type === 'customer' ? tableId : null,
    is_primary: type === 'staff' ? isPrimary ?? null : null, // Only relevant for staff
    last_active: new Date().toISOString(),
  };

  console.log(`Attempting to register/update device: ${deviceId}, Type: ${type}`);

  const { error } = await supabase
    .from("device_registrations")
    .upsert(registrationData, { onConflict: 'device_id' }); // Upsert based on device_id constraint

  if (error) {
    console.error(`Error registering device ${deviceId}:`, error);
    // Pass the actual Supabase error object which structurally matches our defined type
    return { success: false, error };
  }

  console.log(`Successfully registered/updated device: ${deviceId}`);
  return { success: true, error: undefined };
}
