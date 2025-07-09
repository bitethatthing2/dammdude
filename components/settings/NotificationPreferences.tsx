'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Bell, BellOff, Smartphone, Mail, Calendar, MessageSquare, ShoppingCart, Users, Heart } from 'lucide-react';

interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export function NotificationPreferences() {
  const { user, supabase } = useSupabase();
  const { 
    isEnabled, 
    hasPermission, 
    isLoading: notificationLoading, 
    enableNotifications,
    subscribeToTopic,
    unsubscribeFromTopic
  } = useNotifications();

  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Default notification preferences
  const defaultPreferences: Omit<NotificationPreference, 'enabled'>[] = [
    {
      key: 'events',
      label: 'Events & Activities',
      description: 'DJ events, contests, and special activities',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      key: 'announcements',
      label: 'Important Updates',
      description: 'Important announcements from staff',
      icon: <Bell className="h-4 w-4" />
    },
    {
      key: 'chat_messages',
      label: 'Chat Messages',
      description: 'Private messages and chat notifications',
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      key: 'order_updates',
      label: 'Order Updates',
      description: 'Order status and pickup notifications',
      icon: <ShoppingCart className="h-4 w-4" />
    },
    {
      key: 'member_activity',
      label: 'Member Activity',
      description: 'Wolfpack member interactions and updates',
      icon: <Users className="h-4 w-4" />
    },
    {
      key: 'social_interactions',
      label: 'Social Interactions',
      description: 'Winks, profile views, and social features',
      icon: <Heart className="h-4 w-4" />
    },
    {
      key: 'marketing',
      label: 'Promotions & Offers',
      description: 'Marketing content and special offers',
      icon: <Mail className="h-4 w-4" />
    }
  ];

  // Load current preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const currentPrefs = data?.notification_preferences || {};
        
        const loadedPreferences = defaultPreferences.map(pref => ({
          ...pref,
          enabled: currentPrefs[pref.key] ?? true // Default to true if not set
        }));

        setPreferences(loadedPreferences);
        setPushEnabled(isEnabled && hasPermission);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        // Use defaults if loading fails
        setPreferences(defaultPreferences.map(pref => ({ ...pref, enabled: true })));
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user, supabase, isEnabled, hasPermission]);

  // Handle push notification toggle
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && !hasPermission) {
      const success = await enableNotifications();
      setPushEnabled(success);
    } else {
      setPushEnabled(enabled);
    }
  };

  // Handle preference toggle
  const handlePreferenceToggle = async (key: string, enabled: boolean) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update local state immediately
      setPreferences(prev => 
        prev.map(pref => 
          pref.key === key ? { ...pref, enabled } : pref
        )
      );

      // Update database
      const updatedPrefs = preferences.reduce((acc, pref) => {
        acc[pref.key] = pref.key === key ? enabled : pref.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', user.id);

      if (error) throw error;

      // Update topic subscription if push notifications are enabled
      if (pushEnabled) {
        if (enabled) {
          await subscribeToTopic(key);
        } else {
          await unsubscribeFromTopic(key);
        }
      }

    } catch (error) {
      console.error('Error updating notification preference:', error);
      // Revert local state on error
      setPreferences(prev => 
        prev.map(pref => 
          pref.key === key ? { ...pref, enabled: !enabled } : pref
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save all preferences
  const handleSaveAll = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const prefsObject = preferences.reduce((acc, pref) => {
        acc[pref.key] = pref.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: prefsObject })
        .eq('id', user.id);

      if (error) throw error;

      // Update all topic subscriptions if push notifications are enabled
      if (pushEnabled) {
        for (const pref of preferences) {
          if (pref.enabled) {
            await subscribeToTopic(pref.key);
          } else {
            await unsubscribeFromTopic(pref.key);
          }
        }
      }

    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Loading your notification settings...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </div>
                <div className="h-6 w-10 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose what notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Smartphone className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <Label className="text-base font-medium">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {hasPermission 
                  ? 'Receive notifications even when the app is closed' 
                  : 'Enable to receive notifications when app is closed'
                }
              </p>
            </div>
          </div>
          <Switch
            checked={pushEnabled}
            onCheckedChange={handlePushToggle}
            disabled={notificationLoading}
          />
        </div>

        {/* Individual Preferences */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Notification Types
          </h3>
          
          {preferences.map((preference) => (
            <div 
              key={preference.key} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {preference.icon}
                </div>
                <div>
                  <Label className="font-medium cursor-pointer">
                    {preference.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {preference.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={preference.enabled}
                onCheckedChange={(enabled) => handlePreferenceToggle(preference.key, enabled)}
                disabled={isSaving}
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save All Preferences'}
          </Button>
          
          {!hasPermission && (
            <Button 
              variant="outline" 
              onClick={() => handlePushToggle(true)}
              disabled={notificationLoading}
              className="flex items-center gap-2"
            >
              <BellOff className="h-4 w-4" />
              Enable Push
            </Button>
          )}
        </div>

        {/* Status Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Status: {hasPermission ? '✅ Push notifications enabled' : '❌ Push notifications disabled'}</p>
          <p>You can change these settings anytime in your browser or device settings.</p>
        </div>
      </CardContent>
    </Card>
  );
}