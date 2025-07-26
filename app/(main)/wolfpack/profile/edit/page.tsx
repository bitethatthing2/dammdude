'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Camera, 
  Save,
  User,
  MapPin,
  Link as LinkIcon,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  avatar_url: string;
  location: string;
  website: string;
}

export default function WolfpackProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    bio: '',
    avatar_url: '',
    location: '',
    website: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      // First, get the auth user to ensure we have the auth ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }
      
      // Get existing user data from users table using auth_id
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, bio, avatar_url, location, website')
        .eq('auth_id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      // Use existing data or fallback to user metadata
      setProfile({
        first_name: userData?.first_name || user.user_metadata?.first_name || '',
        last_name: userData?.last_name || user.user_metadata?.last_name || '',
        bio: userData?.bio || user.user_metadata?.bio || '',
        avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url || '',
        location: userData?.location || 'Salem, OR',
        website: userData?.website || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    
    try {
      setImageUploading(true);
      
      // Get the auth user to ensure we have the auth ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }
      
      // Create unique filename and path for RLS policy compliance
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${authUser.id}/${fileName}`;
      
      // Additional validation
      if (!file.type.startsWith('image/')) {
        throw new Error('Selected file is not an image');
      }

      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Upload debug info:', {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type,
        authUserId: authUser.id,
        hasSession: !!session,
        sessionExpiry: session?.expires_at
      });

      // Try a direct upload first with upsert to handle existing files
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload to storage');
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);

      // Update profile with new image URL
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: 'Image uploaded',
        description: 'Profile image updated successfully'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Get more detailed error information
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as { message: string }).message;
        } else if ('error' in error) {
          errorMessage = (error as { error: string }).error;
        } else if ('statusText' in error) {
          errorMessage = (error as { statusText: string }).statusText;
        }
        
        // Log the full error object for debugging
        console.error('Full error object:', JSON.stringify(error, null, 2));
      }
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG, PNG, or WebP image',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    handleImageUpload(file);
  };

  const saveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Get the auth user to ensure we have the auth ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }
      
      // First, get the database user record by auth_id
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existingUser) {
        // Update existing user
        const { error: userError } = await supabase
          .from('users')
          .update({
            first_name: profile.first_name,
            last_name: profile.last_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            location: profile.location,
            website: profile.website,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);

        if (userError) {
          throw userError;
        }
      } else {
        // Create new user profile if it doesn't exist
        const { error: userError } = await supabase
          .from('users')
          .insert({
            auth_id: authUser.id,
            email: authUser.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            location: profile.location,
            website: profile.website,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (userError) {
          throw userError;
        }
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        }
      });

      if (authError) {
        console.warn('Auth metadata update failed:', authError);
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully'
      });

      // Add cache-busting parameter to force profile page reload
      router.push('/wolfpack/profile?refresh=' + Date.now());
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to edit your profile</p>
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
        <h1 className="text-lg font-semibold">Edit Profile</h1>
        <Button
          onClick={saveProfile}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Image
              src={profile.avatar_url || '/icons/wolf-icon-light-screen.png'}
              alt="Profile"
              width={120}
              height={120}
              className="w-30 h-30 rounded-full border-2 border-gray-700"
              priority
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-full p-3 border-2 border-black"
            >
              {imageUploading ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-gray-400 text-center">
            Tap the camera icon to change your profile picture
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-gray-300">First Name</Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-gray-300">Last Name</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-gray-300">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              className="bg-gray-900 border-gray-700 text-white resize-none"
              placeholder="Tell the pack about yourself..."
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-gray-500 mt-1">
              {profile.bio.length}/150 characters
            </p>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-gray-300">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                className="bg-gray-900 border-gray-700 text-white pl-10"
                placeholder="Salem, OR"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website" className="text-gray-300">Website</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="website"
                value={profile.website}
                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                className="bg-gray-900 border-gray-700 text-white pl-10"
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </div>
          </div>
        </div>

        {/* Save Button (Mobile) */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}