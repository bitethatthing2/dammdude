'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarWithFallback } from '@/components/shared/ImageWithFallback';
import { ProfileImageUploaderWithHistory } from '@/components/shared/ImageHistoryViewer';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { 
  Camera, 
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

// Type definitions based on your Supabase schema
interface WolfProfile {
  id: string;
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
  is_profile_visible: boolean;
  profile_pic_url: string | null;
  profile_image_url: string | null;
  custom_avatar_id: string | null;
  allow_messages: boolean;
  phone?: string | null;
  location_permissions_granted?: boolean | null;
  favorite_bartender?: string | null;
  created_at?: string | null;
  last_seen_at?: string | null;
  daily_customization?: unknown;
}

// Form data interface
interface FormData {
  display_name: string;
  bio: string;
  favorite_drink: string;
  favorite_song: string;
  instagram_handle: string;
  vibe_status: string;
  wolf_emoji: string;
  looking_for: string;
  gender: string;
  pronouns: string;
  is_profile_visible: boolean;
  allow_messages: boolean;
  favorite_bartender: string;
  profile_image_url: string;
}

const WOLF_EMOJIS = [
  '🐺', '🌙', '⭐', '🔥', '💫', '🌟', '✨', '🎭', 
  '🎨', '🎵', '🎸', '🍺', '🍹', '🌮', '🌶️', '💃',
  '🕺', '🎯', '🎲', '🃏', '🎪', '🎬', '🎤', '🎊'
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
  "male",
  "female", 
  "other",
  "prefer_not_to_say"
];

const GENDER_DISPLAY_MAP: Record<string, string> = {
  "male": "Male",
  "female": "Female",
  "other": "Non-binary",
  "prefer_not_to_say": "Prefer not to say"
};

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
  
  // Initialize supabase client
  const supabase = createClient();
  
  
  // Form state with proper typing
  const [formData, setFormData] = useState<FormData>({
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
    is_profile_visible: true,
    allow_messages: true,
    favorite_bartender: '',
    profile_image_url: ''
  });

  // Load existing profile
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, wolf_emoji, bio, favorite_drink, vibe_status, profile_pic_url, instagram_handle, favorite_song, looking_for, is_profile_visible, gender, pronouns, custom_avatar_id, allow_messages')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
        return;
      }

      if (data) {
        // Transform the data to match WolfProfile interface, ensuring boolean fields are not null
        const transformedProfile: WolfProfile = {
          ...data,
          id: data.id, // Add missing id field
          is_profile_visible: data.is_profile_visible ?? true,
          allow_messages: data.allow_messages ?? true,
          profile_image_url: data.profile_pic_url // Map profile_pic_url to profile_image_url
        };
        setProfile(transformedProfile);
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
          is_profile_visible: data.is_profile_visible ?? true,
          allow_messages: data.allow_messages ?? true,
          favorite_bartender: '', // This field doesn't exist in users table
          profile_image_url: data.profile_pic_url || ''
        });
      } else {
        // Set default values for new profile - fix user property access
        const defaultName: string = 
          (user.first_name && typeof user.first_name === 'string' ? user.first_name : '') ||
          (user.email ? user.email.split('@')[0] : '') ||
          'Wolf';

        setFormData({
          display_name: defaultName,
          bio: '',
          favorite_drink: '',
          favorite_song: '',
          instagram_handle: '',
          vibe_status: "Ready to party! 🎉",
          wolf_emoji: '🐺',
          looking_for: '',
          gender: '',
          pronouns: '',
          is_profile_visible: true,
          allow_messages: true,
          favorite_bartender: '',
          profile_image_url: ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.first_name, user?.email, supabase]);

  useEffect(() => {
    if (!userLoading && user) {
      loadProfile();
    }
  }, [userLoading, user, loadProfile]);


  // Save profile with proper typing
  const saveProfile = async (data: FormData = formData, showToast = true) => {
    if (!user?.id) {
      console.error('Cannot save profile: No user ID available');
      toast.error('Please log in to save your profile');
      return;
    }

    // Validate required fields
    if (!data.display_name?.trim()) {
      toast.error('Display name is required');
      return;
    }

    setSaving(true);

    // Prepare profile data with proper typing (moved outside try block)
    // Note: Don't include 'id' in update data - it's used in the WHERE clause
    const profileData = {
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
      is_profile_visible: data.is_profile_visible,
      allow_messages: data.allow_messages,
      favorite_bartender: data.favorite_bartender || null,
      // Preserve existing image URLs if they exist
      profile_pic_url: profile?.profile_pic_url || null,
      profile_image_url: profile?.profile_image_url || null,
      custom_avatar_id: profile?.custom_avatar_id || null
    };

    // If data contains profile_image_url (from avatar upload), use it
    if (data.profile_image_url) {
      profileData.profile_image_url = data.profile_image_url;
      profileData.profile_pic_url = data.profile_image_url; // Keep both in sync
    }

    try {
      const { data: savedData, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Ensure savedData has proper boolean types before setting
      const typedSavedData: WolfProfile = {
        ...savedData,
        id: savedData.id, // Add missing id field
        is_profile_visible: savedData.is_profile_visible ?? true,
        allow_messages: savedData.allow_messages ?? true,
        profile_image_url: savedData.profile_pic_url || savedData.profile_image_url
      };

      setProfile(typedSavedData);
      
      // Update completed - wolf-pack-members table has been consolidated into users

      if (showToast) {
        toast.success('Profile saved successfully!');
      }
    } catch (error: any) {
      // Enhanced error logging for debugging
      console.error('Error saving profile - Full details:', {
        error,
        errorType: typeof error,
        errorConstructorName: error?.constructor?.name,
        errorMessage: error?.message || 'No message',
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorStatus: error?.status,
        errorStatusText: error?.statusText,
        isPostgrestError: error?.code?.startsWith('PGRST'),
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
        errorStringified: JSON.stringify(error, null, 2),
        profileData,
        userId: user.id
      });
      
      // Handle Supabase/Postgrest specific errors
      let userMessage = 'Failed to save profile';
      
      // Check for Supabase error structure
      if (error?.code) {
        // Handle PGRST errors (PostgREST errors from Supabase)
        if (error.code === 'PGRST301') {
          userMessage = 'No rows were updated - please try again';
        } else if (error.code === '23505' || error.details?.includes('duplicate')) {
          userMessage = 'That display name is already taken';
        } else if (error.code === '42501' || error.message?.includes('permission')) {
          userMessage = 'You do not have permission to update this profile';
        } else if (error.code === '23503') {
          userMessage = 'Invalid reference - please check your input';
        } else if (error.code === '22P02') {
          userMessage = 'Invalid input format - please check your data';
        } else if (error.code.startsWith('PGRST')) {
          userMessage = `Database error: ${error.message || error.code}`;
        }
      } 
      // Handle standard Error objects
      else if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          userMessage = 'That display name is already taken';
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          userMessage = 'You do not have permission to update this profile';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          userMessage = 'Network error - please check your connection';
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          userMessage = 'Invalid data - please check your input';
        } else {
          userMessage = `Failed to save profile: ${error.message}`;
        }
      }
      // Handle non-standard error objects
      else if (error?.message) {
        userMessage = `Failed to save profile: ${error.message}`;
      }
      
      // If we have a hint from Postgres, append it
      if (error?.hint) {
        userMessage += ` (Hint: ${error.hint})`;
      }
      
      toast.error(userMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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

  const avatarUrl = profile?.profile_image_url || profile?.profile_pic_url;

  return (
    <div className="space-y-6 bottom-nav-safe">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar Section with History */}
            <div className="flex flex-col items-center space-y-4">
              <ProfileImageUploaderWithHistory
                userId={user.id}
                currentImageUrl={avatarUrl}
                displayName={formData.display_name}
                emoji={formData.wolf_emoji}
                onSuccess={(newImageUrl) => {
                  setFormData(prev => ({
                    ...prev,
                    profile_image_url: newImageUrl
                  }));
                  loadProfile();
                }}
              />
              
              <div className="text-center">
                <p className="font-medium">{formData.display_name || 'Your Name'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={formData.is_profile_visible ? "default" : "secondary"}>
                    {formData.is_profile_visible ? (
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted text-muted-foreground"
                placeholder="Your email address"
              />
              <p className="text-xs text-muted-foreground">
                This is your account email and cannot be changed here
              </p>
            </div>

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
                  title="Select your gender"
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {GENDER_DISPLAY_MAP[option] || option}
                    </option>
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
                checked={formData.is_profile_visible}
                onChange={(e) => handleInputChange('is_profile_visible', e.target.checked)}
                className="rounded"
                title="Make profile visible to other wolves"
              />
              <Label htmlFor="is-visible" className="flex items-center gap-2 cursor-pointer">
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
              Express your personality and what you&apos;re looking for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Wolf Emoji</Label>
              <div className="grid grid-cols-8 gap-2">
                {WOLF_EMOJIS.map((emoji, index) => (
                  <button
                    key={`wolf-emoji-${index}-${emoji}`}
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
                title="Select your current vibe"
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
                title="What are you looking for"
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

            <div className="space-y-2">
              <Label htmlFor="favorite-bartender">
                Favorite Bartender
              </Label>
              <Input
                id="favorite-bartender"
                value={formData.favorite_bartender}
                onChange={(e) => handleInputChange('favorite_bartender', e.target.value)}
                placeholder="Who makes the best drinks?"
              />
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
                      checked={formData.is_profile_visible}
                      onChange={(e) => handleInputChange('is_profile_visible', e.target.checked)}
                      className="rounded"
                      aria-label="Toggle profile visibility"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Allow Messages</p>
                    <p className="text-sm text-muted-foreground">
                      Let other wolves send you private messages
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="messages-toggle"
                      checked={formData.allow_messages}
                      onChange={(e) => handleInputChange('allow_messages', e.target.checked)}
                      className="rounded"
                      aria-label="Toggle message permissions"
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