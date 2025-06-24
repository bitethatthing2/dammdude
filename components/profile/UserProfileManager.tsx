"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Camera, 
  Save, 
  User, 
  Mail, 
  Calendar,
  Shield,
  Phone as PhoneIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface WolfProfile {
  id?: string;
  user_id: string;
  display_name: string | null;
  wolf_emoji: string | null;
  bio: string | null;
  vibe_status: string | null;
  favorite_drink: string | null;
  instagram_handle: string | null;
  favorite_bartender: string | null;
  is_visible: boolean;
  profile_image_url: string | null;
  phone: string | null;
}

export function UserProfileManager() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wolfProfile, setWolfProfile] = useState<WolfProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const supabase = getSupabaseBrowserClient();

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    // Wolf profile fields
    display_name: '',
    wolf_emoji: '🐺',
    vibe_status: '',
    bio: '',
    favorite_drink: '',
    instagram_handle: '',
    favorite_bartender: '',
    is_visible: true
  });

  // Load existing profiles
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get public user ID from auth ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error loading user profile:', userError);
        toast.error('Failed to load profile. Please try again.');
        return;
      }

      if (userData) {
        setUserProfile(userData);
        
        // Load wolf profile if it exists
        const { data: wolfData } = await supabase
          .from('wolf_profiles')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (wolfData) {
          setWolfProfile(wolfData);
        }

        // Set form data
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || '',
          // Wolf profile fields
          display_name: wolfData?.display_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          wolf_emoji: wolfData?.wolf_emoji || '🐺',
          vibe_status: wolfData?.vibe_status || '',
          bio: wolfData?.bio || '',
          favorite_drink: wolfData?.favorite_drink || '',
          instagram_handle: wolfData?.instagram_handle || '',
          favorite_bartender: wolfData?.favorite_bartender || '',
          is_visible: wolfData?.is_visible ?? true
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [user, loadProfile]);

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !userProfile?.id) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update user profile with new avatar
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // Also update wolf profile if it exists
      if (wolfProfile) {
        await supabase
          .from('wolf_profiles')
          .update({ profile_image_url: publicUrl })
          .eq('user_id', userProfile.id);
      }

      setUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save profile
  const saveProfile = async () => {
    if (!user?.id || !userProfile?.id) return;

    setSaving(true);

    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (userError) throw userError;

      // Update or create wolf profile
      const wolfProfileData: Omit<WolfProfile, 'id'> = {
        user_id: userProfile.id,
        display_name: formData.display_name || null,
        wolf_emoji: formData.wolf_emoji || '🐺',
        vibe_status: formData.vibe_status || null,
        bio: formData.bio || null,
        favorite_drink: formData.favorite_drink || null,
        instagram_handle: formData.instagram_handle || null,
        favorite_bartender: formData.favorite_bartender || null,
        is_visible: formData.is_visible,
        phone: formData.phone || null,
        profile_image_url: wolfProfile?.profile_image_url || null
      };

      const { error: wolfError } = await supabase
        .from('wolf_profiles')
        .upsert(wolfProfileData, { onConflict: 'user_id' });

      if (wolfError) throw wolfError;

      toast.success('Profile saved successfully!');
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const wolfEmojis = ['🐺', '🦊', '🐻', '🦁', '🐯', '🐶', '🦝', '🦅'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please log in to manage your profile</p>
        </CardContent>
      </Card>
    );
  }

  const displayName = formData.display_name || `${formData.first_name} ${formData.last_name}`.trim() || 'Your Name';
  const initials = `${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={userProfile?.avatar_url || wolfProfile?.profile_image_url || undefined} 
                    alt={displayName} 
                  />
                  <AvatarFallback className="text-2xl font-semibold">
                    {formData.wolf_emoji || initials}
                  </AvatarFallback>
                </Avatar>
                
                <label className={cn(
                  "absolute -bottom-2 -right-2 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors",
                  uploadingAvatar && "opacity-50 cursor-not-allowed"
                )}>
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              
              <div className="text-center">
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex-1 space-y-4">
              {formData.vibe_status && (
                <div>
                  <h3 className="font-semibold mb-2">Current Vibe</h3>
                  <p className="text-muted-foreground">{formData.vibe_status}</p>
                </div>
              )}
              
              {formData.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-muted-foreground">{formData.bio}</p>
                </div>
              )}
              
              {formData.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.phone}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Wolf Pack Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Wolf Pack Profile
            </CardTitle>
            <CardDescription>
              Customize your Wolf Pack presence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Your pack name"
              />
            </div>

            <div className="space-y-2">
              <Label>Wolf Emoji</Label>
              <div className="flex gap-2 flex-wrap">
                {wolfEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInputChange('wolf_emoji', emoji)}
                    className={cn(
                      "text-2xl p-2 rounded-lg border-2 transition-all",
                      formData.wolf_emoji === emoji 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vibe-status">Current Vibe</Label>
              <Input
                id="vibe-status"
                value={formData.vibe_status}
                onChange={(e) => handleInputChange('vibe_status', e.target.value)}
                placeholder="Ready to party! 🎉"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell other pack members about yourself..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite-drink">Favorite Drink</Label>
              <Input
                id="favorite-drink"
                value={formData.favorite_drink}
                onChange={(e) => handleInputChange('favorite_drink', e.target.value)}
                placeholder="Your go-to drink"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Handle</Label>
              <Input
                id="instagram"
                value={formData.instagram_handle}
                onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                placeholder="@yourusername"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite-bartender">Favorite Bartender</Label>
              <Input
                id="favorite-bartender"
                value={formData.favorite_bartender}
                onChange={(e) => handleInputChange('favorite_bartender', e.target.value)}
                placeholder="Your favorite bartender's name..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="profile-visibility" className="font-medium">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Show your profile to other pack members
                </p>
              </div>
              <input
                id="profile-visibility"
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => handleInputChange('is_visible', e.target.checked)}
                className="rounded"
                aria-label="Profile visibility toggle"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{userProfile.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Created</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(userProfile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex gap-2">
                <Badge variant="default">Active</Badge>
                {userProfile.role === 'dj' && (
                  <Badge variant="secondary">DJ</Badge>
                )}
                {userProfile.role === 'bartender' && (
                  <Badge variant="secondary">Bartender</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveProfile}
          disabled={isSaving}
          size="lg"
          className="min-w-32"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
