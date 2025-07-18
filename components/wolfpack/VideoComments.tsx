'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { 
  X, 
  Send, 
  Heart, 
  MessageCircle,
  MoreHorizontal,
  Reply,
  ThumbsUp
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getZIndexClass } from '@/lib/constants/z-index';
// import { useComments } from '@/lib/contexts/CommentsContext';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string;
    verified?: boolean;
  };
  is_liked?: boolean;
}

interface VideoCommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentCount: number;
}

export default function VideoComments({ postId, isOpen, onClose, initialCommentCount }: VideoCommentsProps) {
  const { user } = useAuth();
  // const { setIsCommentsOpen } = useComments();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // Update comments context state when comments open/close
    // setIsCommentsOpen(isOpen);
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // For now, use sample data since we don't have comments table set up
      const sampleComments: Comment[] = [
        {
          id: '1',
          user_id: 'user1',
          content: 'Amazing video! Love the energy 🔥',
          created_at: '2024-01-15T10:30:00Z',
          likes_count: 24,
          replies_count: 3,
          user_profile: {
            first_name: 'Sarah',
            last_name: 'M',
            username: 'sarahm_salem',
            avatar_url: '/icons/wolf-icon-light-screen.png',
            verified: true
          },
          is_liked: false
        },
        {
          id: '2',
          user_id: 'user2',
          content: 'Salem Wolf Pack representing! 🐺',
          created_at: '2024-01-15T10:25:00Z',
          likes_count: 18,
          replies_count: 1,
          user_profile: {
            first_name: 'Mike',
            last_name: 'R',
            username: 'mike_rocks',
            avatar_url: '/icons/wolf-icon-light-screen.png',
            verified: false
          },
          is_liked: true
        },
        {
          id: '3',
          user_id: 'user3',
          content: 'When will you be at Portland location?',
          created_at: '2024-01-15T10:20:00Z',
          likes_count: 12,
          replies_count: 0,
          user_profile: {
            first_name: 'Alex',
            last_name: 'C',
            username: 'alexc_pdx',
            avatar_url: '/icons/wolf-icon-light-screen.png',
            verified: false
          },
          is_liked: false
        }
      ];
      
      setComments(sampleComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;

    try {
      setSubmitting(true);
      
      // Create new comment
      const newCommentData: Comment = {
        id: Date.now().toString(),
        user_id: user?.id || 'anonymous',
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        likes_count: 0,
        replies_count: 0,
        user_profile: {
          first_name: user?.user_metadata?.first_name || 'User',
          last_name: user?.user_metadata?.last_name || '',
          username: user?.email?.split('@')[0] || 'user',
          avatar_url: user?.user_metadata?.avatar_url || '/icons/wolf-icon-light-screen.png',
          verified: true
        },
        is_liked: false
      };

      // Add to comments list
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');

      // TODO: Submit to database
      console.log('Submitted comment:', newCommentData);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              is_liked: !comment.is_liked,
              likes_count: comment.is_liked ? comment.likes_count - 1 : comment.likes_count + 1
            }
          : comment
      )
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${getZIndexClass('NOTIFICATION')} flex flex-col`}>
      {/* Video background (blurred) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Comments overlay - slides up from bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col max-h-[70vh] animate-slide-up">
        {/* TikTok-style Header */}
        <div className="flex items-center justify-center p-4 relative">
          <div className="w-12 h-1 bg-gray-400 rounded-full absolute top-2"></div>
          <h2 className="text-gray-900 text-lg font-semibold mt-2">
            {comments.length} comments
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No comments yet</p>
              <p className="text-gray-500 text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 py-2">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <Image
                    src={comment.user_profile?.avatar_url || '/icons/wolf-icon-light-screen.png'}
                    alt="User avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <span className="text-gray-900 font-semibold text-sm mr-2">
                      {comment.user_profile?.username || 'user'}
                    </span>
                    {comment.user_profile?.verified && (
                      <span className="text-blue-500 mr-2">✓</span>
                    )}
                    <span className="text-gray-500 text-xs">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 text-sm leading-normal mb-2">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          comment.is_liked ? 'fill-red-500 text-red-500' : ''
                        }`} 
                      />
                      <span className="text-xs">{comment.likes_count}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        // TODO: Implement reply functionality
                        console.log('Reply to comment:', comment.id);
                      }}
                      className="text-gray-500 hover:text-gray-700 transition-colors text-xs"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TikTok-style Emoji Reactions */}
        <div className="flex justify-center gap-2 py-3 border-t border-gray-200">
          {['😂', '😍', '😮', '😢', '😡', '👍'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                // TODO: Handle emoji reaction
                console.log('Emoji reaction:', emoji);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-2xl"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Comment Input */}
        <div className="border-t border-gray-200 p-4 pb-6 bg-white">
          <form onSubmit={handleSubmitComment} className="flex gap-3 items-center">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <Image
                src={user?.user_metadata?.avatar_url || '/icons/wolf-icon-light-screen.png'}
                alt="Your avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            </Avatar>
            
            <div className="flex-1 flex gap-2 items-center">
              <Input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 rounded-full px-4 py-2"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Mention someone"
                >
                  @
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Add emoji"
                >
                  😊
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Add photo"
                >
                  🖼️
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="text-gray-500 hover:text-gray-700 disabled:text-gray-400 transition-colors p-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}