import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count } = body;
    
    // Use admin client to bypass RLS
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('wolfpack_videos')
      .insert({
        user_id,
        title,
        description,
        video_url,
        thumbnail_url,
        duration,
        view_count: view_count || 0,
        like_count: like_count || 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating video post:', error);
      return NextResponse.json(
        { error: 'Failed to create video post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Unexpected error in video post creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}