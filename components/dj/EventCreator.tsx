'use client';

import { useState } from 'react';
import { CenteredModal } from '@/components/shared/CenteredModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Trophy, Music, Star, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { 
  BroadcastType,
  Database,
  BroadcastOption
} from '@/types/dj-dashboard-schema';

interface Member {
  id: string;
  displayName: string;
  profilePicture?: string;
}

interface EventCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (broadcast: Database['public']['Tables']['dj_broadcasts']['Row']) => void;
  availableMembers: Member[];
  location: 'salem' | 'portland';
}

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  broadcastType: BroadcastType;
  defaultDuration: number;
  suggestedContestants: number;
  defaultOptions?: BroadcastOption[];
}

const LOCATION_CONFIG = {
  salem: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
  portland: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
} as const;

const eventTemplates: EventTemplate[] = [
  {
    id: 'freestyle-friday',
    name: 'Freestyle Friday',
    description: 'Rap battle and freestyle competition',
    icon: Mic,
    broadcastType: 'contest',
    defaultDuration: 180,
    suggestedContestants: 4,
    defaultOptions: [
      { id: '1', text: 'Contestant 1', emoji: '1️⃣' },
      { id: '2', text: 'Contestant 2', emoji: '2️⃣' },
      { id: '3', text: 'Contestant 3', emoji: '3️⃣' },
      { id: '4', text: 'Contestant 4', emoji: '4️⃣' }
    ]
  },
  {
    id: 'costume-contest',
    name: 'Costume Contest',
    description: 'Best dressed competition',
    icon: Star,
    broadcastType: 'contest',
    defaultDuration: 120,
    suggestedContestants: 6,
    defaultOptions: [
      { id: '1', text: 'Best Overall', emoji: '👑' },
      { id: '2', text: 'Most Creative', emoji: '🎨' },
      { id: '3', text: 'Funniest', emoji: '😂' },
      { id: '4', text: 'Scariest', emoji: '👻' }
    ]
  },
  {
    id: 'dance-battle',
    name: 'Dance Battle',
    description: 'Show off your moves',
    icon: Music,
    broadcastType: 'contest',
    defaultDuration: 150,
    suggestedContestants: 4,
    defaultOptions: [
      { id: '1', text: 'Dancer 1', emoji: '💃' },
      { id: '2', text: 'Dancer 2', emoji: '🕺' },
      { id: '3', text: 'Dancer 3', emoji: '💃' },
      { id: '4', text: 'Dancer 4', emoji: '🕺' }
    ]
  },
  {
    id: 'trivia-night',
    name: 'Trivia Challenge',
    description: 'Test your knowledge',
    icon: Trophy,
    broadcastType: 'poll',
    defaultDuration: 60,
    suggestedContestants: 8,
    defaultOptions: [
      { id: '1', text: 'Team A', emoji: '🅰️' },
      { id: '2', text: 'Team B', emoji: '🅱️' },
      { id: '3', text: 'Team C', emoji: '©️' },
      { id: '4', text: 'Team D', emoji: '🆔' }
    ]
  }
];

