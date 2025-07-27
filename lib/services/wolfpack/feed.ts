import { supabase } from '@/lib/supabase';
import { 
  FeedItem, 
  FetchFeedResponse, 
  EnrichedVideo, 
  ServiceResponse,
  PaginationOptions,
  WOLFPACK_TABLES 
} from './types';
import { 
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
  validatePagination,
  validateUUID 
} from './errors';
import { WolfpackAuthService } from './auth';

// =============================================================================
// WOLFPACK FEED SERVICE - CONSOLIDATED FEED FUNCTIONALITY
// =============================================================================

export class WolfpackFeedService {
  /**
   * Fetch general feed items (client-side) - Using optimized database function
   */
  static fetchFeedItems = withErrorHandling(async (
    options: PaginationOptions & { userId?: string; currentUserId?: string } = {}
  ): Promise<FetchFeedResponse> => {
    const { page, limit } = validatePagination(options.page, options.limit);
    const offset = (page - 1) * limit;

    // Fallback to table query until migrations are applied
    const { data, error, count } = await supabase
      .from(WOLFPACK_TABLES.VIDEOS)
      .select(`
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
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Transform the data to match FeedItem interface
    const items: FeedItem[] = (data || []).map((post) => ({
      id: post.id,
      user_id: post.user_id,
      username: post.display_name || post.username || 
               `${post.first_name || ''} ${post.last_name || ''}`.trim() || "Unknown",
      avatar_url: post.profile_image_url || post.avatar_url,
      caption: post.caption || post.description || post.title || "",
      video_url: post.video_url,
      thumbnail_url: post.thumbnail_url,
      likes_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      music_name: post.music_name || 'Original Sound',
      hashtags: post.hashtags || [],
      created_at: post.created_at,
      user: {
        id: post.user_id,
        username: post.username,
        display_name: post.display_name,
        first_name: post.first_name,
        last_name: post.last_name,
        avatar_url: post.avatar_url,
        profile_image_url: post.profile_image_url,
        wolf_emoji: post.wolf_emoji,
        // These are already computed by the database function
        user_liked: post.user_liked,
        user_following: post.user_following
      },
    }));

    // For user-specific feeds, filter after fetching if needed
    if (options.userId && options.userId !== options.currentUserId) {
      const filteredItems = items.filter(item => item.user_id === options.userId);
      return {
        items: filteredItems,
        totalItems: filteredItems.length,
        hasMore: false, // Simple implementation for now
      };
    }

    const totalItems = count || data?.length || 0;
    const hasMore = offset + limit < totalItems;

    return {
      items,
      totalItems,
      hasMore,
    };
  }, 'WolfpackFeedService.fetchFeedItems');

  /**
   * Fetch following feed - Use this from server actions/components only
   */
  static fetchFollowingFeed = withErrorHandling(async (
    currentUserId: string,
    options: PaginationOptions = {}
  ): Promise<FetchFeedResponse> => {
    validateUUID(currentUserId, 'Current User ID');
    const { page, limit } = validatePagination(options.page, options.limit);
    const offset = (page - 1) * limit;

    // Use the optimized RPC function with following_only flag
    const { data, error, count } = await supabase
      .rpc('get_wolfpack_feed_optimized', {
        p_user_id: currentUserId,
        p_limit: limit,
        p_offset: offset,
        p_following_only: true
      }, { count: 'exact' });

    if (error) throw error;

    // Transform the data
    const items: FeedItem[] = (data || []).map((post) => ({
      id: post.id,
      user_id: post.user_id,
      username: post.display_name || post.username || 
               `${post.first_name || ''} ${post.last_name || ''}`.trim() || "Unknown",
      avatar_url: post.profile_image_url || post.avatar_url,
      caption: post.caption || post.description || post.title || "",
      video_url: post.video_url,
      thumbnail_url: post.thumbnail_url,
      likes_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      music_name: post.music_name || 'Original Sound',
      hashtags: post.hashtags || [],
      created_at: post.created_at,
      user: {
        id: post.user_id,
        username: post.username,
        display_name: post.display_name,
        first_name: post.first_name,
        last_name: post.last_name,
        avatar_url: post.avatar_url,
        profile_image_url: post.profile_image_url,
        wolf_emoji: post.wolf_emoji,
        user_liked: post.user_liked,
        user_following: true // Always true for following feed
      },
    }));

    const totalItems = count || data?.length || 0;
    const hasMore = offset + limit < totalItems;

    return {
      items,
      totalItems,
      hasMore,
    };
  }, 'WolfpackFeedService.fetchFollowingFeed');

  /**
   * Fetch feed using cursor-based pagination (more efficient for large datasets)
   */
  static fetchFeedWithCursor = withErrorHandling(async (
    options: { cursor?: string; limit?: number; currentUserId?: string; followingOnly?: boolean } = {}
  ): Promise<FetchFeedResponse> => {
    const { limit = 20, currentUserId, followingOnly = false } = options;
    
    let cursorTimestamp = null;
    let cursorId = null;
    
    // Parse cursor if provided (simple base64 decode for timestamp:id format)
    if (options.cursor) {
      try {
        const decoded = atob(options.cursor);
        const [timestamp, id] = decoded.split(':');
        cursorTimestamp = timestamp;
        cursorId = id;
      } catch (error) {
        console.warn('Invalid cursor provided, starting from beginning:', error);
      }
    }

    // Use the cursor-based RPC function
    const { data, error } = await supabase
      .rpc('get_wolfpack_feed_cursor', {
        p_user_id: currentUserId || null,
        p_limit: limit,
        p_cursor: cursorTimestamp,
        p_cursor_id: cursorId,
        p_following_only: followingOnly
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }

    // Transform the data to match FeedItem interface
    const items: FeedItem[] = data.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      username: post.display_name || post.username || 
               `${post.first_name || ''} ${post.last_name || ''}`.trim() || "Unknown",
      avatar_url: post.profile_image_url || post.avatar_url,
      caption: post.caption || post.description || post.title || "",
      video_url: post.video_url,
      thumbnail_url: post.thumbnail_url,
      likes_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      music_name: post.music_name || 'Original Sound',
      hashtags: post.hashtags || [],
      created_at: post.created_at,
      user: {
        id: post.user_id,
        username: post.username,
        display_name: post.display_name,
        first_name: post.first_name,
        last_name: post.last_name,
        avatar_url: post.avatar_url,
        profile_image_url: post.profile_image_url,
        wolf_emoji: post.wolf_emoji,
        user_liked: post.user_liked,
        user_following: post.user_following
      },
    }));

    // Check if there's a next page and encode cursor
    const hasMore = data.length > 0 && data[0].next_cursor !== null;
    let nextCursor: string | undefined;
    
    if (hasMore && data[0].next_cursor && data[0].next_cursor_id) {
      // Simple base64 encode for timestamp:id format
      nextCursor = btoa(`${data[0].next_cursor}:${data[0].next_cursor_id}`);
    }

    return {
      items,
      totalItems: items.length, // Cursor pagination doesn't provide total count efficiently
      hasMore,
      nextCursor,
    };
  }, 'WolfpackFeedService.fetchFeedWithCursor');

  /**
   * Get single video post with enriched data
   */
  static getPost = withErrorHandling(async (postId: string): Promise<EnrichedVideo | null> => {
    validateUUID(postId, 'Post ID');

    const { data, error } = await supabase
      .from(WOLFPACK_TABLES.VIDEOS)
      .select(`
        *,
        user:users!user_id(
          id,
          first_name,
          last_name,
          avatar_url,
          display_name
        )
      `)
      .eq('id', postId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as EnrichedVideo;
  }, 'WolfpackFeedService.getPost');

  /**
   * Create new video post
   */
  static createPost = withErrorHandling(async (postData: {
    title?: string;
    description?: string;
    caption?: string;
    video_url?: string;
    thumbnail_url?: string;
    duration?: number;
  }): Promise<ServiceResponse<EnrichedVideo>> => {
    try {
      const user = await WolfpackAuthService.verifyUser();

      const insertData = {
        user_id: user.id,
        title: postData.title || null,
        description: postData.description || null,
        caption: postData.caption || postData.description || postData.title || null,
        video_url: postData.video_url || null,
        thumbnail_url: postData.thumbnail_url || null,
        duration: postData.duration || null,
        is_active: true,
        view_count: 0,
        like_count: 0,
      };

      const { data, error } = await supabase
        .from(WOLFPACK_TABLES.VIDEOS)
        .insert(insertData)
        .select(`
          *,
          user:users!user_id(
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .single();

      if (error) throw error;

      return createSuccessResponse(data as EnrichedVideo);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, 'WolfpackFeedService.createPost');

  /**
   * Update video post
   */
  static updatePost = withErrorHandling(async (
    postId: string,
    updates: {
      title?: string;
      description?: string;
      caption?: string;
      thumbnail_url?: string;
    }
  ): Promise<ServiceResponse<EnrichedVideo>> => {
    try {
      validateUUID(postId, 'Post ID');
      const user = await WolfpackAuthService.verifyUser();

      const { data, error } = await supabase
        .from(WOLFPACK_TABLES.VIDEOS)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', user.id)
        .select(`
          *,
          user:users!user_id(
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .single();

      if (error) throw error;

      return createSuccessResponse(data as EnrichedVideo);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, 'WolfpackFeedService.updatePost');

  /**
   * Delete video post (soft delete)
   */
  static deletePost = withErrorHandling(async (postId: string): Promise<ServiceResponse<void>> => {
    try {
      validateUUID(postId, 'Post ID');
      const user = await WolfpackAuthService.verifyUser();

      const { error } = await supabase
        .from(WOLFPACK_TABLES.VIDEOS)
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, 'WolfpackFeedService.deletePost');

  /**
   * Increment view count for a post
   */
  static incrementViewCount = withErrorHandling(async (postId: string): Promise<void> => {
    validateUUID(postId, 'Post ID');

    const { error } = await supabase
      .from(WOLFPACK_TABLES.VIDEOS)
      .update({
        view_count: supabase.raw("view_count + 1"),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      // Don't throw error for view count failures as it's not critical
      console.warn('Failed to increment view count:', error);
    }
  }, 'WolfpackFeedService.incrementViewCount');

  /**
   * Get post statistics
   */
  static getPostStats = withErrorHandling(async (postId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
  }> => {
    validateUUID(postId, 'Post ID');

    // Get post basic stats
    const { data: post, error: postError } = await supabase
      .from(WOLFPACK_TABLES.VIDEOS)
      .select('view_count, like_count')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    // Get comment count
    const { count: commentCount, error: commentError } = await supabase
      .from(WOLFPACK_TABLES.COMMENTS)
      .select('*', { count: 'exact', head: true })
      .eq('video_id', postId);

    if (commentError) {
      console.warn('Failed to fetch comment count:', commentError);
    }

    return {
      views: post.view_count || 0,
      likes: post.like_count || 0,
      comments: commentCount || 0,
    };
  }, 'WolfpackFeedService.getPostStats');

  /**
   * Get user's posts
   */
  static getUserPosts = withErrorHandling(async (
    userId: string,
    options: PaginationOptions = {}
  ): Promise<FetchFeedResponse> => {
    return this.fetchFeedItems({ ...options, userId });
  }, 'WolfpackFeedService.getUserPosts');

  /**
   * Search posts by caption or hashtags
   */
  static searchPosts = withErrorHandling(async (
    query: string,
    options: PaginationOptions = {}
  ): Promise<FetchFeedResponse> => {
    const { page, limit } = validatePagination(options.page, options.limit);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from(WOLFPACK_TABLES.VIDEOS)
      .select(`
        *,
        user:users!user_id(
          id,
          username,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .or(`caption.ilike.%${query}%,description.ilike.%${query}%,title.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const items: FeedItem[] = (data || []).map((post) => ({
      id: post.id,
      user_id: post.user_id,
      username: WolfpackAuthService.getUserDisplayName(post.user || {}),
      avatar_url: post.user?.profile_image_url || post.user?.avatar_url,
      caption: post.caption || post.description || post.title || "",
      video_url: post.video_url,
      thumbnail_url: post.thumbnail_url,
      likes_count: post.like_count || 0,
      comments_count: 0, // Would need separate query
      shares_count: 0,
      music_name: 'Original Sound',
      hashtags: post.hashtags || [],
      created_at: post.created_at,
      user: post.user,
    }));

    return {
      items,
      totalItems: count || 0,
      hasMore: offset + limit < (count || 0),
    };
  }, 'WolfpackFeedService.searchPosts');
}