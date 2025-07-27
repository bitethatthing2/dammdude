/**
 * Optimistic Actions Hook
 * Handles optimistic updates for likes, comments, follows without waiting for server response
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface OptimisticState {
  likes: Record<string, boolean>; // videoId -> isLiked
  follows: Record<string, boolean>; // userId -> isFollowed
  localLikeCounts: Record<string, number>; // videoId -> count adjustment
  localCommentCounts: Record<string, number>; // videoId -> count adjustment
}

interface UseOptimisticActionsProps {
  userId?: string; // This should be the public user ID (database ID), not auth ID
  onUpdateVideoStats?: (videoId: string, updates: { likes_count?: number; comments_count?: number }) => void;
}

export function useOptimisticActions({ 
  userId, 
  onUpdateVideoStats 
}: UseOptimisticActionsProps = {}) {
  const [optimisticState, setOptimisticState] = useState<OptimisticState>({
    likes: {},
    follows: {},
    localLikeCounts: {},
    localCommentCounts: {}
  });

  // Optimistic like/unlike
  const handleLike = useCallback(async (videoId: string, currentLikeCount: number, isCurrentlyLiked: boolean) => {
    if (!userId) {
      toast({
        title: "Account linking required",
        description: "Please link your account to like posts. Check the signup form below.",
        variant: "destructive"
      });
      return;
    }

    const newIsLiked = !isCurrentlyLiked;
    const countChange = newIsLiked ? 1 : -1;
    const newCount = Math.max(0, currentLikeCount + countChange);

    // Optimistic update
    setOptimisticState(prev => ({
      ...prev,
      likes: { ...prev.likes, [videoId]: newIsLiked },
      localLikeCounts: { ...prev.localLikeCounts, [videoId]: countChange }
    }));

    // Update parent component immediately
    onUpdateVideoStats?.(videoId, { likes_count: newCount });

    try {
      // userId should already be the database user ID (public user ID)
      const userDbId = userId;

      if (newIsLiked) {
        // Add like
        const { error } = await supabase
          .from('wolfpack_post_likes')
          .insert({
            user_id: userDbId,
            video_id: videoId
          });

        if (error) throw error;

        // Update video like count
        const { error: updateError } = await supabase
          .from('wolfpack_videos')
          .update({ like_count: newCount })
          .eq('id', videoId);

        if (updateError) console.warn('Failed to update like count:', updateError);

      } else {
        // Remove like
        const { error } = await supabase
          .from('wolfpack_post_likes')
          .delete()
          .eq('user_id', userDbId)
          .eq('video_id', videoId);

        if (error) throw error;

        // Update video like count
        const { error: updateError } = await supabase
          .from('wolfpack_videos')
          .update({ like_count: newCount })
          .eq('id', videoId);

        if (updateError) console.warn('Failed to update like count:', updateError);
      }

      console.log(`${newIsLiked ? 'Liked' : 'Unliked'} video ${videoId}`);

    } catch (error) {
      console.error('Error handling like:', error);
      
      // Revert optimistic update
      setOptimisticState(prev => ({
        ...prev,
        likes: { ...prev.likes, [videoId]: isCurrentlyLiked },
        localLikeCounts: { ...prev.localLikeCounts, [videoId]: 0 }
      }));

      // Revert parent component
      onUpdateVideoStats?.(videoId, { likes_count: currentLikeCount });

      toast({
        title: "Action failed",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  }, [userId, onUpdateVideoStats]);

  // Optimistic follow/unfollow
  const handleFollow = useCallback(async (targetUserId: string, isCurrentlyFollowed: boolean) => {
    if (!userId) {
      toast({
        title: "Account linking required", 
        description: "Please link your account to follow users. Check the signup form below.",
        variant: "destructive"
      });
      return;
    }

    const newIsFollowed = !isCurrentlyFollowed;

    // Optimistic update
    setOptimisticState(prev => ({
      ...prev,
      follows: { ...prev.follows, [targetUserId]: newIsFollowed }
    }));

    try {
      // userId should already be the database user ID (public user ID)
      const userDbId = userId;

      if (newIsFollowed) {
        // Add follow
        const { error } = await supabase
          .from('wolfpack_follows')
          .insert({
            follower_id: userDbId,
            following_id: targetUserId
          });

        if (error) throw error;
      } else {
        // Remove follow
        const { error } = await supabase
          .from('wolfpack_follows')
          .delete()
          .eq('follower_id', userDbId)
          .eq('following_id', targetUserId);

        if (error) throw error;
      }

      toast({
        title: newIsFollowed ? "Following" : "Unfollowed",
        description: newIsFollowed ? "You are now following this user" : "You unfollowed this user"
      });

    } catch (error) {
      console.error('Error handling follow:', error);
      
      // Revert optimistic update
      setOptimisticState(prev => ({
        ...prev,
        follows: { ...prev.follows, [targetUserId]: isCurrentlyFollowed }
      }));

      toast({
        title: "Action failed",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    }
  }, [userId]);

  // Handle comment creation with optimistic count update
  const handleCommentSubmit = useCallback(async (
    videoId: string, 
    content: string, 
    currentCommentCount: number,
    parentId?: string
  ) => {
    if (!userId) {
      toast({
        title: "Account linking required",
        description: "Please link your account to comment. Check the signup form below.",
        variant: "destructive"
      });
      return null;
    }

    // Optimistic update - increment comment count
    const newCount = currentCommentCount + 1;
    setOptimisticState(prev => ({
      ...prev,
      localCommentCounts: { 
        ...prev.localCommentCounts, 
        [videoId]: (prev.localCommentCounts[videoId] || 0) + 1 
      }
    }));

    // Update parent component immediately
    onUpdateVideoStats?.(videoId, { comments_count: newCount });

    try {
      // userId should already be the database user ID (public user ID)
      const userDbId = userId;

      // Create comment
      const { data: comment, error } = await supabase
        .from('wolfpack_comments')
        .insert({
          user_id: userDbId,
          video_id: videoId,
          content: content.trim(),
          parent_id: parentId || null
        })
        .select(`
          id,
          content,
          created_at,
          user:user_id (
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .single();

      if (error) throw error;

      // Update video comment count
      const { error: updateError } = await supabase
        .from('wolfpack_videos')
        .update({ comments_count: newCount })
        .eq('id', videoId);

      if (updateError) console.warn('Failed to update comment count:', updateError);

      return comment;

    } catch (error) {
      console.error('Error creating comment:', error);
      
      // Revert optimistic update
      setOptimisticState(prev => ({
        ...prev,
        localCommentCounts: { 
          ...prev.localCommentCounts, 
          [videoId]: (prev.localCommentCounts[videoId] || 1) - 1 
        }
      }));

      // Revert parent component
      onUpdateVideoStats?.(videoId, { comments_count: currentCommentCount });

      toast({
        title: "Comment failed",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });

      return null;
    }
  }, [userId, onUpdateVideoStats]);

  // Get optimistic state for a video
  const getOptimisticVideoState = useCallback((videoId: string, originalLikeCount: number, originalCommentCount: number) => {
    const likeAdjustment = optimisticState.localLikeCounts[videoId] || 0;
    const commentAdjustment = optimisticState.localCommentCounts[videoId] || 0;
    
    return {
      isLiked: optimisticState.likes[videoId],
      likes_count: Math.max(0, originalLikeCount + likeAdjustment),
      comments_count: Math.max(0, originalCommentCount + commentAdjustment)
    };
  }, [optimisticState]);

  // Get optimistic follow state
  const getOptimisticFollowState = useCallback((userId: string) => {
    return optimisticState.follows[userId];
  }, [optimisticState]);

  // Clear optimistic state (useful after real-time updates)
  const clearOptimisticState = useCallback(() => {
    setOptimisticState({
      likes: {},
      follows: {},
      localLikeCounts: {},
      localCommentCounts: {}
    });
  }, []);

  return {
    handleLike,
    handleFollow,
    handleCommentSubmit,
    getOptimisticVideoState,
    getOptimisticFollowState,
    clearOptimisticState
  };
}