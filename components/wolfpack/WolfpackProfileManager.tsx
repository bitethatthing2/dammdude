"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { 
  Camera, 
  Upload, 
  Save, 
  User, 
  Heart, 
  Music, 
  Coffee, 
  Instagram, 
  Eye, 
  EyeOff,
  Sparkles,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WolfProfile {
  id?: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  favorite_drink: string | null;
  favorite_song: string | null;
  instagram_handle: string | null;
  vibe_status: string | null;
  wolf_emoji: string | null;
  looking_for: string | null;
  gender: string | null;
  pronouns: string | null;
  is_visible: boolean;
  profile_pic_url: string | null;
  custom_avatar_id: string | null;
}

const WOLF_EMOJIS = [
  '🐺', '🌙', '⭐', '🔥', '💫', '🌟', '✨', '🎭', 
  '🎨', '🎵', '🎸', '🍺', '🍹', '🌮', '🌶️', '💃',
  '🕺', '🎯', '🎲', '🃏', '🎪', '🎨', '🎭', '🎬'
];

const VIBE_OPTIONS = [
  "Ready to party! 🎉",
  "Looking for good vibes ✨",
  "Here for the music 🎵",
  "Making new friends 👥",
  "Just chilling 😎",
  "Dancing all night 💃",
  "Bar hopping 🍻",
  "Celebrating 🥳",
  "First time here! 👋",
  "Regular wolf 🐺"
];

const GENDER_OPTIONS = [
  "Male",
  "Female", 
  "Non-binary",
  "Prefer not to say",
  "Other"
];

const LOOKING_FOR_OPTIONS = [
  "New friends",
  "Dance partners", 
  "Good conversation",
  "Gaming buddies",
  "Music lovers",
  "Just hanging out",
  "Adventure seekers",
  "Party crew"
];

