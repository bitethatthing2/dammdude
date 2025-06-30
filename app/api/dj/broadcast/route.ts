import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES, WolfpackErrorHandler } from '@/lib/services/wolfpack-backend.service';
import { WolfpackAuthService } from '@/lib/services/wolfpack-auth.service';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface BroadcastRequest {
  message: string;
  location_id: string;
  broadcast_type?: 'announcement' | 'howl_request' | 'contest_announcement' | 'song_request' | 'general';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
}

interface UserData {
  id: string;
  role: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email: string;
}

interface BroadcastData {
  id: string;
  dj_id: string;
  location_id: string;
  message: string;
  broadcast_type: string;
  created_at: string;
}

interface ChatData {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  content: string;
  message_type: string;
  created_at: string;
  is_flagged: boolean;
  is_deleted: boolean;
}

interface BroadcastResponse {
  success: true;
  broadcast_id: string;
  chat_message_id: string | null;
  created_at: string;
  message: string;
  broadcast_type: string;
  expires_at?: string;
}

interface ErrorResponse {
  error: string;
  code: string;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const VALID_BROADCAST_TYPES = [
  'announcement', 
  'howl_request', 
  'contest_announcement', 
  'song_request', 
  'general'
] as const;

const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

function validateBroadcastType(type: string): type is typeof VALID_BROADCAST_TYPES[number] {
  return VALID_BROADCAST_TYPES.includes(type as typeof VALID_BROADCAST_TYPES[number]);
}

function validatePriority(priority: string): priority is typeof VALID_PRIORITIES[number] {
  return VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number]);
}

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function sanitizeMessage(message: string): string {
  return message
    .trim()
    .slice(0, 1000) // Max 1000 characters for broadcasts
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/\s+/g, ' '); // Normalize whitespace
}

function validateExpiryTime(expiresAt: string): boolean {
  try {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const maxExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    return expiryDate > now && expiryDate <= maxExpiry;
  } catch {
    return false;
  }
}

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

async function authenticateUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  return user;
}

async function verifyDJPermissions(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<UserData> {
  // Verify user through auth service
  const authResult = await WolfpackAuthService.verifyUser({ id: userId } as any);
  if (!authResult.isVerified) {
    throw new Error('User verification failed');
  }

  // Get user data with proper typing
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, role, display_name, first_name, last_name, avatar_url, email')
    .eq('id', userId)
    .single();

  if (error || !userData) {
    throw new Error('User data not found');
  }

  const typedUserData = userData as UserData;
  const isDJ = typedUserData.role === 'dj' || 
               typedUserData.role === 'admin' || 
               authResult.isVipUser;

  if (!isDJ) {
    throw new Error('DJ permissions required');
  }

  return typedUserData;
}

// =============================================================================
// BUSINESS LOGIC
// =============================================================================

function generateChatMessage(message: string, broadcastType: string, djName: string): string {
  const typeEmojis: Record<string, string> = {
    announcement: '📢',
    howl_request: '🐺',
    contest_announcement: '🏆',
    song_request: '🎵',
    general: '🎧'
  };

  const emoji = typeEmojis[broadcastType] || '🎧';
  
  switch (broadcastType) {
    case 'howl_request':
      return `${emoji} DJ ${djName} wants to hear your HOWL! ${message}`;
    case 'contest_announcement':
      return `${emoji} CONTEST ALERT from DJ ${djName}: ${message}`;
    case 'song_request':
      return `${emoji} DJ ${djName} is taking requests: ${message}`;
    case 'announcement':
      return `${emoji} DJ ANNOUNCEMENT from ${djName}: ${message}`;
    default:
      return `${emoji} DJ ${djName}: ${message}`;
  }
}

async function createBroadcast(
  userId: string, 
  locationId: string, 
  message: string, 
  broadcastType: string,
  expiresAt?: string
): Promise<BroadcastData> {
  const broadcastData = {
    dj_id: userId,
    location_id: locationId,
    message: sanitizeMessage(message),
    broadcast_type: broadcastType,
    created_at: new Date().toISOString(),
    expires_at: expiresAt || null
  };

  const result = await WolfpackBackendService.insert(
    WOLFPACK_TABLES.DJ_BROADCASTS,
    broadcastData,
    '*'
  );

  if (result.error || !result.data?.[0]) {
    throw new Error(`Failed to create broadcast: ${result.error}`);
  }

  return result.data[0] as BroadcastData;
}

async function createChatMessage(
  userId: string,
  locationId: string,
  message: string,
  broadcastType: string,
  djName: string,
  avatarUrl?: string
): Promise<ChatData | null> {
  try {
    const chatMessage = generateChatMessage(message, broadcastType, djName);
    
    const chatData = {
      session_id: `location_${locationId}`,
      user_id: userId,
      display_name: djName,
      avatar_url: avatarUrl || null,
      content: chatMessage,
      message_type: 'dj_broadcast',
      created_at: new Date().toISOString(),
      is_flagged: false,
      is_deleted: false
    };

    const result = await WolfpackBackendService.insert(
      WOLFPACK_TABLES.WOLF_CHAT,
      chatData,
      '*'
    );

    if (result.error || !result.data?.[0]) {
      console.warn('Failed to create chat message:', result.error);
      return null;
    }

    return result.data[0] as ChatData;
  } catch (error) {
    console.warn('Error creating chat message:', error);
    return null;
  }
}

async function validateLocationAccess(supabase: Awaited<ReturnType<typeof createClient>>, locationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, is_active')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_active === true;
  } catch {
    return false;
  }
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_BROADCASTS_PER_MINUTE = 5;
const broadcastHistory = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userHistory = broadcastHistory.get(userId) || [];
  
  // Remove timestamps older than the window
  const recentBroadcasts = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Update the history
  broadcastHistory.set(userId, recentBroadcasts);
  
  return recentBroadcasts.length < MAX_BROADCASTS_PER_MINUTE;
}