export function EventCreator({ isOpen, onClose, onEventCreated, availableMembers, location }: EventCreatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [duration, setDuration] = useState(120);
  const [selectedContestants, setSelectedContestants] = useState<string[]>([]);
  const [votingOptions, setVotingOptions] = useState<BroadcastOption[]>([
    { id: '1', text: 'Option 1', emoji: '1️⃣' },
    { id: '2', text: 'Option 2', emoji: '2️⃣' }
  ]);
  const [isCustomEvent, setIsCustomEvent] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showResultsLive, setShowResultsLive] = useState(false);

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setEventTitle(template.name);
    setEventDescription(template.description);
    setDuration(template.defaultDuration);
    setIsCustomEvent(false);
    if (template.defaultOptions) {
      setVotingOptions(template.defaultOptions);
    }
  };

  const handleCustomEvent = () => {
    setSelectedTemplate(null);
    setEventTitle('');
    setEventDescription('');
    setDuration(120);
    setIsCustomEvent(true);
    setVotingOptions([
      { id: '1', text: 'Option 1', emoji: '1️⃣' },
      { id: '2', text: 'Option 2', emoji: '2️⃣' }
    ]);
  };

  const addContestant = (memberId: string) => {
    if (!selectedContestants.includes(memberId)) {
      setSelectedContestants([...selectedContestants, memberId]);
    }
  };

  const removeContestant = (memberId: string) => {
    setSelectedContestants(selectedContestants.filter(id => id !== memberId));
  };

  const addVotingOption = () => {
    const newOption: BroadcastOption = {
      id: Date.now().toString(),
      text: `Option ${votingOptions.length + 1}`,
      emoji: `${votingOptions.length + 1}️⃣`
    };
    setVotingOptions([...votingOptions, newOption]);
  };

  const updateVotingOption = (id: string, field: keyof BroadcastOption, value: string) => {
    setVotingOptions(votingOptions.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const removeVotingOption = (id: string) => {
    if (votingOptions.length > 2) {
      setVotingOptions(votingOptions.filter(opt => opt.id !== id));
    }
  };

  const createEvent = async () => {
    if (!eventTitle.trim()) {
      toast.error('Event title is required');
      return;
    }

    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication required');
        return;
      }

      const locationId = LOCATION_CONFIG[location];
      const broadcastType = selectedTemplate?.broadcastType || 'contest';

      // Build the message with contestant names if applicable
      let message = eventDescription || `Join us for ${eventTitle}!`;
      if (selectedContestants.length > 0 && availableMembers.length > 0) {
        const contestantNames = selectedContestants
          .map(id => availableMembers.find(m => m.id === id)?.displayName)
          .filter(Boolean)
          .join(', ');
        if (contestantNames) {
          message += `\n\nFeaturing: ${contestantNames}`;
        }
      }

      // Create broadcast for the event
      const broadcastData: Database['public']['Tables']['dj_broadcasts']['Insert'] = {
        dj_id: user.id,
        location_id: locationId,
        broadcast_type: broadcastType,
        title: `🎉 ${eventTitle}`,
        message: message,
        subtitle: `${votingOptions.length} options • ${duration}s to vote`,
        priority: 'high',
        duration_seconds: duration,
        auto_close: false,
        status: 'active',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + duration * 1000).toISOString(),
        // Event styling
        background_color: '#f97316',
        text_color: '#ffffff',
        accent_color: '#fbbf24',
        animation_type: 'bounce',
        emoji_burst: ['🎉', '🔥', '⭐', '🏆'],
        // Voting configuration
        interaction_config: {
          response_type: 'multiple_choice',
          options: votingOptions,
          allow_multiple: false,
          show_results_live: showResultsLive,
          anonymous_responses: false,
          show_responders: true,
          highlight_responders: true,
          responder_display: 'avatar_with_name',
          animation_on_select: 'pulse',
          show_timer: true,
          countdown_seconds: duration
        },
        // Tag as event
        tags: ['event', broadcastType],
        category: 'event'
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

      toast.success(`Event "${eventTitle}" created successfully!`);
      onEventCreated(data);
      onClose();
      resetForm();

    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setEventTitle('');
    setEventDescription('');
    setDuration(120);
    setSelectedContestants([]);
    setVotingOptions([
      { id: '1', text: 'Option 1', emoji: '1️⃣' },
      { id: '2', text: 'Option 2', emoji: '2️⃣' }
    ]);
    setIsCustomEvent(false);
    setShowResultsLive(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Event"
      maxWidth="4xl"
    >
      <div className="p-6">
        <div className="space-y-6">
          {/* Event Template Selection */}
          {!selectedTemplate && !isCustomEvent && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Event Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventTemplates.map(template => {
                  const IconComponent = template.icon;
                  return (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <IconComponent className="w-5 h-5" />
                          {template.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{template.broadcastType}</Badge>
                          <Badge variant="outline">{template.defaultDuration}s</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleCustomEvent}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Event
              </Button>
            </div>
          )}

          {/* Event Configuration */}
          {(selectedTemplate || isCustomEvent) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Event Configuration</h3>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Event Title</label>
                  <Input 
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (seconds)</label>
                  <Input 
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 120)}
                    min="30"
                    max="600"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Event Description</label>
                <Textarea 
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Describe the event and rules"
                  rows={3}
                />
              </div>

              {/* Contestant Selection (optional) */}
              {availableMembers.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Contestants (optional - {selectedContestants.length} selected)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                    {availableMembers.map(member => (
                      <div 
                        key={member.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedContestants.includes(member.id) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => 
                          selectedContestants.includes(member.id) 
                            ? removeContestant(member.id)
                            : addContestant(member.id)
                        }
                      >
                        <img 
                          src={member.profilePicture || '/images/avatar-placeholder.png'} 
                          alt={member.displayName}
                          className="w-6 h-6 rounded-full bg-muted"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/avatar-placeholder.png';
                          }}
                        />
                        <span className="text-xs">{member.displayName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Voting Options */}
              <div>
                <label className="text-sm font-medium mb-2 block">Voting Options</label>
                <div className="space-y-2">
                  {votingOptions.map((option) => (
                    <div key={option.id} className="flex gap-2">
                      <Input
                        value={option.emoji || ''}
                        onChange={(e) => updateVotingOption(option.id, 'emoji', e.target.value)}
                        className="w-16 text-center"
                        placeholder="🔵"
                        maxLength={2}
                      />
                      <Input 
                        value={option.text}
                        onChange={(e) => updateVotingOption(option.id, 'text', e.target.value)}
                        placeholder={`Option ${votingOptions.findIndex(o => o.id === option.id) + 1}`}
                      />
                      {votingOptions.length > 2 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeVotingOption(option.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={addVotingOption}
                    disabled={votingOptions.length >= 6}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-results"
                  checked={showResultsLive}
                  onChange={(e) => setShowResultsLive(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="show-results" className="text-sm">
                  Show voting results live (uncheck to reveal at the end)
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  onClick={createEvent} 
                  className="flex-1"
                  disabled={!eventTitle.trim() || isCreating}
                >
                  {isCreating ? 'Creating Event...' : 'Create Event & Send Broadcast'}
                </Button>
                <Button variant="outline" onClick={handleClose} className="sm:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CenteredModal>
  );
}