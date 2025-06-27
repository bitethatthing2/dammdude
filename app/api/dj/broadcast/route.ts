import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES } from '@/lib/services/wolfpack-backend.service';
import { WolfpackAuthService } from '@/lib/services/wolfpack-auth.service';
import { WolfpackErrorHandler } from '@/lib/services/wolfpack-error.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, location_id } = body;

    if (!message || !location_id) {
      return NextResponse.json(
        { error: 'Message and location required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify user is authenticated and get role
    const authResult = await WolfpackAuthService.verifyUser(user);
    if (!authResult.isVerified) {
      return NextResponse.json(
        { error: 'User verification failed', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    // Check if user is DJ or admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isDJ = userData?.role === 'dj' || userData?.role === 'admin' || authResult.isVipUser;

    if (!isDJ) {
      return NextResponse.json(
        { error: 'DJ permissions required', code: 'PERMISSION_ERROR' },
        { status: 403 }
      );
    }

    // Create DJ broadcast message
    const broadcastData = {
      dj_id: user.id,
      location_id,
      message,
      broadcast_type: 'announcement',
      created_at: new Date().toISOString()
    };
    
    const broadcastResult = await WolfpackBackendService.insert(
      WOLFPACK_TABLES.DJ_BROADCASTS,
      broadcastData,
      '*'
    );

    if (broadcastResult.error) {
      throw new Error(broadcastResult.error);
    }

    // Also create a chat message for immediate display
    const displayName = WolfpackAuthService.getUserDisplayName(user);
    const chatData = {
      session_id: `location_${location_id}`,
      user_id: user.id,
      display_name: displayName,
      avatar_url: WolfpackAuthService.getUserAvatarUrl(user),
      content: `🎵 DJ ANNOUNCEMENT: ${message}`,
      message_type: 'dj_broadcast',
      created_at: new Date().toISOString(),
      is_flagged: false
    };
    
    const chatResult = await WolfpackBackendService.insert(
      WOLFPACK_TABLES.WOLF_CHAT,
      chatData,
      '*'
    );

    const broadcastRecord = broadcastResult.data?.[0];
    const chatRecord = chatResult.data?.[0];
    
    return NextResponse.json({
      success: true,
      broadcast_id: (broadcastRecord as any)?.id || null,
      chat_message_id: (chatRecord as any)?.id || null,
      created_at: (broadcastRecord as any)?.created_at || new Date().toISOString()
    });

  } catch (error) {
    console.error('DJ broadcast error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'dj_broadcast'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}