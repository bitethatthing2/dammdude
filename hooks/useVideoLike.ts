// React Hook for Video Likes
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LikeService } from '@/lib/services/like.service';

export const useVideoLike = (videoId: string, initialLiked = false, initialCount = 0) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const likeService = new LikeService(supabase);

  // Load initial like status
  useEffect(() => {
    if (videoId) {
      loadLikeStatus();
    }
  }, [videoId]);

  const loadLikeStatus = async () => {
    try {
      const status = await likeService.getLikeStatus(videoId);
      setLiked(status.liked);
      setLikeCount(status.count);
    } catch (error) {
      console.error('Failed to load like status:', error);
    }
  };

  const toggleLike = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await likeService.toggleLike(videoId);
      setLiked(result.liked);
      setLikeCount(prev => result.liked ? prev + 1 : Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to toggle like:', error);
      alert('Failed to update like. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { liked, likeCount, toggleLike, loading, refresh: loadLikeStatus };
};