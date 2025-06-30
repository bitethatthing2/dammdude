// app/api/wolfpack/leave/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDatabaseUserId } from '@/lib/utils/user-mapping';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    // Get database user ID
    const databaseUserId = await getDatabaseUserId(user.id);
    if (!databaseUserId) {
      return NextResponse.json(
        { error: 'User not found in database', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update user's wolfpack status to inactive
    const { error: leaveError } = await supabase
      .from('users')
      .update({
        wolfpack_status: 'inactive',
        is_wolfpack_member: false,
        last_activity: new Date().toISOString()
      })
      .eq('id', databaseUserId);

    if (leaveError) {
      console.error('Leave error:', leaveError);
      return NextResponse.json(
        { error: 'Failed to leave wolfpack', code: 'LEAVE_ERROR' },
        { status: 500 }
      );
    }

    // Update user status
    await supabase
      .from('users')
      .update({
        wolfpack_status: 'inactive'
      })
      .eq('id', databaseUserId);

    return NextResponse.json({
      success: true,
      message: 'Left wolfpack successfully'
    });

  } catch (error) {
    console.error('Leave wolfpack error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Also support POST method for consistency with other endpoints
export async function POST(request: NextRequest) {
  return DELETE(request);
}