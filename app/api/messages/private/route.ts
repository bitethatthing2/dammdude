import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES } from '@/lib/services/wolfpack-backend.service';
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
    const { to_user_id, message, type = 'message' } = body;

    if (!to_user_id || !message) {
      return NextResponse.json(
        { error: 'Recipient and message required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (to_user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check if recipient exists and is in pack
    const recipientCheck = await WolfpackBackendService.queryOne(
      WOLFPACK_TABLES.WOLFPACK_MEMBERSHIPS,
      'id, user_id',
      { user_id: to_user_id, status: 'active' }
    );

    if (!recipientCheck.data) {
      return NextResponse.json(
        { error: 'Recipient not found in pack', code: 'USER_ERROR' },
        { status: 404 }
      );
    }

    // Check for blocks
    const blockCheck = await WolfpackBackendService.queryOne(
      WOLFPACK_TABLES.WOLF_INTERACTIONS,
      'id',
      {
        sender_id: to_user_id,
        receiver_id: user.id,
        interaction_type: 'block'
      }
    );

    if (blockCheck.data) {
      return NextResponse.json(
        { error: 'Message blocked by recipient', code: 'BLOCKED_ERROR' },
        { status: 403 }
      );
    }

    // Create message or interaction
    if (type === 'message') {
      const result = await WolfpackBackendService.insert(
        WOLFPACK_TABLES.WOLF_PRIVATE_MESSAGES,
        {
          from_user_id: user.id,
          to_user_id,
          message,
          is_read: false,
          created_at: new Date().toISOString()
        },
        'id, created_at'
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return NextResponse.json({
        success: true,
        message_id: result.data?.[0]?.id,
        created_at: result.data?.[0]?.created_at
      });

    } else {
      // Handle wink/hi interactions
      const result = await WolfpackBackendService.insert(
        WOLFPACK_TABLES.WOLF_INTERACTIONS,
        {
          sender_id: user.id,
          receiver_id: to_user_id,
          interaction_type: type,
          created_at: new Date().toISOString()
        },
        'id, created_at'
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return NextResponse.json({
        success: true,
        interaction_id: result.data?.[0]?.id,
        type,
        created_at: result.data?.[0]?.created_at
      });
    }

  } catch (error) {
    console.error('Private message error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'private_message'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}