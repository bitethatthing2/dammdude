'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Music, Play, Volume2, VolumeX, Search, Plus, UserPlus, Users, Home, ShoppingBag, Mail, User, MoreHorizontal, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
}

export default function TikTokStyleFeed({
  videos,
  currentUser,
  onLike,
  onComment,
  onShare,
  onFollow,
  onDelete,
  onCreatePost
}: TikTokStyleFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [currentCommentVideo, setCurrentCommentVideo] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('For You');
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef(0);
  const isScrolling = useRef(false);

  // Auto-play current video only after user interaction
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo && userInteracted) {
      currentVideo.play().catch((error) => {
        console.warn('Video playback failed:', error);
        // Try to play again after a short delay
        setTimeout(() => {
          currentVideo.play().catch((e) => {
            console.error('Video playback retry failed:', e);
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

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, videos.length]);

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
      if (diff > 0 && currentIndex < videos.length - 1) {
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

  const handleLike = (videoId: string) => {
    if (liked.has(videoId)) {
      setLiked(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    } else {
      setLiked(prev => new Set(prev).add(videoId));
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
    setCurrentCommentVideo(videoId);
    setShowComments(true);
    onComment(videoId);
  };

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
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="relative h-screen w-full snap-start snap-always"
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
                <button
                  onClick={() => onFollow(video.user_id)}
                  className="text-white text-sm border border-white px-4 py-1 rounded-md font-medium"
                >
                  Follow
                </button>
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
                      liked.has(video.id) ? "fill-red-500 text-red-500 animate-pulse" : "text-white"
                    )}
                  />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {video.likes_count + (liked.has(video.id) ? 1 : 0) > 999 
                    ? `${Math.floor((video.likes_count + (liked.has(video.id) ? 1 : 0))/1000)}K` 
                    : video.likes_count + (liked.has(video.id) ? 1 : 0)}
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
                  {video.comments_count > 999 
                    ? `${Math.floor(video.comments_count/1000)}K` 
                    : video.comments_count}
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

              {/* Delete Button - only for current user's posts */}
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
                  onClick={() => onFollow(video.user_id)}
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
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
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
              {videos.map((_, idx) => (
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
      </div>


      {/* TikTok Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center py-3 px-4">
          <button className="flex flex-col items-center space-y-1">
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
          
          <button className="flex flex-col items-center space-y-1">
            <User className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Profile</span>
          </button>
        </div>
      </div>

      {/* TikTok-style Comment Overlay */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-end">
          <div className="w-full bg-black rounded-t-3xl max-h-[70vh] overflow-hidden">
            {/* Comment Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-white font-bold text-lg">Comments</span>
              <button
                onClick={() => setShowComments(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* Sample comments - replace with real data */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">ariel.dudley</span>
                    <span className="text-white/70 text-xs">2h</span>
                  </div>
                  <p className="text-white text-sm">Great atmosphere at Side Hustle tonight! Love this place 🔥</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">cyberjjux</span>
                    <span className="text-white/70 text-xs">1h</span>
                  </div>
                  <p className="text-white text-sm">Replying to @ariel.dudley totally agree! #wolfpack</p>
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/10 text-white placeholder-white/70 rounded-full px-4 py-2 outline-none text-sm"
                />
                <button className="text-white/70 hover:text-white">
                  <span className="text-sm font-bold">Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Friend Search Overlay */}
      {showFriendSearch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60">
          <div className="h-full bg-black">
            {/* Search Header */}
            <div className="flex items-center justify-between p-4 pt-16 border-b border-white/10">
              <button
                onClick={() => setShowFriendSearch(false)}
                className="text-white/70 hover:text-white text-lg"
              >
                ✕
              </button>
              <h2 className="text-white font-bold text-lg">Find Friends</h2>
              <div className="w-6"></div>
            </div>

            {/* Search Bar */}
            <div className="p-4">
              <div className="flex items-center bg-white/10 rounded-full px-4 py-3">
                <Search className="w-5 h-5 text-white/70 mr-3" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  className="flex-1 bg-transparent text-white placeholder-white/70 outline-none"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 mb-6">
              <div className="flex gap-4">
                <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">Nearby</span>
                </button>
                <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <UserPlus className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">Invite</span>
                </button>
              </div>
            </div>

            {/* Friend Suggestions */}
            <div className="px-4">
              <h3 className="text-white font-semibold mb-4">Suggested Friends</h3>
              <div className="space-y-4">
                {/* Sample friend suggestions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                      <span className="text-white font-bold">J</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">@john_doe</p>
                      <p className="text-white/70 text-sm">Mutual friends: 3</p>
                    </div>
                  </div>
                  <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium">
                    Follow
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">@sarah_wolf</p>
                      <p className="text-white/70 text-sm">Active 2h ago</p>
                    </div>
                  </div>
                  <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium">
                    Follow
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                      <span className="text-white font-bold">M</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">@mike_salem</p>
                      <p className="text-white/70 text-sm">In your area</p>
                    </div>
                  </div>
                  <button className="border border-white/30 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Following
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}