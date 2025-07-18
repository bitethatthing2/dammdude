'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { ArrowLeft, Share, MoreHorizontal, Plus, Lock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface WolfProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  favorite_drink: string | null;
  instagram_handle: string | null;
  vibe_status: string | null;
  wolf_emoji: string | null;
  is_profile_visible: boolean;
  profile_pic_url: string | null;
  profile_image_url: string | null;
}

export default function TikTokStyleProfilePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<WolfProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const supabase = createClient();

  // Mock stats - in real app these would come from your data
  const stats = {
    followers: 1234,
    following: 567,
    likes: 12400,
    posts: 89
  };

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, wolf_emoji, bio, favorite_drink, vibe_status, profile_pic_url, instagram_handle, is_profile_visible')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        const transformedProfile: WolfProfile = {
          ...data,
          is_profile_visible: data.is_profile_visible ?? true,
          profile_image_url: data.profile_pic_url
        };
        setProfile(transformedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    if (!userLoading && user) {
      loadProfile();
    }
  }, [userLoading, user, loadProfile]);

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to view your profile</p>
      </div>
    );
  }

  const avatarUrl = profile?.profile_image_url || profile?.profile_pic_url || '/profile-placeholder.png';
  const displayName = profile?.display_name || user?.first_name || user?.email?.split('@')[0] || 'Wolf Member';
  const username = `@${user?.email?.split('@')[0] || 'wolf'}`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1">
          <span className="text-lg font-semibold">{displayName}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2">
            <Share className="w-6 h-6" />
          </button>
          <button className="p-2">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-6">
        {/* Avatar and Info */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={100}
              height={100}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
              unoptimized={avatarUrl.includes('dicebear.com')}
            />
            {profile?.wolf_emoji && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black text-lg">
                {profile.wolf_emoji}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <div className="text-xl font-bold">{stats.posts}</div>
              <div className="text-sm text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.followers.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.following}</div>
              <div className="text-sm text-gray-400">Following</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.likes.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Likes</div>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mt-4">
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-gray-400 text-sm">{username}</p>
          {profile?.bio && (
            <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
          )}
          {profile?.vibe_status && (
            <p className="mt-1 text-sm text-blue-400">{profile.vibe_status}</p>
          )}
          {profile?.instagram_handle && (
            <p className="mt-1 text-sm text-gray-400">📸 @{profile.instagram_handle}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => router.push('/profile/edit')}
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Edit profile
          </button>
          <button className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors">
            Share profile
          </button>
          <button className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-3 text-center relative ${
              activeTab === 'videos' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <div className="w-6 h-6 mx-auto mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z"/>
              </svg>
            </div>
            {activeTab === 'videos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-3 text-center relative ${
              activeTab === 'liked' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <div className="w-6 h-6 mx-auto mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            {activeTab === 'liked' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('private')}
            className={`flex-1 py-3 text-center relative ${
              activeTab === 'private' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <div className="w-6 h-6 mx-auto mb-1">
              <Lock className="w-full h-full" />
            </div>
            {activeTab === 'private' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 p-1">
        {activeTab === 'videos' && (
          <div className="grid grid-cols-3 gap-1">
            {/* Placeholder video thumbnails */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] bg-gray-800 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-600" />
                </div>
                <div className="absolute bottom-2 left-2 text-xs text-white">
                  🐺 {Math.floor(Math.random() * 999) + 1}K
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'liked' && (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2">No liked videos yet</p>
            <p className="text-sm">Videos you like will appear here</p>
          </div>
        )}

        {activeTab === 'private' && (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold mb-2">Private videos</p>
            <p className="text-sm">Only you can see these</p>
          </div>
        )}
      </div>
    </div>
  );
}