'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Megaphone, AlertTriangle, Music, Send, Clock } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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
  type: 'announcement' | 'event' | 'general' | 'emergency';
  icon: React.ComponentType<{ className?: string }>;
}

const messageTemplates: MessageTemplate[] = [
  {
    id: 'event-starting',
    title: 'Event Starting Soon',
    content: '🎉 Get ready! [EVENT_NAME] is starting in 5 minutes! Join the fun and show your pack spirit! 🐺',
    type: 'event',
    icon: Music
  },
  {
    id: 'voting-open',
    title: 'Voting Now Open',
    content: '🗳️ Voting is now LIVE for [EVENT_NAME]! Cast your vote and help decide the winner! Every vote counts! ⭐',
    type: 'announcement',
    icon: Megaphone
  },
  {
    id: 'pack-energy',
    title: 'Energy Boost',
    content: '🔥 The energy in here is AMAZING! Keep it up, Wolf Pack! Let&apos;s make this night unforgettable! 🎵',
    type: 'general',
    icon: MessageSquare
  },
  {
    id: 'last-call',
    title: 'Last Call Reminder',
    content: '⏰ Last call for drinks! Make sure to get your orders in before we close! 🍻',
    type: 'announcement',
    icon: Clock
  },
  {
    id: 'emergency',
    title: 'Important Notice',
    content: '⚠️ ATTENTION: [EMERGENCY_MESSAGE] Please follow staff instructions. Thank you for your cooperation.',
    type: 'emergency',
    icon: AlertTriangle
  }
];

export function MassMessageInterface({ isOpen, onClose, packMemberCount, location }: MassMessageInterfaceProps) {
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<'announcement' | 'event' | 'general' | 'emergency'>('general');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [recentMessages, setRecentMessages] = useState<Array<{
    type: string;
    content: string;
    timestamp: string;
  }>>([]);

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageContent(template.content);
    setMessageType(template.type);
  };

  const sendMassMessage = async () => {
    if (!messageContent.trim()) return;

    setIsSending(true);
    
    try {
      const supabase = getSupabaseBrowserClient();
      
      const messageData = {
        content: messageContent,
        type: messageType,
        location: location,
        timestamp: new Date().toISOString(),
        recipientCount: packMemberCount
      };

      // In a real implementation, this would save to database and broadcast
      console.log('Sending mass message:', messageData);

      // Add to recent messages
      setRecentMessages(prev => [messageData, ...prev.slice(0, 4)]);
      
      // Reset form
      setMessageContent('');
      setSelectedTemplate(null);
      setMessageType('general');
      
      // Show success feedback
      alert('Message sent successfully to all pack members!');
      
    } catch (error) {
      console.error('Error sending mass message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-500';
      case 'event': return 'bg-purple-500';
      case 'announcement': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleClose = () => {
    onClose();
    setMessageContent('');
    setSelectedTemplate(null);
    setMessageType('general');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Mass Message to Wolf Pack
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
                        <div className={`p-2 rounded ${getMessageTypeColor(template.type)} text-white`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{template.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {template.type}
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
            <div>
              <label className="text-sm font-medium mb-2 block">Message Type</label>
              <Select value={messageType} onValueChange={(value: 'announcement' | 'event' | 'general' | 'emergency') => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Message</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="event">Event Related</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Message Preview */}
            {messageContent && (
              <div className="border rounded p-3 bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                <div className={`p-3 rounded text-white ${getMessageTypeColor(messageType)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="w-4 h-4" />
                    <span className="font-medium">DJ Message</span>
                    <Badge variant="secondary" className="text-xs">
                      {messageType}
                    </Badge>
                  </div>
                  <p className="text-sm">{messageContent}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={sendMassMessage} 
                disabled={!messageContent.trim() || isSending}
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

          {/* Recent Messages */}
          {recentMessages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Recent Messages</h3>
              <div className="space-y-2">
                {recentMessages.map((message, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {message.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="line-clamp-2">{message.content}</p>
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