export function WolfpackProfileManager() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<WolfProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const supabase = getSupabaseBrowserClient();

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    favorite_drink: '',
    favorite_song: '',
    instagram_handle: '',
    vibe_status: '',
    wolf_emoji: '🐺',
    looking_for: '',
    gender: '',
    pronouns: '',
    is_visible: true
  });

  // Load existing profile
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('wolf_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          favorite_drink: data.favorite_drink || '',
          favorite_song: data.favorite_song || '',
          instagram_handle: data.instagram_handle || '',
          vibe_status: data.vibe_status || '',
          wolf_emoji: data.wolf_emoji || '🐺',
          looking_for: data.looking_for || '',
          gender: data.gender || '',
          pronouns: data.pronouns || '',
          is_visible: data.is_visible ?? true
        });
      } else {
        // Create default profile
        const defaultProfile: Partial<WolfProfile> = {
          user_id: user.id,
          display_name: user.first_name || user.email?.split('@')[0] || 'Wolf',
          bio: null,
          favorite_drink: null,
          favorite_song: null,
          instagram_handle: null,
          vibe_status: "Ready to party! 🎉",
          wolf_emoji: '🐺',
          looking_for: null,
          gender: null,
          pronouns: null,
          is_visible: true,
          profile_pic_url: null,
          custom_avatar_id: null
        };

        setFormData({
          display_name: defaultProfile.display_name || '',
          bio: '',
          favorite_drink: '',
          favorite_song: '',
          instagram_handle: '',
          vibe_status: defaultProfile.vibe_status || '',
          wolf_emoji: defaultProfile.wolf_emoji || '🐺',
          looking_for: '',
          gender: '',
          pronouns: '',
          is_visible: true
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase, user?.first_name, user?.email]);

  useEffect(() => {
    if (!userLoading && user) {
      loadProfile();
    }
  }, [userLoading, user, loadProfile]);

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Create image record
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          name: fileName,
          url: publicUrl,
          size: file.size,
          mime_type: file.type,
          image_type: 'avatar',
          uploaded_by: user.id
        })
        .select()
        .single();

      if (imageError) {
        throw imageError;
      }

      // Update profile with new avatar
      const updatedProfile = {
        ...formData,
        profile_pic_url: publicUrl,
        custom_avatar_id: imageData.id
      };

      await saveProfile(updatedProfile, false);
      
      setProfile(prev => prev ? {
        ...prev,
        profile_pic_url: publicUrl,
        custom_avatar_id: imageData.id
      } : null);

      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save profile
  const saveProfile = async (data = formData, showToast = true) => {
    if (!user?.id) return;

    setSaving(true);

    try {
      const profileData = {
        user_id: user.id,
        display_name: data.display_name || null,
        bio: data.bio || null,
        favorite_drink: data.favorite_drink || null,
        favorite_song: data.favorite_song || null,
        instagram_handle: data.instagram_handle ? 
          data.instagram_handle.replace('@', '') : null,
        vibe_status: data.vibe_status || null,
        wolf_emoji: data.wolf_emoji,
        looking_for: data.looking_for || null,
        gender: data.gender || null,
        pronouns: data.pronouns || null,
        is_visible: data.is_visible,
        ...(profile?.profile_pic_url && { profile_pic_url: profile.profile_pic_url }),
        ...(profile?.custom_avatar_id && { custom_avatar_id: profile.custom_avatar_id })
      };

      const { data: savedData, error } = await supabase
        .from('wolf_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(savedData);
      if (showToast) {
        toast.success('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
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

  if (userLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please log in to manage your profile</p>
        </CardContent>
      </Card>
    );
  }

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
                    src={profile?.profile_pic_url || undefined} 
                    alt={formData.display_name || 'Avatar'} 
                  />
                  <AvatarFallback className="text-2xl">
                    {formData.wolf_emoji}
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
                <p className="font-medium">{formData.display_name || 'Your Name'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={formData.is_visible ? "default" : "secondary"}>
                    {formData.is_visible ? (
                      <><Eye className="h-3 w-3 mr-1" /> Visible</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" /> Private</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Current Vibe</h3>
                <p className="text-muted-foreground">
                  {formData.vibe_status || "Set your vibe status"}
                </p>
              </div>
              
              {formData.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-muted-foreground">{formData.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Info
            </CardTitle>
            <CardDescription>
              Your basic profile information and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="How you want to be known"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell other wolves about yourself..."
                maxLength={250}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {(formData.bio || '').length}/250 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input
                  id="pronouns"
                  value={formData.pronouns}
                  onChange={(e) => handleInputChange('pronouns', e.target.value)}
                  placeholder="e.g., they/them"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-visible"
                checked={formData.is_visible}
                onChange={(e) => handleInputChange('is_visible', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="is-visible" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Make profile visible to other wolves
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Personality & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Personality & Vibe
            </CardTitle>
            <CardDescription>
              Express your personality and what you're looking for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Wolf Emoji</Label>
              <div className="grid grid-cols-8 gap-2">
                {WOLF_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInputChange('wolf_emoji', emoji)}
                    className={cn(
                      "p-2 text-xl rounded-md hover:bg-muted transition-colors",
                      formData.wolf_emoji === emoji && "bg-primary text-primary-foreground"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vibe-status">Current Vibe</Label>
              <select
                id="vibe-status"
                value={formData.vibe_status}
                onChange={(e) => handleInputChange('vibe_status', e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Select your vibe...</option>
                {VIBE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="looking-for">Looking For</Label>
              <select
                id="looking-for"
                value={formData.looking_for}
                onChange={(e) => handleInputChange('looking_for', e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">What are you looking for?</option>
                {LOOKING_FOR_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Interests
            </CardTitle>
            <CardDescription>
              Share your interests and favorites
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="favorite-drink" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Favorite Drink
              </Label>
              <Input
                id="favorite-drink"
                value={formData.favorite_drink}
                onChange={(e) => handleInputChange('favorite_drink', e.target.value)}
                placeholder="e.g., Margarita, IPA, Whiskey Sour"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite-song" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Favorite Song/Artist
              </Label>
              <Input
                id="favorite-song"
                value={formData.favorite_song}
                onChange={(e) => handleInputChange('favorite_song', e.target.value)}
                placeholder="e.g., Bad Bunny, Taylor Swift, Classic Rock"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram Handle
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="instagram"
                  value={formData.instagram_handle}
                  onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Privacy & Settings
            </CardTitle>
            <CardDescription>
              Control how others see and interact with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile in the wolfpack
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="visibility-toggle"
                      checked={formData.is_visible}
                      onChange={(e) => handleInputChange('is_visible', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Visible:</strong> Other wolves can see your profile and send you winks</p>
                <p><strong>Private:</strong> You can still chat and order, but your profile is hidden</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => saveProfile()}
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
