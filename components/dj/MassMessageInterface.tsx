'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Megaphone, AlertTriangle, Music, Send, Clock, Sparkles, Trophy, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { 
  BroadcastType,
  BroadcastPriority,
  Database 
} from '@/types/dj-dashboard-schema';

interface MassMessageInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  packMemberCount: number;
  location: 'salem' | 'portland';
}

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  type: BroadcastType;
  priority: BroadcastPriority;
  icon: React.ComponentType<{ className?: string }>;
  duration: number;
  emoji_burst?: string[];
}

const LOCATION_CONFIG = {
  salem: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
  portland: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
} as const;

const messageTemplates: MessageTemplate[] = [
  {
    id: 'event-starting',
    title: 'Event Starting Soon',
    content: '🎉 Get ready! [EVENT_NAME] is starting in 5 minutes! Join the fun and show your pack spirit! 🐺',
    type: 'general',
    priority: 'high',
    icon: Music,
    duration: 30,
    emoji_burst: ['🎉', '🐺', '⭐']
  },
  {
    id: 'voting-open',
    title: 'Voting Now Open',
    content: '🗳️ Voting is now LIVE for [EVENT_NAME]! Cast your vote and help decide the winner! Every vote counts! ⭐',
    type: 'poll',
    priority: 'high',
    icon: Megaphone,
    duration: 60,
    emoji_burst: ['🗳️', '⭐', '🔥']
  },
  {
    id: 'vibe-check',
    title: 'Vibe Check',
    content: '✨ Quick vibe check! How\'s everyone feeling tonight? Drop your energy level in the chat! 🔥',
    type: 'vibe_check',
    priority: 'normal',
    icon: Sparkles,
    duration: 45,
    emoji_burst: ['✨', '🔥', '💯']
  },
  {
    id: 'single-ladies',
    title: 'Single Ladies Spotlight',
    content: '💃 All the single ladies, make some noise! This one\'s for you! Get on the dance floor! 💜',
    type: 'spotlight',
    priority: 'high',
    icon: Heart,
    duration: 30,
    emoji_burst: ['💃', '💜', '✨']
  },
  {
    id: 'contest-announcement',
    title: 'Contest Time',
    content: '🏆 CONTEST ALERT! Who\'s ready to show off their skills? Big prizes up for grabs! 🎊',
    type: 'contest',
    priority: 'urgent',
    icon: Trophy,
    duration: 120,
    emoji_burst: ['🏆', '🎊', '🔥']
  },
  {
    id: 'emergency',
    title: 'Important Notice',
    content: '⚠️ ATTENTION: [EMERGENCY_MESSAGE] Please follow staff instructions. Thank you for your cooperation.',
    type: 'general',
    priority: 'urgent',
    icon: AlertTriangle,
    duration: 60,
    emoji_burst: ['⚠️']
  }
];

