import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackMembershipService } from '@/lib/services/wolfpack-membership.service';
import { WolfpackLocationService } from '@/lib/services/wolfpack-location.service';
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
    const { location_id, latitude, longitude, profile_data } = body;

    // Verify user authentication
    const authResult = await WolfpackAuthService.verifyUser(user);
    if (!authResult.isVerified) {
      return NextResponse.json(
        { error: authResult.error || 'User verification failed', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    // Location verification for non-VIP users
    if (!authResult.isVipUser) {
      if (!latitude || !longitude) {
        return NextResponse.json(
          { error: 'Location coordinates required', code: 'LOCATION_ERROR' },
          { status: 400 }
        );
      }

      const locationResult = await WolfpackLocationService.verifyUserLocation();
      if (!locationResult.isAtLocation) {
        return NextResponse.json(
          { 
            error: 'Not within bar proximity', 
            code: 'LOCATION_ERROR',
            details: { distance: locationResult.distance }
          },
          { status: 403 }
        );
      }
    }

    // Join the pack
    const joinData = {
      display_name: profile_data?.display_name || WolfpackAuthService.getUserDisplayName(user),
      emoji: profile_data?.emoji || '🐺',
      current_vibe: profile_data?.current_vibe || 'Ready to party!',
      favorite_drink: profile_data?.favorite_drink,
      looking_for: profile_data?.looking_for,
      instagram_handle: profile_data?.instagram_handle,
      table_location: profile_data?.table_location,
      latitude,
      longitude
    };

    const result = await WolfpackMembershipService.joinPack(user, joinData, location_id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to join pack', code: 'JOIN_ERROR' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      pack_member_id: result.membershipId,
      data: result.data
    });

  } catch (error) {
    console.error('Join wolfpack error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'join_wolfpack'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}