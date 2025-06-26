import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES } from '@/lib/services/wolfpack-backend.service';
import { WolfpackAuthService } from '@/lib/services/wolfpack-auth.service';
import { WolfpackErrorHandler } from '@/lib/services/wolfpack-error.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, event_type, options, location_id, duration = 600 } = body;

    if (!title || !event_type || !location_id) {
      return NextResponse.json(
        { error: 'Title, event type, and location required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!['poll', 'contest'].includes(event_type)) {
      return NextResponse.json(
        { error: 'Event type must be poll or contest', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (event_type === 'poll' && (!options || options.length < 2)) {
      return NextResponse.json(
        { error: 'Polls require at least 2 options', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify DJ permissions
    const authResult = await WolfpackAuthService.verifyUser(user);
    if (!authResult.isVerified) {
      return NextResponse.json(
        { error: 'User verification failed', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

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

    // Create event
    const eventData = {
      dj_id: user.id,
      location_id,
      event_type,
      title,
      description: `Join this ${event_type} created by DJ ${WolfpackAuthService.getUserDisplayName(user)}!`,
      status: 'active',
      voting_ends_at: new Date(Date.now() + duration * 1000).toISOString(),
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      event_config: {
        duration,
        created_by: user.id
      },
      voting_format: event_type === 'poll' ? 'single_choice' : 'participant_vote',
      options: options || null
    };

    const result = await WolfpackBackendService.insert(
      WOLFPACK_TABLES.DJ_EVENTS,
      eventData,
      'id, created_at, voting_ends_at'
    );

    if (result.error) {
      throw new Error(result.error);
    }

    const eventId = result.data?.[0]?.id;

    // Create announcement in chat
    const displayName = WolfpackAuthService.getUserDisplayName(user);
    const announcementMessage = event_type === 'poll' 
      ? `🗳️ NEW POLL: ${title} - Vote now!`
      : `🏆 NEW CONTEST: ${title} - Join the competition!`;

    await WolfpackBackendService.insert(
      WOLFPACK_TABLES.WOLF_CHAT,
      {
        session_id: `location_${location_id}`,
        user_id: user.id,
        display_name: displayName,
        avatar_url: WolfpackAuthService.getUserAvatarUrl(user),
        content: announcementMessage,
        message_type: 'dj_broadcast',
        created_at: new Date().toISOString(),
        is_flagged: false
      }
    );

    return NextResponse.json({
      success: true,
      event_id: eventId,
      event_type,
      title,
      voting_ends_at: result.data?.[0]?.voting_ends_at,
      created_at: result.data?.[0]?.created_at,
      options: options || null
    });

  } catch (error) {
    console.error('DJ event creation error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'dj_event_creation'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}