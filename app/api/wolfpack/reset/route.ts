import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES, WolfpackErrorHandler } from '@/lib/services/wolfpack-backend.service';

// Daily reset endpoint - typically called by a cron job at 2:30 AM
export async function POST(request: NextRequest) {
  try {
    // Verify admin access or cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'wolfpack-reset-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      // Try admin user verification
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized access', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required', code: 'PERMISSION_ERROR' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { location_id, reset_type = 'daily' } = body;

    const resetTimestamp = new Date().toISOString();
    const results: Array<{ operation: string; success: boolean; error?: string; affected_rows?: number }> = [];

    // If specific location provided, reset only that location
    const locationFilter = location_id ? { location_id } : {};

    // Archive old chat sessions (keep them for history)
    const chatArchiveResult = await WolfpackBackendService.update(
      WOLFPACK_TABLES.WOLF_CHAT,
      {
        ...locationFilter,
        created_at: `lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}` // Older than 24 hours
      },
      { is_archived: true }
    );
    
    results.push({
      operation: 'archive_old_chat',
      success: !chatArchiveResult.error,
      error: chatArchiveResult.error || undefined,
      affected_rows: chatArchiveResult.data?.length || 0
    });

    // Reset wolfpack memberships to inactive (but don't delete them)
    const membershipResetResult = await WolfpackBackendService.update(
      WOLFPACK_TABLES.wolf-pack-memberships,
      {
        ...locationFilter,
        status: 'active'
      },
      { 
        status: 'inactive',
        last_active: resetTimestamp
      }
    );
    
    results.push({
      operation: 'reset_memberships',
      success: !membershipResetResult.error,
      error: membershipResetResult.error || undefined,
      affected_rows: membershipResetResult.data?.length || 0
    });

    // End active DJ events
    const eventsResetResult = await WolfpackBackendService.update(
      WOLFPACK_TABLES.DJ_EVENTS,
      {
        ...locationFilter,
        status: 'active'
      },
      { 
        status: 'ended',
        ended_at: resetTimestamp
      }
    );
    
    results.push({
      operation: 'end_dj_events',
      success: !eventsResetResult.error,
      error: eventsResetResult.error || undefined,
      affected_rows: eventsResetResult.data?.length || 0
    });

    // Clear old reactions (older than 7 days)
    const reactionsCleanupResult = await WolfpackBackendService.delete(
      WOLFPACK_TABLES.WOLF_REACTIONS,
      {
        created_at: `lt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`
      }
    );
    
    results.push({
      operation: 'cleanup_old_reactions',
      success: reactionsCleanupResult.success,
      error: reactionsCleanupResult.error,
      affected_rows: (reactionsCleanupResult as any).deletedCount || 0
    });

    // Create system reset announcement
    const resetMessage = location_id 
      ? `🌅 Good morning! The Wolf Pack has been reset for a new day at this location.`
      : `🌅 Good morning! All Wolf Packs have been reset for a new day. Join your pack to get started!`;

    // Get all locations to reset if no specific location
    let locationsToReset = [];
    if (location_id) {
      locationsToReset = [{ id: location_id }];
    } else {
      const { data: locations } = await (WolfpackBackendService as any).select('locations', {});
      locationsToReset = locations || [];
    }

    // Send reset announcements to each location
    for (const location of locationsToReset) {
      await WolfpackBackendService.insert(
        WOLFPACK_TABLES.WOLF_CHAT,
        {
          session_id: `location_${location.id}`,
          id: '00000000-0000-0000-0000-000000000000', // System user
          display_name: 'Wolf Pack System',
          avatar_url: null,
          content: resetMessage,
          message_type: 'dj_broadcast',
          created_at: resetTimestamp,
          is_flagged: false
        }
      );
    }

    results.push({
      operation: 'send_reset_announcements',
      success: true,
      affected_rows: locationsToReset.length
    });

    // Calculate summary
    const totalOperations = results.length;
    const successfulOperations = results.filter(r => r.success).length;
    const totalAffectedRows = results.reduce((sum, r) => sum + (r.affected_rows || 0), 0);

    return NextResponse.json({
      success: successfulOperations === totalOperations,
      reset_type,
      location_id: location_id || 'all',
      reset_timestamp: resetTimestamp,
      summary: {
        total_operations: totalOperations,
        successful_operations: successfulOperations,
        total_affected_rows: totalAffectedRows
      },
      operations: results
    });

  } catch (error) {
    console.error('Daily reset error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'daily_reset'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Get reset status and next scheduled reset
export async function GET() {
  try {
    const now = new Date();
    const nextReset = new Date();
    
    // Calculate next 2:30 AM
    nextReset.setHours(2, 30, 0, 0);
    if (nextReset <= now) {
      nextReset.setDate(nextReset.getDate() + 1);
    }

    // Get last reset info from system messages
    const supabase = await createClient();
    const { data: lastResetMessage } = await supabase
      .from(WOLFPACK_TABLES.WOLF_CHAT)
      .select('created_at, content')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .eq('message_type', 'dj_broadcast')
      .like('content', '%Wolf Pack has been reset%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      current_time: now.toISOString(),
      next_reset: nextReset.toISOString(),
      time_until_reset: Math.max(0, nextReset.getTime() - now.getTime()),
      last_reset: lastResetMessage?.created_at || null,
      reset_schedule: {
        time: '02:30:00',
        timezone: 'America/Los_Angeles', // Pacific Time
        frequency: 'daily'
      }
    });

  } catch (error) {
    console.error('Get reset status error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get reset status', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}