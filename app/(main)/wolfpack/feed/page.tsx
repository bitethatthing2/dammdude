'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { useRealtimeFeed } from '@/lib/hooks/useRealtimeFeed';
import { useOptimisticActions } from '@/lib/hooks/useOptimisticActions';
import TikTokStyleFeed from '@/components/wolfpack/feed/TikTokStyleFeed';
import { PostCreator } from '@/components/wolfpack/PostCreator';
import ShareModal from '@/components/wolfpack/ShareModal';
import { AuthLinkHelper } from '@/components/auth/AuthLinkHelper';
import { Loader2, Shield, Sparkles, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { deletePost } from '@/lib/database/posts';

export default function OptimizedWolfpackFeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isMember: isInPack, isLoading: packLoading } = useConsistentWolfpackAccess();

  // Add a key to force remount when user changes
  const feedKey = user?.id || 'no-user';
  
  // Real-time feed hook
  const {
    videos,
    loading: feedLoading,
    error: feedError,
    addNewVideo,
    updateVideoStats,
    removeVideo,
    refreshFeed,
    hasMore,
    loadMore,
    isLoadingMore
  } = useRealtimeFeed({ userId: user?.id });

  // Optimistic actions hook
  const {
    handleLike,
    handleFollow,
    handleCommentSubmit,
    getOptimisticVideoState,
    getOptimisticFollowState
  } = useOptimisticActions({ 
    userId: user?.id, 
    onUpdateVideoStats: updateVideoStats 
  });

  const [showPostCreator, setShowPostCreator] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareVideoData, setShareVideoData] = useState<{ id: string; caption?: string; username?: string } | null>(null);

  // Check if camera should be opened on mount
  useEffect(() => {
    const shouldOpenCamera = searchParams.get('camera') === 'true';
    if (shouldOpenCamera && isInPack && user) {
      setShowPostCreator(true);
      // Clean URL without reload
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('camera');
      const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, isInPack, user]);

  // Handle like with optimistic updates
  const handleVideoLike = useCallback(async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const optimisticState = getOptimisticVideoState(videoId, video.likes_count, video.comments_count);
    const isCurrentlyLiked = optimisticState.isLiked ?? false;
    const currentCount = optimisticState.likes_count;

    await handleLike(videoId, currentCount, isCurrentlyLiked);
  }, [videos, handleLike, getOptimisticVideoState]);

  // Handle comment (just opens modal for now)
  const handleComment = useCallback((videoId: string) => {
    // This will be handled by the VideoComments component
    console.log('Opening comments for video:', videoId);
  }, []);

  // Handle share
  const handleShare = useCallback((videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setShareVideoData({
        id: videoId,
        caption: video.caption,
        username: video.username
      });
      setShowShareModal(true);
    }
  }, [videos]);

  // Handle follow with optimistic updates
  const handleUserFollow = useCallback(async (targetUserId: string) => {
    const isCurrentlyFollowed = getOptimisticFollowState(targetUserId) ?? false;
    await handleFollow(targetUserId, isCurrentlyFollowed);
  }, [handleFollow, getOptimisticFollowState]);

  // Handle delete
  const handleDelete = useCallback(async (videoId: string) => {
    if (!user) return;
    
    const video = videos.find(v => v.id === videoId);
    if (!video || video.user_id !== user.id) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own posts",
        variant: "destructive"
      });
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      // Optimistically remove from UI
      removeVideo(videoId);

      // Delete from database using proper deletePost function
      const result = await deletePost(videoId);

      if (!result) {
        // Revert optimistic update
        await refreshFeed();
        throw new Error('Failed to delete post');
      }

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, videos, removeVideo, refreshFeed]);

  // Handle post creation success
  const handlePostCreated = useCallback((newPost: unknown) => {
    // The real-time subscription will automatically add the new post
    // Just show a success message
    toast({
      title: "Post created!",
      description: "Your post has been shared with the Wolf Pack"
    });
    
    // Close the modal
    setShowPostCreator(false);
  }, []);

  // Loading states
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-red-900/20" />
          <div className="absolute top-10 left-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-700/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl p-8 text-center border border-red-500/30 shadow-2xl shadow-red-900/20 max-w-md w-full">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-900/50">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="text-red-500 text-sm font-bold tracking-wider uppercase">Wolf Pack</div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-white">Authentication Required</h2>
          <p className="mb-6 text-gray-300 leading-relaxed">Please login to access Wolf Pack features and join the pack.</p>
          
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-900/50 active:scale-95"
          >
            🐺 Login to Continue
          </button>
          
          <div className="mt-6 pt-6 border-t border-red-500/20">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Salem Wolf Pack • Side Hustle Bar</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isInPack) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-red-900/20" />
          <div className="absolute top-10 left-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl p-8 text-center border border-red-500/30 shadow-2xl shadow-red-900/20 max-w-md w-full">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-900/50">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="text-red-500 text-sm font-bold tracking-wider uppercase">Wolf Pack</div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-white">Join the Wolf Pack</h2>
          <p className="mb-4 text-gray-300 leading-relaxed">You need to be at Side Hustle Bar to join the pack</p>
          
          <div className="flex items-center justify-center gap-2 text-red-400 mb-6 bg-red-900/20 rounded-lg p-3">
            <MapPin className="h-5 w-5" />
            <span className="text-sm font-medium">Location verification required</span>
          </div>
          
          <button 
            onClick={() => router.push('/wolfpack')}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-900/50 active:scale-95"
          >
            📍 Enable Location & Join Pack
          </button>
          
          <div className="mt-6 pt-6 border-t border-red-500/20">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Salem Wolf Pack • Side Hustle Bar</p>
          </div>
        </div>
      </div>
    );
  }

  if (feedLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-gray-300">Loading feed...</p>
          <p className="text-xs text-gray-500">Connected to Wolf Pack database</p>
        </div>
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{feedError}</p>
          <button 
            onClick={refreshFeed}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no videos
  if (!feedLoading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-900/50">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Welcome to the Pack!</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Be the first to share something with the Wolf Pack! Create a post to get the feed started.
          </p>
          <button 
            onClick={() => setShowPostCreator(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-900/50 active:scale-95"
          >
            🎬 Create First Post
          </button>
          <PostCreator
            isOpen={showPostCreator}
            onClose={() => setShowPostCreator(false)}
            onSuccess={handlePostCreated}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <TikTokStyleFeed
        key={feedKey} // Force remount when user changes
        videos={videos.map(video => {
          // Apply optimistic updates
          const optimisticState = getOptimisticVideoState(video.id, video.likes_count, video.comments_count);
          return {
            ...video,
            likes_count: optimisticState.likes_count,
            comments_count: optimisticState.comments_count
          };
        })}
        currentUser={user}
        onLike={handleVideoLike}
        onComment={handleComment}
        onShare={handleShare}
        onFollow={handleUserFollow}
        onDelete={handleDelete}
        onCreatePost={() => setShowPostCreator(true)}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoading={isLoadingMore}
      />
      
      {/* Show auth helper if user can't interact */}
      {user && !user.id && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <AuthLinkHelper userEmail={user.email} />
        </div>
      )}
      
      <PostCreator
        isOpen={showPostCreator}
        onClose={() => setShowPostCreator(false)}
        onSuccess={handlePostCreated}
      />
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareVideoData(null);
        }}
        videoId={shareVideoData?.id || ''}
        caption={shareVideoData?.caption}
        username={shareVideoData?.username}
      />
    </>
  );
}