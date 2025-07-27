/**
 * Real-time Feed Hook
 * Handles real-time updates for the wolfpack feed without page refreshes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface VideoItem {
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
  title?: string;
  description?: string;
  duration?: number;
  view_count?: number;
  like_count?: number;
}

interface UseRealtimeFeedProps {
  userId?: string;
  initialVideos?: VideoItem[];
}

interface UseRealtimeFeedReturn {
  videos: VideoItem[];
  loading: boolean;
  error: string | null;
  addNewVideo: (video: VideoItem) => void;
  updateVideoStats: (videoId: string, updates: Partial<VideoItem>) => void;
  removeVideo: (videoId: string) => void;
  refreshFeed: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
}

export function useRealtimeFeed({ 
  userId,
  initialVideos = [] 
}: UseRealtimeFeedProps = {}): UseRealtimeFeedReturn {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Load initial feed data
  const loadFeed = useCallback(async (page = 1, limit = 20, append = false) => {
    try {
      console.log(`[FEED DEBUG] Starting loadFeed: page ${page}, append ${append}`);
      
      if (page === 1) setLoading(true);
      else setIsLoadingMore(true);

      const offset = (page - 1) * limit;

      console.log(`[FEED DEBUG] Loading feed: page ${page}, offset ${offset}, limit ${limit}`);

      // Fallback to table query until migrations are applied
      const { data: videoData, error: videoError } = await supabase
        .from('wolfpack_videos')
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
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (videoError) {
        console.error('Error loading videos:', videoError);
        if (page === 1) {
          // Follow guide's error handling patterns
          if (videoError.code === 'PGRST301') {
            setError('User not authenticated');
          } else if (videoError.message?.includes('wolfpack_status')) {
            setError('User not an active wolfpack member');
          } else {
            setError(`Failed to load feed: ${videoError.message}`);
          }
        }
        return;
      }

      console.log(`[FEED DEBUG] Loaded ${videoData?.length || 0} videos from database`);

      // Transform data to match VideoItem interface
      const transformedVideos: VideoItem[] = (videoData || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        username: post.user?.display_name || post.user?.username || 
                  `${post.user?.first_name || ''} ${post.user?.last_name || ''}`.trim() || 
                  'Anonymous',
        avatar_url: post.user?.profile_image_url || post.user?.avatar_url,
        caption: post.caption || post.description || post.title || '',
        video_url: post.video_url,
        thumbnail_url: post.thumbnail_url,
        created_at: post.created_at,
        likes_count: post.like_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: 0, // Not available in simple query
        music_name: 'Original Sound',
        hashtags: post.hashtags || [],
        title: post.title,
        description: post.description,
        duration: post.duration,
        view_count: post.view_count,
        like_count: post.like_count
      }));

      if (!mountedRef.current) return;

      console.log(`[FEED DEBUG] Setting videos: ${transformedVideos.length} items, append: ${append}`);

      if (append) {
        setVideos(prev => [...prev, ...transformedVideos]);
      } else {
        setVideos(transformedVideos);
      }

      // Update hasMore based on whether we got a full page
      setHasMore(transformedVideos.length === limit);
      setCurrentPage(page);
      setError(null);

    } catch (err: any) {
      console.error('Error in loadFeed:', err);
      if (page === 1) setError(err.message || 'Failed to load feed');
    } finally {
      if (mountedRef.current) {
        console.log(`[FEED DEBUG] Setting loading to false`);
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Set up real-time subscriptions - removed loadFeed dependency to prevent re-subscriptions
  useEffect(() => {
    if (!mountedRef.current) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Reset state when setting up fresh subscription
    setVideos([]);
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setHasMore(true);

    // Load initial data first, then set up real-time if possible
    loadFeed(1).catch(err => {
      console.error('Failed to load initial feed:', err);
      if (mountedRef.current) {
        setError('Failed to load feed');
        setLoading(false);
      }
    });

    // Create channel for real-time updates (optional)
    const channel = supabase
      .channel(`wolfpack_feed_updates_${Date.now()}`) // Unique channel name to prevent conflicts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_videos',
          filter: 'is_active=eq.true'
        },
        async (payload) => {
          console.log('New video inserted:', payload);
          
          // Fetch full post data from table
          const { data: newVideoData, error } = await supabase
            .from('wolfpack_videos')
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
            `)
            .eq('id', payload.new.id)
            .eq('is_active', true)
            .single();

          if (!error && newVideoData && mountedRef.current) {
            const transformedVideo: VideoItem = {
              id: newVideoData.id,
              user_id: newVideoData.user_id,
              username: newVideoData.user?.display_name || newVideoData.user?.username || 
                        `${newVideoData.user?.first_name || ''} ${newVideoData.user?.last_name || ''}`.trim() || 
                        'Anonymous',
              avatar_url: newVideoData.user?.profile_image_url || newVideoData.user?.avatar_url,
              caption: newVideoData.caption || newVideoData.description || newVideoData.title || '',
              video_url: newVideoData.video_url,
              thumbnail_url: newVideoData.thumbnail_url,
              created_at: newVideoData.created_at,
              likes_count: newVideoData.like_count || 0,
              comments_count: newVideoData.comments_count || 0,
              shares_count: 0, // Not available in simple query
              music_name: 'Original Sound',
              hashtags: newVideoData.hashtags || [],
              title: newVideoData.title,
              description: newVideoData.description,
              duration: newVideoData.duration,
              view_count: newVideoData.view_count,
              like_count: newVideoData.like_count
            };

            // Add to beginning of feed
            setVideos(prev => [transformedVideo, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wolfpack_videos'
        },
        (payload) => {
          console.log('Video updated:', payload);
          
          if (mountedRef.current) {
            setVideos(prev => prev.map(video => 
              video.id === payload.new.id 
                ? {
                    ...video,
                    likes_count: payload.new.like_count || video.likes_count,
                    comments_count: payload.new.comments_count !== undefined ? payload.new.comments_count : video.comments_count,
                    shares_count: 0, // shares_count not tracked in database yet
                    view_count: payload.new.view_count || video.view_count
                  }
                : video
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'wolfpack_videos'
        },
        (payload) => {
          console.log('Video deleted:', payload);
          
          if (mountedRef.current) {
            setVideos(prev => prev.filter(video => video.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIPTION_ERROR') {
          console.warn('Realtime subscription failed, continuing without real-time updates');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // Empty dependency array to only run once per mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Helper functions
  const addNewVideo = useCallback((video: VideoItem) => {
    if (!mountedRef.current) return;
    setVideos(prev => [video, ...prev]);
  }, []);

  const updateVideoStats = useCallback((videoId: string, updates: Partial<VideoItem>) => {
    if (!mountedRef.current) return;
    setVideos(prev => prev.map(video => 
      video.id === videoId ? { ...video, ...updates } : video
    ));
  }, []);

  const removeVideo = useCallback((videoId: string) => {
    if (!mountedRef.current) return;
    setVideos(prev => prev.filter(video => video.id !== videoId));
  }, []);

  const refreshFeed = useCallback(async () => {
    if (!mountedRef.current) return;
    
    // Reset state for fresh load
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    
    await loadFeed(1);
  }, [loadFeed]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await loadFeed(currentPage + 1, 20, true);
  }, [hasMore, isLoadingMore, currentPage, loadFeed]);

  return {
    videos,
    loading,
    error,
    addNewVideo,
    updateVideoStats,
    removeVideo,
    refreshFeed,
    hasMore,
    loadMore,
    isLoadingMore
  };
}