export function MassMessageInterface({ isOpen, onClose, packMemberCount, location }: MassMessageInterfaceProps) {
  const [messageContent, setMessageContent] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('general');
  const [priority, setPriority] = useState<BroadcastPriority>('normal');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [duration, setDuration] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Array<{
    type: BroadcastType;
    title: string;
    timestamp: string;
    responses: number;
  }>>([]);

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageTitle(template.title);
    setMessageContent(template.content);
    setBroadcastType(template.type);
    setPriority(template.priority);
    setDuration(template.duration);
  };

  const sendMassMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast.error('Please provide both title and message');
      return;
    }

    setIsSending(true);
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('Authentication required');
        return;
      }

      const locationId = LOCATION_CONFIG[location];
      
      // Create broadcast using the new schema
      const broadcastData: Database['public']['Tables']['dj_broadcasts']['Insert'] = {
        dj_id: user.id,
        location_id: locationId,
        broadcast_type: broadcastType,
        title: messageTitle,
        message: messageContent,
        priority: priority,
        duration_seconds: duration,
        auto_close: true,
        status: 'active',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + duration * 1000).toISOString(),
        // Default styling
        background_color: getTypeColor(broadcastType),
        text_color: '#ffffff',
        accent_color: '#fbbf24',
        animation_type: priority === 'urgent' ? 'shake' : 'slide',
        emoji_burst: selectedTemplate?.emoji_burst || null,
        // Basic interaction config
        interaction_config: {
          response_type: 'emoji',
          show_results_live: true,
          anonymous_responses: false
        }
      };

      const { data, error } = await supabase
        .from('dj_broadcasts')
        .insert(broadcastData)
        .select()
        .single();

      if (error) throw error;

      // Send notification
      await supabase.rpc('send_broadcast_notification', {
        p_broadcast_id: data.id
      });

      // Add to recent broadcasts
      setRecentBroadcasts(prev => [{
        type: broadcastType,
        title: messageTitle,
        timestamp: new Date().toISOString(),
        responses: 0
      }, ...prev.slice(0, 4)]);
      
      // Reset form
      setMessageTitle('');
      setMessageContent('');
      setSelectedTemplate(null);
      setBroadcastType('general');
      setPriority('normal');
      setDuration(30);
      
      toast.success(`Broadcast sent to ${packMemberCount} pack members!`);
      onClose();
      
    } catch (error) {
      console.error('Error sending mass message:', error);
      toast.error('Failed to send broadcast. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getTypeColor = (type: BroadcastType): string => {
    const colors: Record<BroadcastType, string> = {
      general: '#3b82f6',
      shout_out: '#8b5cf6',
      poll: '#10b981',
      quick_response: '#f59e0b',
      song_request: '#ec4899',
      contest: '#f97316',
      spotlight: '#6366f1',
      vibe_check: '#ef4444',
      custom: '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const getPriorityBadgeVariant = (priority: BroadcastPriority): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
    }
  };

  const handleClose = () => {
    onClose();
    setMessageTitle('');
    setMessageContent('');
    setSelectedTemplate(null);
    setBroadcastType('general');
    setPriority('normal');
    setDuration(30);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Broadcast to Wolf Pack
            <Badge variant="outline">{packMemberCount} members</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Templates */}
          <div>
            <h3 className="text-sm font-medium mb-3">Quick Templates</h3>
            <div className="grid grid-cols-1 gap-2">
              {messageTemplates.map(template => {
                const IconComponent = template.icon;
                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div 
                          className="p-2 rounded text-white"
                          style={{ backgroundColor: getTypeColor(template.type) }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{template.title}</span>
                            <Badge variant={getPriorityBadgeVariant(template.priority)} className="text-xs">
                              {template.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.duration}s
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Message Composition */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Broadcast Type</label>
                <Select value={broadcastType} onValueChange={(value: BroadcastType) => setBroadcastType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Message</SelectItem>
                    <SelectItem value="shout_out">Shout Out</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="quick_response">Quick Response</SelectItem>
                    <SelectItem value="song_request">Song Request</SelectItem>
                    <SelectItem value="contest">Contest</SelectItem>
                    <SelectItem value="spotlight">Spotlight</SelectItem>
                    <SelectItem value="vibe_check">Vibe Check</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priority} onValueChange={(value: BroadcastPriority) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">🚨 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Enter broadcast title..."
                className="w-full px-3 py-2 border rounded-md"
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message Content</label>
              <Textarea 
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message to the Wolf Pack..."
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {messageContent.length}/500 characters
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration: {duration} seconds
              </label>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Message Preview */}
            {(messageTitle || messageContent) && (
              <div className="border rounded p-3 bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                <div 
                  className="p-3 rounded text-white"
                  style={{ backgroundColor: getTypeColor(broadcastType) }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="w-4 h-4" />
                    <span className="font-medium">{messageTitle || 'Broadcast Title'}</span>
                    <Badge variant="secondary" className="text-xs">
                      {broadcastType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm">{messageContent || 'Your message will appear here...'}</p>
                  {selectedTemplate?.emoji_burst && (
                    <div className="mt-2 text-lg">
                      {selectedTemplate.emoji_burst.join(' ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={sendMassMessage} 
                disabled={!messageTitle.trim() || !messageContent.trim() || isSending || packMemberCount === 0}
                className="flex-1"
              >
                {isSending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {packMemberCount} Members
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Recent Broadcasts */}
          {recentBroadcasts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Recent Broadcasts</h3>
              <div className="space-y-2">
                {recentBroadcasts.map((broadcast, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {broadcast.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(broadcast.timestamp).toLocaleTimeString()}
                      </span>
                      {broadcast.responses > 0 && (
                        <span className="text-muted-foreground">
                          • {broadcast.responses} responses
                        </span>
                      )}
                    </div>
                    <p className="font-medium">{broadcast.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}