function recordBroadcast(userId: string): void {
  const now = Date.now();
  const userHistory = broadcastHistory.get(userId) || [];
  userHistory.push(now);
  broadcastHistory.set(userId, userHistory);
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<BroadcastResponse | ErrorResponse>> {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const user = await authenticateUser(supabase);
    
    // 2. Rate limiting check
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 broadcasts per minute.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }
    
    // 3. Parse and validate request body
    const body = await request.json() as BroadcastRequest;
    const { 
      message, 
      location_id, 
      broadcast_type = 'general',
      priority = 'normal',
      expires_at
    } = body;

    // 4. Input validation
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (message.trim().length < 3) {
      return NextResponse.json(
        { error: 'Message must be at least 3 characters long', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!location_id?.trim()) {
      return NextResponse.json(
        { error: 'Location ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!validateUUID(location_id)) {
      return NextResponse.json(
        { error: 'Invalid location ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!validateBroadcastType(broadcast_type)) {
      return NextResponse.json(
        { error: `Broadcast type must be one of: ${VALID_BROADCAST_TYPES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!validatePriority(priority)) {
      return NextResponse.json(
        { error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (expires_at && !validateExpiryTime(expires_at)) {
      return NextResponse.json(
        { error: 'Expiry time must be in the future and within 24 hours', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 5. Authorization
    const userData = await verifyDJPermissions(supabase, user.id);

    // 6. Validate location access
    const hasLocationAccess = await validateLocationAccess(supabase, location_id);
    if (!hasLocationAccess) {
      return NextResponse.json(
        { error: 'Location not found or inactive', code: 'LOCATION_ERROR' },
        { status: 404 }
      );
    }

    // 7. Get DJ display name
    const djDisplayName = WolfpackAuthService.getUserDisplayName(user) || 
                         userData.display_name || 
                         `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 
                         userData.email.split('@')[0] || 
                         'DJ';

    // 8. Create broadcast record
    const broadcastRecord = await createBroadcast(
      user.id, 
      location_id, 
      message, 
      broadcast_type,
      expires_at
    );

    // 9. Create chat message (non-blocking)
    const chatRecord = await createChatMessage(
      user.id,
      location_id,
      message,
      broadcast_type,
      djDisplayName,
      WolfpackAuthService.getUserAvatarUrl(user) || userData.avatar_url
    );

    // 10. Record broadcast for rate limiting
    recordBroadcast(user.id);

    // 11. Return success response
    return NextResponse.json({
      success: true,
      broadcast_id: broadcastRecord.id,
      chat_message_id: chatRecord?.id || null,
      created_at: broadcastRecord.created_at,
      message: broadcastRecord.message,
      broadcast_type: broadcastRecord.broadcast_type,
      ...(expires_at && { expires_at })
    });

  } catch (error) {
    console.error('DJ broadcast error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
      
      if (error.message === 'User verification failed') {
        return NextResponse.json(
          { error: 'User verification failed', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
      
      if (error.message === 'DJ permissions required') {
        return NextResponse.json(
          { error: 'DJ permissions required', code: 'PERMISSION_ERROR' },
          { status: 403 }
        );
      }

      if (error.message === 'User data not found') {
        return NextResponse.json(
          { error: 'User profile not found', code: 'USER_ERROR' },
          { status: 404 }
        );
      }
    }

    // Handle Supabase errors
    const userError = WolfpackErrorHandler.handleSupabaseError(error as any, {
      operation: 'dj_broadcast'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET BROADCASTS (Optional endpoint for fetching recent broadcasts)
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Authentication
    const user = await authenticateUser(supabase);

    if (!locationId || !validateUUID(locationId)) {
      return NextResponse.json(
        { error: 'Valid location ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get recent broadcasts
    const { data: broadcasts, error } = await supabase
      .from('dj_broadcasts')
      .select(`
        id,
        message,
        broadcast_type,
        created_at,
        expires_at,
        users:dj_id (
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('location_id', locationId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50)); // Cap at 50

    if (error) {
      throw error;
    }

    return NextResponse.json({
      broadcasts: broadcasts || [],
      total: broadcasts?.length || 0
    });

  } catch (error) {
    console.error('Get broadcasts error:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch broadcasts', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}