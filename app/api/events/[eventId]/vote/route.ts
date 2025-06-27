import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES } from '@/lib/services/wolfpack-backend.service';
import { WolfpackAuthService } from '@/lib/services/wolfpack-auth.service';
import { WolfpackErrorHandler } from '@/lib/services/wolfpack-error.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const { eventId } = params;
    const body = await request.json();
    const { option, vote_value } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const authResult = await WolfpackAuthService.verifyUser(user);
    if (!authResult.isVerified) {
      return NextResponse.json(
        { error: 'User verification failed', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    // Get event details
    const eventResult = await WolfpackBackendService.queryOne(
      WOLFPACK_TABLES.DJ_EVENTS,
      '*',
      { id: eventId }
    );

    if (eventResult.error || !eventResult.data) {
      return NextResponse.json(
        { error: 'Event not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const event = eventResult.data as any; // Type assertion to handle dynamic event properties

    // Check if event is still active
    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'Event is no longer active', code: 'EVENT_INACTIVE' },
        { status: 400 }
      );
    }

    // Check if voting period has ended
    if (event.voting_ends_at && new Date(event.voting_ends_at) < new Date()) {
      return NextResponse.json(
        { error: 'Voting period has ended', code: 'VOTING_ENDED' },
        { status: 400 }
      );
    }

    // Validate vote based on event type
    if (event.event_type === 'poll') {
      if (!option) {
        return NextResponse.json(
          { error: 'Poll option is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      const validOptions = event.options || [];
      if (!validOptions.includes(option)) {
        return NextResponse.json(
          { error: 'Invalid poll option', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    } else if (event.event_type === 'contest') {
      if (vote_value === undefined || vote_value < 1 || vote_value > 10) {
        return NextResponse.json(
          { error: 'Contest vote must be between 1-10', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    // Check if user has already voted
    const existingVoteResult = await WolfpackBackendService.query(
      'wolf_pack_votes',
      '*',
      { event_id: eventId, voter_id: user.id }
    );

    if (existingVoteResult.data && existingVoteResult.data.length > 0) {
      return NextResponse.json(
        { error: 'You have already voted on this event', code: 'ALREADY_VOTED' },
        { status: 400 }
      );
    }

    // Create the vote
    const voteData = {
      event_id: eventId,
      voter_id: user.id,
      contest_id: null, // For DJ events, not contests
      participant_id: null,
      voted_for_id: option || null, // Store option in voted_for_id field
      created_at: new Date().toISOString()
    };

    const voteResult = await WolfpackBackendService.insert(
      'wolf_pack_votes',
      voteData,
      '*'
    );

    if (voteResult.error) {
      throw new Error(voteResult.error);
    }

    // Get updated vote counts using type assertion
    const voteCountsResult = await (supabase as any)
      .from('wolf_pack_votes')
      .select('voted_for_id')
      .eq('event_id', eventId);

    let voteCounts = {};
    if (voteCountsResult.data) {
      if (event.event_type === 'poll') {
        // Count votes per option
        voteCounts = voteCountsResult.data.reduce((acc: Record<string, number>, vote: any) => {
          if (vote.voted_for_id) {
            acc[vote.voted_for_id] = (acc[vote.voted_for_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
      } else if (event.event_type === 'contest') {
        // For contests, just count total votes
        const totalVotes = voteCountsResult.data.length;
        voteCounts = {
          total_votes: totalVotes,
          average_rating: 0 // Wolf pack votes don't have numeric ratings
        };
      }
    }

    // Send confirmation message to chat
    const displayName = WolfpackAuthService.getUserDisplayName(user);
    const confirmationMessage = event.event_type === 'poll' 
      ? `${displayName} voted on: ${event.title}`
      : `${displayName} rated: ${event.title} (${vote_value}/10)`;

    await WolfpackBackendService.insert(
      WOLFPACK_TABLES.WOLF_CHAT,
      {
        session_id: `location_${event.location_id}`,
        user_id: user.id,
        display_name: displayName,
        avatar_url: WolfpackAuthService.getUserAvatarUrl(user),
        content: confirmationMessage,
        message_type: 'text',
        created_at: new Date().toISOString(),
        is_flagged: false
      }
    );

    return NextResponse.json({
      success: true,
      vote_id: (voteResult.data?.[0] as any)?.id || crypto.randomUUID(),
      event_id: eventId,
      vote_option: option || null,
      vote_value: vote_value || null,
      vote_counts: voteCounts,
      created_at: (voteResult.data?.[0] as any)?.created_at
    });

  } catch (error) {
    console.error('Event voting error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'event_voting'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const { eventId } = params;

    // Get event details and vote counts
    const [eventResult, voteCountsResult] = await Promise.all([
      WolfpackBackendService.queryOne(WOLFPACK_TABLES.DJ_EVENTS, '*', { id: eventId }),
      (supabase as any)
        .from('wolf_pack_votes')
        .select('voted_for_id, voter_id')
        .eq('event_id', eventId)
    ]);

    if (eventResult.error || !eventResult.data) {
      return NextResponse.json(
        { error: 'Event not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const event = eventResult.data as any; // Type assertion to handle dynamic event properties
    const votes = voteCountsResult.data || [];

    // Check if current user has voted
    const userVote = votes.find((vote: any) => vote.voter_id === user.id);

    let voteCounts = {};
    if (event.event_type === 'poll') {
      // Count votes per option
      voteCounts = votes.reduce((acc: Record<string, number>, vote: any) => {
        if (vote.voted_for_id) {
          acc[vote.voted_for_id] = (acc[vote.voted_for_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    } else if (event.event_type === 'contest') {
      // For contests, just count total votes
      const totalVotes = votes.length;
      voteCounts = {
        total_votes: totalVotes,
        average_rating: 0 // Wolf pack votes don't have numeric ratings
      };
    }

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        status: event.status,
        voting_ends_at: event.voting_ends_at,
        options: event.options || null
      },
      vote_counts: voteCounts,
      user_vote: userVote ? {
        vote_option: userVote.voted_for_id,
        vote_value: null // Wolf pack votes don't have numeric values
      } : null,
      has_voted: !!userVote
    });

  } catch (error) {
    console.error('Get event votes error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'get_event_votes'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}