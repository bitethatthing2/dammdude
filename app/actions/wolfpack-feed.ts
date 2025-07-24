"use server";

import { createClient } from "@/lib/supabase/server";

export interface FeedItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null;
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  music_name?: string;
  hashtags?: string[];
  created_at: string;
  // Additional user fields now available
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    profile_image_url?: string;
    wolf_emoji?: string;
  };
}

export interface FetchFeedResponse {
  items: FeedItem[];
  totalItems: number;
  hasMore: boolean;
}

export async function fetchFeedItems(
  page: number = 1,
  limit: number = 10,
  userId?: string,
): Promise<FetchFeedResponse> {
  const supabase = await createClient();

  try {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("wolfpack_videos")
      .select(
        `
        *,
        user:users!user_id(
          id,
          username,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url,
          wolf_emoji
        ),
        likes:wolfpack_post_likes(count),
        comments:wolfpack_comments(count)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add user filter if provided
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching feed items:", error);
      throw error;
    }

    // Transform the data to match FeedItem interface
    const items: FeedItem[] = (data || []).map((post) => ({
      id: post.id,
      user_id: post.user_id,
      username: post.user?.display_name || post.user?.username || 
               `${post.user?.first_name || ''} ${post.user?.last_name || ''}`.trim() || "Unknown",
      avatar_url: post.user?.profile_image_url || post.user?.avatar_url,
      caption: post.caption || post.content || "",
      video_url: post.video_url,
      thumbnail_url: post.thumbnail_url || post.image_url,
      likes_count: post.likes_count || post.likes?.[0]?.count || 0,
      comments_count: post.comments_count || post.comments?.[0]?.count || 0,
      shares_count: post.shares_count || 0,
      music_name: post.music_name,
      hashtags: post.hashtags || [],
      created_at: post.created_at,
      user: post.user,
    }));

    const totalItems = count || 0;
    const hasMore = offset + limit < totalItems;

    return {
      items,
      totalItems,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to fetch feed items:", error);
    return {
      items: [],
      totalItems: 0,
      hasMore: false,
    };
  }
}

export async function fetchFollowingFeed(
  page: number = 1,
  limit: number = 10,
  currentUserId: string,
): Promise<FetchFeedResponse> {
  const supabase = await createClient();

  try {
    // First get the users that the current user follows
    const { data: following } = await supabase
      .from("wolfpack_follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (!following || following.length === 0) {
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }

    const followingIds = following.map((f) => f.following_id);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get wolfpack_posts from followed users
    const { data, error, count } = await supabase
      .from("wolfpack_videos")
      .select(
        `
        *,
        user:users!user_id(
          id,
          username,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url,
          wolf_emoji
        ),
        likes:wolfpack_post_likes(count),
        comments:wolfpack_comments(count)
      `,
        { count: "exact" },
      )
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching following feed:", error);
      throw error;
    }

    // Transform the data
    const items: FeedItem[] = (data || []).map((post) => ({
      id: post.id,
      user_id: post.user_id,
      username: post.user?.display_name || post.user?.username || 
               `${post.user?.first_name || ''} ${post.user?.last_name || ''}`.trim() || "Unknown",
      avatar_url: post.user?.profile_image_url || post.user?.avatar_url,
      caption: post.caption || post.content || "",
      video_url: post.video_url,
      thumbnail_url: post.thumbnail_url || post.image_url,
      likes_count: post.likes_count || post.likes?.[0]?.count || 0,
      comments_count: post.comments_count || post.comments?.[0]?.count || 0,
      shares_count: post.shares_count || 0,
      music_name: post.music_name,
      hashtags: post.hashtags || [],
      created_at: post.created_at,
      user: post.user,
    }));

    const totalItems = count || 0;
    const hasMore = offset + limit < totalItems;

    return {
      items,
      totalItems,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to fetch following feed:", error);
    return {
      items: [],
      totalItems: 0,
      hasMore: false,
    };
  }
}
