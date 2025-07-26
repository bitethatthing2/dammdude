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
      if (page === 1) setLoading(true);
      else setIsLoadingMore(true);

      const offset = (page - 1) * limit;

      // First check if we have any data at all
      const { count } = await supabase
        .from('wolfpack_videos')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // If offset is beyond available data, set hasMore to false and return empty
      if (count !== null && offset >= count) {
        if (!mountedRef.current) return;
        setHasMore(false);
        if (page === 1) setVideos([]);
        return;
      }

      // Query videos with user data
      const { data: videoData, error: videoError } = await supabase
        .from('wolfpack_videos')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (videoError) {
        console.error('Error loading videos:', videoError);
        if (page === 1) setError('Failed to load feed');
        return;
      }

      // Transform data
      const transformedVideos: VideoItem[] = (videoData || []).map(video => ({
        id: video.id,
        user_id: video.user_id,
        username: video.users?.display_name || 
                  `${video.users?.first_name || ''} ${video.users?.last_name || ''}`.trim() || 
                  'Anonymous',
        avatar_url: video.users?.avatar_url,
        caption: video.description || video.title || '',
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        created_at: video.created_at,
        likes_count: video.like_count || 0,
        comments_count: video.comments_count || 0,
        shares_count: 0, // shares_count not tracked in database yet
        music_name: 'Original Sound',
        hashtags: video.hashtags || [],
        title: video.title,
        description: video.description,
        duration: video.duration,
        view_count: video.view_count,
        like_count: video.like_count
      }));

      if (!mountedRef.current) return;

      if (append) {
        setVideos(prev => [...prev, ...transformedVideos]);
      } else {
        setVideos(transformedVideos);
      }

      // Update hasMore based on whether we got a full page and there's more data
      const totalFetched = page === 1 ? transformedVideos.length : offset + transformedVideos.length;
      setHasMore(transformedVideos.length === limit && (count === null || totalFetched < count));
      setCurrentPage(page);
      setError(null);

    } catch (err: any) {
      console.error('Error in loadFeed:', err);
      if (page === 1) setError(err.message || 'Failed to load feed');
    } finally {
      if (mountedRef.current) {
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

    // Create channel for real-time updates
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
          
          // Fetch full video data with user info
          const { data: newVideoData, error } = await supabase
            .from('wolfpack_videos')
            .select(`
              *,
              users:user_id (
                first_name,
                last_name,
                avatar_url,
                display_name
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && newVideoData && mountedRef.current) {
            const transformedVideo: VideoItem = {
              id: newVideoData.id,
              user_id: newVideoData.user_id,
              username: newVideoData.users?.display_name || 
                        `${newVideoData.users?.first_name || ''} ${newVideoData.users?.last_name || ''}`.trim() || 
                        'Anonymous',
              avatar_url: newVideoData.users?.avatar_url,
              caption: newVideoData.description || newVideoData.title || '',
              video_url: newVideoData.video_url,
              thumbnail_url: newVideoData.thumbnail_url,
              created_at: newVideoData.created_at,
              likes_count: newVideoData.like_count || 0,
              comments_count: newVideoData.comments_count || 0,
              shares_count: 0, // shares_count not tracked in database yet
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
                    comments_count: payload.new.comments_count || video.comments_count,
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
      .subscribe();

    channelRef.current = channel;

    // Load initial data immediately
    loadFeed(1).catch(err => {
      console.error('Failed to load initial feed:', err);
      if (mountedRef.current) {
        setError('Failed to load feed');
        setLoading(false);
      }
    });

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