'use client';

import { useState, useEffect } from 'react';
import { Save, X, Loader2, Shield, MapPin, Bell, Volume2, Gift, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  getTopicsForRole, 
  getSubscribedTopics, 
  updateNotificationPreferences 
} from '@/lib/notifications';
import type { NotificationTopic, UserRole } from '@/types/notifications';

interface NotificationPreferencesProps {
  fcmToken: string;
  userRole?: UserRole;
  onClose?: () => void;
}

const topicIcons = {
  all_users: Bell,
  wolfpack_salem: MapPin,
  wolfpack_portland: MapPin,
  new_orders: Shield,
  order_updates: Bell,
  dj_events: Volume2,
  promotions: Gift,
  announcements: Megaphone,
  staff_alerts: Shield
};

export default function NotificationPreferences({
  fcmToken,
  userRole,
  onClose
}: NotificationPreferencesProps) {
  const [availableTopics, setAvailableTopics] = useState<NotificationTopic[]>([]);
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load available topics and current subscriptions
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get topics available for user's role
        const { topics, error: topicsError } = await getTopicsForRole(userRole);
        if (topicsError) {
          throw new Error(topicsError.toString());
        }

        // Get current subscriptions
        const { topics: subscribed, error: subscriptionsError } = await getSubscribedTopics(fcmToken);
        if (subscriptionsError) {
          throw new Error(subscriptionsError.toString());
        }

        setAvailableTopics(topics);
        setSubscribedTopics(subscribed);

        // Initialize preferences state
        const initialPreferences: Record<string, boolean> = {};
        topics.forEach(topic => {
          initialPreferences[topic.topic_key] = subscribed.includes(topic.topic_key);
        });
        setPreferences(initialPreferences);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
        setError(errorMessage);
        console.error('Error loading notification preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    if (fcmToken) {
      loadData();
    }
  }, [fcmToken, userRole]);

  const handleToggle = (topicKey: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [topicKey]: enabled
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Calculate what needs to be subscribed/unsubscribed
      const topicsToSubscribe: string[] = [];
      const topicsToUnsubscribe: string[] = [];

      Object.entries(preferences).forEach(([topicKey, enabled]) => {
        const wasSubscribed = subscribedTopics.includes(topicKey);
        
        if (enabled && !wasSubscribed) {
          topicsToSubscribe.push(topicKey);
        } else if (!enabled && wasSubscribed) {
          topicsToUnsubscribe.push(topicKey);
        }
      });

      // Update subscriptions
      const { success, error: updateError } = await updateNotificationPreferences(
        fcmToken,
        topicsToSubscribe,
        topicsToUnsubscribe
      );

      if (!success) {
        const errorMessage = updateError instanceof Error ? updateError.message : 
                           updateError || 'Failed to update preferences';
        throw new Error(errorMessage);
      }

      // Update local state
      const newSubscriptions = Object.entries(preferences)
        .filter(([, enabled]) => enabled)
        .map(([topicKey]) => topicKey);
      
      setSubscribedTopics(newSubscriptions);
      setHasChanges(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(errorMessage);
      console.error('Error saving notification preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset preferences to current subscriptions
    const resetPreferences: Record<string, boolean> = {};
    availableTopics.forEach(topic => {
      resetPreferences[topic.topic_key] = subscribedTopics.includes(topic.topic_key);
    });
    setPreferences(resetPreferences);
    setHasChanges(false);
    
    if (onClose) {
      onClose();
    }
  };

  const getTopicIcon = (topicKey: string) => {
    const IconComponent = topicIcons[topicKey as keyof typeof topicIcons] || Bell;
    return IconComponent;
  };

  const getTopicCategory = (topic: NotificationTopic) => {
    if (topic.topic_key.startsWith('wolfpack_')) return 'Wolf Pack';
    if (topic.requires_role) return 'Staff Only';
    if (topic.topic_key.includes('order')) return 'Orders';
    if (topic.topic_key.includes('event') || topic.topic_key.includes('dj')) return 'Events';
    return 'General';
  };

  // Group topics by category
  const groupedTopics = availableTopics.reduce((groups, topic) => {
    const category = getTopicCategory(topic);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(topic);
    return groups;
  }, {} as Record<string, NotificationTopic[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading preferences...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Role Badge */}
        {userRole && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {userRole} Access
            </Badge>
            <span className="text-sm text-muted-foreground">
              You can access {availableTopics.length} notification topics
            </span>
          </div>
        )}

        {/* Topic Groups */}
        {Object.entries(groupedTopics).map(([category, topics]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {category}
            </h3>
            
            <div className="space-y-3">
              {topics.map((topic) => {
                const IconComponent = getTopicIcon(topic.topic_key);
                const isEnabled = preferences[topic.topic_key] || false;
                
                return (
                  <div
                    key={topic.topic_key}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Label 
                            htmlFor={topic.topic_key}
                            className="font-medium cursor-pointer"
                          >
                            {topic.display_name}
                          </Label>
                          {topic.requires_role && (
                            <Badge variant="secondary" className="text-xs">
                              {topic.requires_role}
                            </Badge>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground">
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Switch
                      id={topic.topic_key}
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(topic.topic_key, checked)}
                      disabled={saving}
                    />
                  </div>
                );
              })}
            </div>
            
            {category !== Object.keys(groupedTopics)[Object.keys(groupedTopics).length - 1] && (
              <Separator />
            )}
          </div>
        ))}

        {availableTopics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notification topics available for your account.</p>
          </div>
        )}

        {/* Action Buttons */}
        {availableTopics.length > 0 && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Subscription Summary */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4" />
            <span className="font-medium">Current Subscriptions</span>
          </div>
          <p>
            You are subscribed to {Object.values(preferences).filter(Boolean).length} of {availableTopics.length} available topics.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
