// app/api/wolfpack/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDatabaseUserId } from '@/lib/utils/user-mapping';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        success: true,
        isMember: false,
        membership: null,
        location: null,
        databaseUserId: null
      });
    }

    // Check current membership
    const { data: membership, error: membershipError } = await supabase
      .from('users')
      .select(`
        *,
        locations (
          id,
          name,
          address,
          city,
          state
        )
      `)
      .eq('user_id', databaseUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Membership error:', membershipError);
      return NextResponse.json(
        { error: 'Failed to check membership', code: 'MEMBERSHIP_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isMember: !!membership,
      membership: membership || null,
      location: membership?.locations || null,
      databaseUserId: databaseUserId
    });

  } catch (error) {
    console.error('Get wolfpack status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}