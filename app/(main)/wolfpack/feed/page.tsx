'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { supabase } from '@/lib/supabase/client';
import TikTokStyleFeed from '@/components/wolfpack/feed/TikTokStyleFeed';
import { PostCreator } from '@/components/wolfpack/PostCreator';
import { Loader2, Shield, Sparkles, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchFeedItems, fetchFollowingFeed, type FeedItem } from '@/app/actions/wolfpack-feed';

interface VideoItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null; // Can be null for image posts
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  music_name?: string;
  hashtags?: string[];
  created_at: string;
  // Additional fields from database
  title?: string;
  description?: string;
  duration?: number;
  view_count?: number;
  like_count?: number;
}

export default function WolfpackFeedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isMember: isInPack, isLoading: packLoading } = useConsistentWolfpackAccess();
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedType, setFeedType] = useState<'forYou' | 'following'>('forYou');

  // Load video content
  useEffect(() => {
    const loadVideos = async () => {
      if (!isInPack) return;
      
      try {
        // Load video posts (fallback to sample data if table doesn't exist)
        let videoData = [];
        try {
          // Check if wolfpack_videos table exists by attempting a simple query
          const { data: basicData, error: basicError } = await supabase
            .from('wolfpack_videos')
            .select('*')
            .limit(1);

          if (basicError?.code === '42P01') {
            // Table does not exist - skip to sample data
            console.log('wolfpack_videos table does not exist, using sample data');
            videoData = [];
          } else if (basicError) {
            // Other error - log and use sample data
            console.log('wolfpack_videos table not accessible:', basicError);
            videoData = [];
          } else {
            // Table exists, fetch actual data
            const { data: fullData, error: fullError } = await supabase
              .from('wolfpack_videos')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20);

            if (fullError) {
              console.log('Error fetching wolfpack_videos:', fullError);
              videoData = [];
            } else if (fullData) {
              // Enrich with user data
              const videoPromises = fullData.map(async (video) => {
                try {
                  if (!video.user_id) {
                    return {
                      ...video,
                      users: null
                    };
                  }
                  
                  const { data: userData } = await supabase
                    .from('users')
                    .select('first_name, last_name, avatar_url')
                    .eq('id', video.user_id)
                    .single();
                  
                  return {
                    ...video,
                    users: userData || null
                  };
                } catch (userError) {
                  console.warn('Could not fetch user data for video:', video.id);
                  return {
                    ...video,
                    users: null
                  };
                }
              });

              videoData = await Promise.all(videoPromises);
            }
          }
        } catch (error) {
          console.log('Unexpected error with wolfpack_videos, using sample data:', error);
          videoData = [];
        }

        // Transform data into video format
        const transformedVideos: VideoItem[] = [];

        // Add real video posts
        videoData?.forEach(video => {
          transformedVideos.push({
            id: video.id,
            user_id: video.user_id,
            username: `${video.users?.first_name || ''} ${video.users?.last_name || ''}`.trim() || 'Anonymous',
            avatar_url: video.users?.avatar_url,
            caption: video.caption || video.description || video.title || '',
            video_url: video.video_url,
            thumbnail_url: video.thumbnail_url,
            created_at: video.created_at,
            likes_count: video.like_count || 0,
            comments_count: video.comments_count || 0,
            shares_count: 0, // Not in database schema
            music_name: 'Original Sound',
            hashtags: [],
            title: video.title,
            description: video.description,
            duration: video.duration,
            view_count: video.view_count,
            like_count: video.like_count
          });
        });

        // Add sample videos if no real data exists
        if (transformedVideos.length === 0) {
          const sampleVideos: VideoItem[] = [
            {
              id: 'sample-1',
              user_id: 'sample-user-1',
              username: 'Side Hustle Bar',
              avatar_url: '/icons/wolf-icon.png',
              caption: 'Salem\'s premier gastropub featuring craft cocktails, gourmet burgers, and live entertainment. 🍻✨',
              video_url: null, // No video available
              thumbnail_url: '/images/entertainment-hero.jpg',
              created_at: new Date().toISOString(),
              likes_count: 147,
              comments_count: 23,
              shares_count: 8,
              music_name: 'Original Sound',
              hashtags: ['sidehustle', 'salem', 'wolfpack', 'food', 'drinks']
            },
            {
              id: 'sample-2',
              user_id: 'sample-user-2',
              username: 'WolfpackMember',
              avatar_url: '/icons/WOLFPACK-PAW.png',
              caption: 'Amazing night at Side Hustle! The energy is unmatched 🔥 #WolfpackLife',
              video_url: null, // No video available
              thumbnail_url: '/drink-menu-images/margarita-boards.png',
              created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
              likes_count: 92,
              comments_count: 15,
              shares_count: 5,
              music_name: 'Trending Sound',
              hashtags: ['wolfpack', 'nightlife', 'vibes', 'salem']
            }
          ];
          transformedVideos.push(...sampleVideos);
        }

        // Sort by created_at descending
        transformedVideos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setVideos(transformedVideos);
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [isInPack]);

  const handleLike = async (videoId: string) => {
    console.log('Like video:', videoId);
    // TODO: Implement like functionality
  };

  const handleComment = async (videoId: string) => {
    console.log('Comment on video:', videoId);
    // TODO: Implement comment functionality
  };

  const handleShare = async (videoId: string) => {
    console.log('Share video:', videoId);
    // TODO: Implement share functionality
  };

  const handleFollow = async (userId: string) => {
    console.log('Follow user:', userId);
    // TODO: Implement follow functionality
  };

  const handleDelete = async (videoId: string) => {
    if (!user) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('wolfpack_videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
        return;
      }

      // Remove from local state
      setVideos(prevVideos => prevVideos.filter(v => v.id !== videoId));
      
      console.log('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  // Handle loading more videos for infinite scroll
  const handleLoadMore = useCallback(async (): Promise<VideoItem[]> => {
    if (!user || isLoadingMore || !hasMore) return [];

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      let response;

      if (feedType === 'following') {
        response = await fetchFollowingFeed(nextPage, 10, user.id);
      } else {
        response = await fetchFeedItems(nextPage, 10);
      }

      if (response.items.length > 0) {
        const newVideos: VideoItem[] = response.items.map(item => ({
          id: item.id,
          user_id: item.user_id,
          username: item.username,
          avatar_url: item.avatar_url,
          caption: item.caption,
          video_url: item.video_url,
          thumbnail_url: item.thumbnail_url,
          likes_count: item.likes_count,
          comments_count: item.comments_count,
          shares_count: item.shares_count,
          music_name: item.music_name,
          hashtags: item.hashtags,
          created_at: item.created_at
        }));

        setCurrentPage(nextPage);
        setHasMore(response.hasMore);
        setVideos(prevVideos => [...prevVideos, ...newVideos]);
        
        return newVideos;
      } else {
        setHasMore(false);
        return [];
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
      return [];
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, currentPage, feedType, hasMore, isLoadingMore]);


  const isLoadingAll = authLoading || packLoading;

  if (isLoadingAll) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-gray-300">Loading Wolf Pack...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700 max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-4">Please login to access Wolf Pack features.</p>
            <Button onClick={() => router.push('/login')} className="w-full bg-blue-600 hover:bg-blue-700">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInPack) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700 max-w-md">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Join the Wolf Pack</h2>
            <p className="text-gray-400 mb-4">You need to be at Side Hustle Bar to join the pack</p>
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <MapPin className="h-4 w-4" />
              <span>Location verification required</span>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={() => router.push('/wolfpack/welcome')}
            >
              Enable Location & Join Pack
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-gray-300">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TikTokStyleFeed
        videos={videos}
        currentUser={user}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onFollow={handleFollow}
        onDelete={handleDelete}
        onCreatePost={() => setShowPostCreator(true)}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={isLoadingMore}
      />
      
      <PostCreator
        isOpen={showPostCreator}
        onClose={() => setShowPostCreator(false)}
      />
    </>
  );
}