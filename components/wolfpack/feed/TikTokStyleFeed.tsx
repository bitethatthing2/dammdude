'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, Music, Play, Volume2, VolumeX, Search, Plus, UserPlus, Users, Home, ShoppingBag, Mail, User, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import VideoComments from '@/components/wolfpack/VideoComments';
import FindFriends from '@/components/wolfpack/FindFriends';
import { wolfpackSocialService } from '@/lib/services/wolfpack';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface VideoItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null; // Can be null for image wolfpack_posts
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  music_name?: string;
  hashtags?: string[];
  created_at: string;
}

interface TikTokStyleFeedProps {
  videos: VideoItem[];
  currentUser: any;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onFollow: (userId: string) => void;
  onDelete?: (videoId: string) => void;
  onCreatePost?: () => void;
  onLoadMore?: () => Promise<VideoItem[]>;
  hasMore?: boolean;
  isLoading?: boolean;
}

export default function TikTokStyleFeed({
  videos,
  currentUser,
  onLike,
  onComment,
  onShare,
  onFollow,
  onDelete,
  onCreatePost,
  onLoadMore,
  hasMore = false,
  isLoading = false
}: TikTokStyleFeedProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Enable user interaction on first document interaction
  useEffect(() => {
    const enableInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener('click', enableInteraction);
      document.removeEventListener('touchstart', enableInteraction);
      document.removeEventListener('keydown', enableInteraction);
    };

    if (!userInteracted) {
      document.addEventListener('click', enableInteraction);
      document.addEventListener('touchstart', enableInteraction);
      document.addEventListener('keydown', enableInteraction);
    }

    return () => {
      document.removeEventListener('click', enableInteraction);
      document.removeEventListener('touchstart', enableInteraction);
      document.removeEventListener('keydown', enableInteraction);
    };
  }, [userInteracted]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [videoStats, setVideoStats] = useState<Map<string, { likes_count: number; comments_count: number; user_liked: boolean }>>(new Map());
  const [followingStatus, setFollowingStatus] = useState<Map<string, boolean>>(new Map());
  const [currentCommentVideo, setCurrentCommentVideo] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('For You');
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [loadedVideos, setLoadedVideos] = useState<VideoItem[]>(videos);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef(0);
  const isScrolling = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Update loaded videos when prop changes
  useEffect(() => {
    setLoadedVideos(videos);
  }, [videos]);

  // Load initial stats for videos
  useEffect(() => {
    const loadStats = async () => {
      if (!loadedVideos?.length || !user) return;
      
      const statsPromises = loadedVideos.map(video => 
        wolfpackSocialService.getVideoStats(video.id, user.id)
      );
      
      try {
        const stats = await Promise.all(statsPromises);
        
        const newStatsMap = new Map();
        loadedVideos.forEach((video, index) => {
          newStatsMap.set(video.id, stats[index]);
        });
        
        setVideoStats(newStatsMap);
      } catch (error) {
        console.error('Error loading video stats:', error);
      }
    };
    
    loadStats();
  }, [loadedVideos, user]);

  // Set up real-time subscriptions for the current video
  useEffect(() => {
    if (!loadedVideos[currentIndex] || !user) return;
    
    const currentVideo = loadedVideos[currentIndex];
    const unsubscribe = wolfpackSocialService.subscribeToVideoStats(
      currentVideo.id,
      (stats) => {
        setVideoStats(prev => {
          const newMap = new Map(prev);
          newMap.set(currentVideo.id, stats);
          return newMap;
        });
      },
      user.id
    );
    
    return unsubscribe;
  }, [currentIndex, loadedVideos, user]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      wolfpackSocialService.cleanup();
    };
  }, []);

  // Set up Intersection Observer for infinite loading
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        onLoadMore()
          .then((newVideos) => {
            setLoadedVideos(prev => [...prev, ...newVideos]);
            setIsLoadingMore(false);
          })
          .catch((error) => {
            console.error('Error loading more videos:', error);
            setIsLoadingMore(false);
          });
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      rootMargin: '100px',
      threshold: 0.1
    });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Auto-play current video only after user interaction
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo && userInteracted) {
      currentVideo.play().catch((error) => {
        // Check if it's an autoplay policy violation
        if (error.name === 'NotAllowedError') {
          console.info('Video autoplay blocked by browser policy - user interaction required');
          // Don't retry for autoplay policy violations
          return;
        }
        
        console.warn('Video playback failed:', error);
        // Only retry for non-autoplay errors
        setTimeout(() => {
          currentVideo.play().catch((e) => {
            if (e.name !== 'NotAllowedError') {
              console.error('Video playback retry failed:', e);
            }
          });
        }, 100);
      });
    }

    // Pause all other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, userInteracted]);

  // Handle scroll with snap behavior
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrolling.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < loadedVideos.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, loadedVideos.length]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setUserInteracted(true); // Enable user interaction on touch
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    setUserInteracted(true); // Enable user interaction on touch

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < loadedVideos.length - 1) {
        // Swipe up
        scrollToIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe down
        scrollToIndex(currentIndex - 1);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    
    isScrolling.current = true;
    const container = containerRef.current;
    const targetScroll = index * container.clientHeight;
    
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });

    setTimeout(() => {
      isScrolling.current = false;
      setCurrentIndex(index);
    }, 300);
  };

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to like videos',
        variant: 'destructive'
      });
      return;
    }

    // Optimistic update
    const currentStats = videoStats.get(videoId) || { likes_count: 0, comments_count: 0, user_liked: false };
    const newStats = {
      ...currentStats,
      likes_count: currentStats.user_liked ? currentStats.likes_count - 1 : currentStats.likes_count + 1,
      user_liked: !currentStats.user_liked
    };
    
    setVideoStats(prev => {
      const newMap = new Map(prev);
      newMap.set(videoId, newStats);
      return newMap;
    });

    // Update server
    const result = await wolfpackSocialService.toggleLike(videoId, user.id);
    
    if (!result.success) {
      // Revert on error
      setVideoStats(prev => {
        const newMap = new Map(prev);
        newMap.set(videoId, currentStats);
        return newMap;
      });
      
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive'
      });
    }
    
    onLike(videoId);
  };

  const handleVideoClick = () => {
    setUserInteracted(true); // Enable user interaction and start autoplay
  };

  const toggleMute = () => {
    setMuted(!muted);
    videoRefs.current.forEach(video => {
      if (video) video.muted = !muted;
    });
  };

  const handleCommentClick = (videoId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to comment',
        variant: 'destructive'
      });
      return;
    }
    
    setCurrentCommentVideo(videoId);
    setShowComments(true);
    onComment(videoId);
  };

  const handleFollowClick = async (userId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to follow users',
        variant: 'destructive'
      });
      return;
    }

    if (userId === user.id) {
      return; // Can't follow yourself
    }

    // Optimistic update
    const currentlyFollowing = followingStatus.get(userId) || false;
    setFollowingStatus(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, !currentlyFollowing);
      return newMap;
    });

    // Update server
    const result = await wolfpackSocialService.toggleFollow(user.id, userId);
    
    if (!result.success) {
      // Revert on error
      setFollowingStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, currentlyFollowing);
        return newMap;
      });
      
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    } else {
      toast({
        title: result.following ? 'Following' : 'Unfollowed',
        description: result.following ? 'You are now following this user' : 'You have unfollowed this user'
      });
    }
    
    onFollow(userId);
  };

  // Memoize the comment count change callback to prevent infinite re-renders
  const handleCommentCountChange = useCallback((count: number) => {
    if (currentCommentVideo) {
      setVideoStats(prev => {
        const newMap = new Map(prev);
        const currentStats = newMap.get(currentCommentVideo) || { likes_count: 0, comments_count: 0, user_liked: false };
        newMap.set(currentCommentVideo, { ...currentStats, comments_count: count });
        return newMap;
      });
    }
  }, [currentCommentVideo]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Authentic TikTok Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-2 pb-1 bg-gradient-to-b from-black/60 to-transparent" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        {/* Top Navigation Tabs */}
        <div className="flex items-center justify-center px-4 relative">
          {/* Live Badge */}
          <div className="absolute left-4 top-0">
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              LIVE
            </div>
          </div>
          
          {/* Center Categories */}
          <div className="flex items-center space-x-6">
            {['For You', 'Following'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "text-lg font-semibold transition-all duration-200 relative",
                  activeCategory === category
                    ? "text-white"
                    : "text-white/70"
                )}
              >
                {category}
                {activeCategory === category && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
          
          {/* Search Icon */}
          <button 
            onClick={() => setShowFriendSearch(true)}
            className="absolute right-4 top-0"
          >
            <Search className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Additional Categories Row */}
        <div className="flex justify-center items-center mt-2 px-4">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {['Festivals', 'Trending', 'Music'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "text-sm font-medium whitespace-nowrap transition-all duration-200",
                  activeCategory === category
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                )}
              >
                {category}
                {category === 'Festivals' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {loadedVideos.map((video, index) => (
          <div
            key={video.id}
            className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
            style={{
              height: '100vh',
              minHeight: '100vh',
              maxHeight: '100vh',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always'
            }}
          >
            {/* Video or Fallback Image */}
            {!videoErrors.has(video.id) && 
             video.video_url && 
             video.video_url.trim() !== '' && 
             !video.video_url.includes('placeholder') && 
             !video.video_url.includes('sample') && 
             !video.video_url.includes('test') ? (
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.video_url}
                poster={video.thumbnail_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted={muted}
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                style={{ objectFit: 'cover' }}
                onClick={handleVideoClick}
                onError={(e) => {
                  // Only log errors for non-placeholder URLs
                  if (video.video_url && !video.video_url.includes('placeholder') && !video.video_url.includes('sample')) {
                    console.warn('Video load error for:', video.video_url);
                  }
                  setVideoErrors(prev => new Set(prev).add(video.id));
                }}
                onLoadedData={(e) => {
                  // Remove successful videos from error set
                  setVideoErrors(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(video.id);
                    return newSet;
                  });
                }}
                onCanPlay={(e) => {
                  // Ensure quality matches viewport
                  const video = e.target as HTMLVideoElement;
                  if (video.videoWidth > window.innerWidth * 2) {
                    console.info('High resolution video detected, consider using adaptive streaming');
                  }
                }}
              />
            ) : (
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={video.thumbnail_url || '/images/entertainment-hero.jpg'}
                  alt={video.caption}
                  fill
                  className="object-cover"
                  onClick={handleVideoClick}
                />
                {/* Only show play icon if this is actually a video (has video_url) */}
                {video.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Initial tap to start message - only for videos */}
            {!userInteracted && index === currentIndex && video.video_url && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-8 animate-pulse">
                  <Play className="w-16 h-16 text-white fill-white drop-shadow-lg" />
                </div>
              </div>
            )}

            {/* TikTok-style Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 pb-20 px-4">
              {/* User Info - simplified TikTok style */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-white font-bold text-base drop-shadow-lg">@{video.username}</p>
                {video.user_id !== user?.id && (
                  <button
                    onClick={() => handleFollowClick(video.user_id)}
                    className={cn(
                      "text-white text-sm border px-4 py-1 rounded-md font-medium transition-all",
                      followingStatus.get(video.user_id)
                        ? "border-gray-500 bg-gray-800/50"
                        : "border-white hover:bg-white/20"
                    )}
                  >
                    {followingStatus.get(video.user_id) ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Caption with hashtags inline */}
              <div className="mb-3 max-w-xs">
                <p className="text-white text-sm leading-relaxed drop-shadow-lg">
                  {video.caption}
                  {video.hashtags && video.hashtags.map((tag, index) => (
                    <span key={tag} className="text-white font-bold">
                      {index === 0 ? ' ' : ' '}#{tag}
                    </span>
                  ))}
                </p>
              </div>

              {/* Music info - TikTok style */}
              {video.music_name && (
                <div className="flex items-center gap-2 text-white text-sm mb-2 drop-shadow-lg">
                  <Music className="w-4 h-4 drop-shadow-lg" />
                  <span className="font-medium drop-shadow-lg">Original Sound</span>
                </div>
              )}
            </div>

            {/* TikTok-style Action Buttons */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-4">
              {/* Like */}
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95",
                  liked.has(video.id) ? "bg-transparent" : "bg-transparent"
                )}>
                  <Heart
                    className={cn(
                      "w-8 h-8 transition-all duration-300",
                      videoStats.get(video.id)?.user_liked ? "fill-red-500 text-red-500 animate-pulse" : "text-white"
                    )}
                  />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {(() => {
                    const stats = videoStats.get(video.id);
                    const likeCount = stats?.likes_count ?? video.likes_count;
                    return likeCount > 999 
                      ? `${Math.floor(likeCount/1000)}K` 
                      : likeCount;
                  })()}
                </span>
              </button>

              {/* Comment */}
              <button
                onClick={() => handleCommentClick(video.id)}
                className="flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {(() => {
                    const stats = videoStats.get(video.id);
                    const commentCount = stats?.comments_count ?? video.comments_count;
                    return commentCount > 999 
                      ? `${Math.floor(commentCount/1000)}K` 
                      : commentCount;
                  })()}
                </span>
              </button>

              {/* Share */}
              <button
                onClick={() => onShare(video.id)}
                className="flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {video.shares_count > 999 
                    ? `${Math.floor(video.shares_count/1000)}K` 
                    : video.shares_count}
                </span>
              </button>

              {/* Delete Button - only for current user's wolfpack_posts */}
              {currentUser && video.user_id === currentUser.id && onDelete && (
                <button
                  onClick={() => onDelete(video.id)}
                  className="flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95 bg-red-500/20">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <span className="text-red-400 text-xs mt-1 font-bold">Delete</span>
                </button>
              )}

              {/* Profile Picture */}
              <div className="mt-2">
                <button
                  onClick={() => handleFollowClick(video.user_id)}
                  className="relative"
                >
                  <div className="relative w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                    <Image
                      src={video.avatar_url || '/icons/wolf-icon.png'}
                      alt={video.username}
                      fill
                      sizes="48px"
                      className="object-cover"
                      quality={95}
                    />
                  </div>
                  {video.user_id !== user?.id && !followingStatus.get(video.user_id) && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                      <Plus className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 mt-2"
              >
                {muted ? (
                  <VolumeX className="w-7 h-7 text-white" />
                ) : (
                  <Volume2 className="w-7 h-7 text-white" />
                )}
              </button>
            </div>

            {/* Minimal Progress Indicators - TikTok style */}
            <div className="absolute right-4 flex flex-col gap-1" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}>
              {loadedVideos.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-0.5 h-3 bg-white/30 rounded-full transition-all duration-300",
                    idx === currentIndex && "bg-white h-4"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Sentinel element for infinite scroll */}
        {onLoadMore && hasMore && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
          </div>
        )}
      </div>


      {/* TikTok Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center py-3 px-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center space-y-1"
          >
            <Home className="w-6 h-6 text-white" />
            <span className="text-xs text-white font-medium">Home</span>
          </button>
          
          <button className="flex flex-col items-center space-y-1">
            <ShoppingBag className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Shop</span>
          </button>
          
          <button 
            className="flex flex-col items-center space-y-1"
            onClick={onCreatePost}
          >
            <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-black" />
            </div>
          </button>
          
          <button className="flex flex-col items-center space-y-1 relative">
            <Mail className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Inbox</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">11</span>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/wolfpack/profile')}
            className="flex flex-col items-center space-y-1"
          >
            <User className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Profile</span>
          </button>
        </div>
      </div>

      {/* TikTok-style Comment Overlay */}
      {showComments && currentCommentVideo && (
        <VideoComments
          postId={currentCommentVideo}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setCurrentCommentVideo(null);
          }}
          initialCommentCount={loadedVideos.find(v => v.id === currentCommentVideo)?.comments_count || 0}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      {/* Friend Search Overlay */}
      {showFriendSearch && (
        <FindFriends onClose={() => setShowFriendSearch(false)} />
      )}
    </div>
  );
}