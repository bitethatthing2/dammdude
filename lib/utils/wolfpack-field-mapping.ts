// Auto-generated wolfpack type mappings
// Maps database fields to component interface fields

export const WOLFPACK_FIELD_MAPPING = {
  // wolfpack_members_unified table mappings
  database: {
    emoji: 'wolf_emoji',           // emoji -> wolf_emoji
    current_vibe: 'vibe_status',   // current_vibe -> vibe_status
    last_active: 'last_seen_at',   // last_active -> last_seen_at
  },
  
  // Fields that don't exist in wolfpack_members_unified
  missing_fields: [
    'bio',               // Use wolf_profiles table
    'is_visible',        // Use status field
    'allow_messages',    // Use wolf_profiles table
    'phone'             // Use wolf_profiles table
  ],
  
  // Recommended approach: Use wolf_profiles for detailed profile data
  // Use wolfpack_members_unified for membership/location data
};

export function transformDatabaseToInterface(dbRow: any) {
  return {
    id: dbRow.id,
    user_id: dbRow.user_id,
    display_name: dbRow.display_name,
    wolf_emoji: dbRow.emoji,
    vibe_status: dbRow.current_vibe,
    bio: null, // Not in wolfpack_members_unified
    is_visible: dbRow.status === 'active',
    allow_messages: true, // Default value
    location_permissions_granted: true,
    last_active: dbRow.last_active,
    avatar_url: dbRow.avatar_url,
    instagram_handle: dbRow.instagram_handle,
    looking_for: dbRow.looking_for,
    favorite_drink: dbRow.favorite_drink,
    location_id: dbRow.location_id,
    status: dbRow.status,
    joined_at: dbRow.joined_at
  };
}
