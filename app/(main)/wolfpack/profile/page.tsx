'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { wolfpackSocialService } from '@/lib/services/wolfpack';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Users, 
  Heart, 
  MessageCircle,
  Settings,
  Share2,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Grid3X3,
  Play,
  Bookmark
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  joined_date?: string;
  followers_count: number;
  following_count: number;
  wolfpack_posts_count: number;
}

interface UserPost {
  id: string;
  video_url?: string;
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_video: boolean;
}

export default function WolfpackProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wolfpack_posts, setwolfpack_posts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wolfpack_posts' | 'liked' | 'saved'>('wolfpack_posts');
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    loadProfile();
    loadwolfpack_posts();
  }, [user]);

  // Listen for refresh parameter to reload profile data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('refresh')) {
        loadProfile();
        // Clear the refresh parameter from URL without page reload
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get the auth user to ensure we have the auth ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }
      
      // Get user profile data from users table using auth_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, bio, avatar_url, location, website')
        .eq('auth_id', authUser.id)
        .single();

      const dbUserId = userData?.id || user.id;

      // Get social stats
      const socialStats = await wolfpackSocialService.getUserSocialStats(dbUserId);
      
      // Get wolfpack_posts count
      const { count: wolfpack_postsCount } = await supabase
        .from('wolfpack_videos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', dbUserId);
      
      const profileData: UserProfile = {
        id: user.id,
        first_name: userData?.first_name || user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'Wolf',
        last_name: userData?.last_name || user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1] || 'Member',
        avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url || '/icons/wolf-icon-light-screen.png',
        bio: userData?.bio || user.user_metadata?.bio || '🐺 Salem Wolf Pack Member',
        location: userData?.location || 'Salem, OR',
        website: userData?.website || user.user_metadata?.website,
        joined_date: user.created_at,
        followers_count: socialStats.followers_count,
        following_count: socialStats.following_count,
        wolfpack_posts_count: wolfpack_postsCount || 0
      };
      
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadwolfpack_posts = async () => {
    if (!user) return;
    
    try {
      // Get the auth user and database user ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }
      
      // Get user profile to get database ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
        
      const dbUserId = userData?.id || user.id;
      
      // First get wolfpack_posts from wolfpack_videos
      const { data: videowolfpack_posts, error: videoError } = await supabase
        .from('wolfpack_videos')
        .select('*')
        .eq('user_id', dbUserId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (videoError) throw videoError;
      
      // Also get wolfpack_posts from wolfpack_posts
      const { data: textwolfpack_posts, error: wolfpack_postsError } = await supabase
        .from('wolfpack_posts')
        .select('*')
        .eq('user_id', dbUserId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Combine and sort all wolfpack_posts
      const allwolfpack_posts = [];
      
      // Add video wolfpack_posts
      if (videowolfpack_posts) {
        videowolfpack_posts.forEach(post => {
          allwolfpack_posts.push({
            id: post.id,
            video_url: post.video_url,
            thumbnail_url: post.thumbnail_url || '/images/placeholder-video.svg',
            likes_count: post.like_count || 0,
            comments_count: post.comments_count || 0,
            created_at: post.created_at,
            is_video: true
          });
        });
      }
      
      // Add text wolfpack_posts with media
      if (textwolfpack_posts) {
        textwolfpack_posts.forEach(post => {
          if (post.media_url) {
            allwolfpack_posts.push({
              id: post.id,
              video_url: null,
              thumbnail_url: post.media_url,
              likes_count: post.likes || 0,
              comments_count: post.comments || 0,
              created_at: post.created_at,
              is_video: false
            });
          }
        });
      }
      
      // Sort by created_at
      allwolfpack_posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setwolfpack_posts(allwolfpack_posts);
    } catch (error) {
      console.error('Error loading wolfpack_posts:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/wolfpack/profile/edit');
  };

  const handleShare = async () => {
    if (navigator.share && profile) {
      try {
        await navigator.share({
          title: `${profile.first_name} ${profile.last_name} - Wolf Pack`,
          text: profile.bio || 'Check out my Wolf Pack profile!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share canceled');
      }
    } else {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Profile link copied to clipboard'
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Wolf Pack Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-red-900/20" />
          <div className="absolute top-10 left-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl p-8 text-center border border-red-500/30 shadow-2xl shadow-red-900/20 max-w-md w-full">
          <div className="text-6xl mb-4">🐺</div>
          <h1 className="text-2xl font-bold mb-4 text-white">Profile not found</h1>
          <p className="text-gray-300 mb-6">The requested Wolf Pack profile could not be found.</p>
          <button 
            onClick={() => router.back()}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">{profile.first_name} {profile.last_name}</h1>
        <button onClick={handleShare} className="p-2">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div className="relative">
            <Image
              src={profile.avatar_url || '/icons/wolf-icon-light-screen.png'}
              alt={`${profile.first_name} ${profile.last_name}`}
              width={100}
              height={100}
              className="w-24 h-24 rounded-full border-2 border-gray-700"
            />
            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black"></div>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex justify-around text-center mb-4">
              <div>
                <div className="text-xl font-bold">{profile.wolfpack_posts_count}</div>
                <div className="text-sm text-gray-400">wolfpack_posts</div>
              </div>
              <button
                onClick={() => router.push('/wolfpack/followers')}
                className="hover:opacity-80"
              >
                <div className="text-xl font-bold">{profile.followers_count}</div>
                <div className="text-sm text-gray-400">Followers</div>
              </button>
              <button
                onClick={() => router.push('/wolfpack/following')}
                className="hover:opacity-80"
              >
                <div className="text-xl font-bold">{profile.following_count}</div>
                <div className="text-sm text-gray-400">Following</div>
              </button>
            </div>

            {/* Action Buttons */}
            {isOwnProfile ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  Edit Profile
                </Button>
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  size="icon"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Follow
                </Button>
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  Message
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">{profile.first_name} {profile.last_name}</h2>
          {profile.bio && (
            <p className="text-gray-300 mb-2">{profile.bio}</p>
          )}
          
          {/* Profile details */}
          <div className="space-y-1 text-sm text-gray-400">
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                <a href={profile.website} className="text-blue-400 hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
            {profile.joined_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-t border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('wolfpack_posts')}
            className={`flex-1 flex items-center justify-center py-4 ${
              activeTab === 'wolfpack_posts' ? 'border-t-2 border-white' : ''
            }`}
          >
            <Grid3X3 className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 flex items-center justify-center py-4 ${
              activeTab === 'liked' ? 'border-t-2 border-white' : ''
            }`}
          >
            <Heart className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center py-4 ${
              activeTab === 'saved' ? 'border-t-2 border-white' : ''
            }`}
          >
            <Bookmark className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* wolfpack_posts Grid */}
      <div className="p-1">
        {activeTab === 'wolfpack_posts' && (
          wolfpack_posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {wolfpack_posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-gray-900 relative cursor-pointer hover:opacity-80"
                  onClick={() => router.push(`/wolfpack/video/${post.id}`)}
                >
                  <Image
                    src={post.thumbnail_url || '/images/placeholder-video.svg'}
                    alt="Post thumbnail"
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                    className="object-cover"
                  />
                  
                  {/* Video indicator */}
                  {post.is_video && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                  
                  {/* Stats overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors">
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs">
                      <Heart className="w-3 h-3" />
                      <span>{post.likes_count}</span>
                      <MessageCircle className="w-3 h-3 ml-1" />
                      <span>{post.comments_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid3X3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No wolfpack_posts yet</h3>
              <p className="text-gray-400 mb-4">Start sharing your moments with the pack</p>
              {isOwnProfile && (
                <Button
                  onClick={() => router.push('/wolfpack/feed?camera=true')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create your first post
                </Button>
              )}
            </div>
          )
        )}

        {activeTab === 'liked' && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Liked wolfpack_posts</h3>
            <p className="text-gray-400">wolfpack_posts you've liked will appear here</p>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Saved wolfpack_posts</h3>
            <p className="text-gray-400">Save wolfpack_posts to view them later</p>
          </div>
        )}
      </div>
    </div>
  );
}