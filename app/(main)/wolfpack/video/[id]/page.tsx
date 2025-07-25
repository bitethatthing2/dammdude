'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import VideoComments from '@/components/wolfpack/VideoComments';
import ShareModal from '@/components/wolfpack/ShareModal';
import { toast } from 'sonner';

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [videoId]);

  const fetchPost = async () => {
    try {
      const supabase = createClient();
      
      // Fetch post data with proper video_id relationships
      const { data: postData, error } = await supabase
        .from('wolfpack_posts')
        .select(`
          *,
          users:user_id (
            id,
            display_name,
            avatar_url,
            profile_image_url
          ),
          wolfpack_post_likes!video_id (
            id,
            user_id,
            created_at
          ),
          wolfpack_comments!video_id (
            id,
            user_id,
            content,
            created_at,
            like_count,
            users (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', videoId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Post not found - likely deleted
          toast.error('This post has been removed. Old wolfpack_posts are automatically deleted to maintain performance.');
          router.push('/wolfpack');
          return;
        }
        throw error;
      }

      if (!postData) {
        toast.error('Post not found');
        router.push('/wolfpack');
        return;
      }

      setPost(postData);
      // Count likes from the wolfpack_post_likes array
      setLikeCount(postData.wolfpack_post_likes?.length || 0);

      // Check if current user has liked this post
      const { data: { user } } = await supabase.auth.getUser();
      if (user && postData.wolfpack_post_likes) {
        // Check if user id exists in the likes array
        const userLike = postData.wolfpack_post_likes.find(
          (like: any) => like.user_id === user.id
        );
        setIsLiked(!!userLike);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to like wolfpack_posts');
        return;
      }

      if (isLiked) {
        // Unlike
        await supabase
          .from('wolfpack_post_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('wolfpack_post_likes')
          .insert({ video_id: videoId, user_id: user.id });
        
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const mediaUrl = post.media_url || post.video_url || post.image_url;
  const isVideo = post.media_type === 'video' || post.video_url;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <h1 className="text-white font-semibold">Post</h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Media */}
          <div className="relative bg-black aspect-[9/16] max-h-[calc(100vh-200px)]">
            {isVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={post.caption || 'Post'}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Post Info */}
          <div className="p-4 bg-zinc-900">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage 
                  src={post.users?.avatar_url || post.users?.profile_image_url} 
                />
                <AvatarFallback>
                  {post.users?.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold">
                  {post.users?.display_name || 'Unknown User'}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Caption */}
            {post.caption && (
              <p className="text-white mb-4">{post.caption}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
              >
                <Heart 
                  className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                />
                <span>{likeCount}</span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-white hover:text-primary transition-colors"
              >
                <MessageCircle className="h-6 w-6" />
                <span>{post.wolfpack_comments?.length || 0}</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 text-white hover:text-primary transition-colors"
              >
                <Share2 className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <VideoComments 
            postId={videoId} 
            isOpen={showComments}
            onClose={() => setShowComments(false)} 
            initialCommentCount={post.wolfpack_comments?.length || 0}
            onCommentCountChange={(count) => {
              // Update the post state with new comment count if needed
              console.log('Comment count changed:', count);
            }}
          />
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        videoId={videoId}
        caption={post.caption || 'Check out this post!'}
        username={post.users?.display_name}
      />
    </div>
  );
}