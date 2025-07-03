'use client';

import { useState } from 'react';
import { CenteredModal } from '@/components/shared/CenteredModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Mic, 
  Trophy, 
  Music, 
  Star, 
  Plus, 
  X,
  Sparkles,
  Zap,
  Crown,
  Palette,
  Eye,
  Wand2,
  PartyPopper,
  Flame,
  Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { 
  BroadcastType,
  BroadcastOption
} from '@/lib/types/dj-dashboard-types';
import type { Database } from '@/lib/database.types';

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
  energy: 'chill' | 'medium' | 'hype' | 'explosive';
  bgGradient: string;
  emoji: string;
}

// Tab types
type TabValue = 'templates' | 'custom' | 'preview';

const LOCATION_CONFIG = {
  salem: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
  portland: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
} as const;

const eventTemplates: EventTemplate[] = [
  {
    id: 'dance-off',
    name: 'Dance Floor Takeover',
    description: 'Who owns the dance floor tonight?',
    icon: Music,
    broadcastType: 'contest',
    defaultDuration: 180,
    suggestedContestants: 4,
    defaultOptions: [
      { id: '1', text: 'Sexiest Moves 🔥', emoji: '🔥' },
      { id: '2', text: 'Best Freestyle 💫', emoji: '💫' },
      { id: '3', text: 'Crowd Control 👑', emoji: '👑' },
      { id: '4', text: 'Energy Bomb 💥', emoji: '💥' }
    ],
    energy: 'explosive',
    bgGradient: 'from-purple-600 to-pink-600',
    emoji: '💃'
  },
  {
    id: 'best-dressed',
    name: 'Drip Check Championship',
    description: 'Who\'s got the hottest fit tonight?',
    icon: Crown,
    broadcastType: 'contest',
    defaultDuration: 120,
    suggestedContestants: 6,
    defaultOptions: [
      { id: '1', text: 'Freshest Fit 💧', emoji: '💧' },
      { id: '2', text: 'Designer Drip 💎', emoji: '💎' },
      { id: '3', text: 'Street Style 🔥', emoji: '🔥' },
      { id: '4', text: 'Club Royalty 👑', emoji: '👑' }
    ],
    energy: 'hype',
    bgGradient: 'from-black to-gold',
    emoji: '✨'
  },
  {
    id: 'shot-challenge',
    name: 'Shot O\'Clock Showdown',
    description: 'Who can handle the heat? Shots competition!',
    icon: Trophy,
    broadcastType: 'contest',
    defaultDuration: 90,
    suggestedContestants: 8,
    defaultOptions: [
      { id: '1', text: 'Tequila Warrior 🥃', emoji: '🥃' },
      { id: '2', text: 'Vodka Viking 🧊', emoji: '🧊' },
      { id: '3', text: 'Whiskey Legend 🥂', emoji: '🥂' },
      { id: '4', text: 'Last One Standing 🏆', emoji: '🏆' }
    ],
    energy: 'explosive',
    bgGradient: 'from-amber-600 to-red-600',
    emoji: '🥃'
  },
  {
    id: 'singles-spotlight',
    name: 'Single & Ready Spotlight',
    description: 'Singles take over the floor - who\'s catching eyes?',
    icon: Heart,
    broadcastType: 'spotlight',
    defaultDuration: 120,
    suggestedContestants: 0,
    defaultOptions: [
      { id: '1', text: 'Hottest Single 🔥', emoji: '🔥' },
      { id: '2', text: 'Best Vibe 💫', emoji: '💫' },
      { id: '3', text: 'Most Confident 💪', emoji: '💪' },
      { id: '4', text: 'Crowd Favorite ❤️', emoji: '❤️' }
    ],
    energy: 'hype',
    bgGradient: 'from-red-600 to-pink-600',
    emoji: '💕'
  },
  {
    id: 'twerk-off',
    name: 'Twerk Tournament',
    description: 'Show what you got - booty battle royale!',
    icon: Flame,
    broadcastType: 'contest',
    defaultDuration: 150,
    suggestedContestants: 6,
    defaultOptions: [
      { id: '1', text: 'Best Technique 🍑', emoji: '🍑' },
      { id: '2', text: 'Crowd Goes Wild 🔥', emoji: '🔥' },
      { id: '3', text: 'Non-Stop Energy ⚡', emoji: '⚡' },
      { id: '4', text: 'Championship Worthy 🏆', emoji: '🏆' }
    ],
    energy: 'explosive',
    bgGradient: 'from-purple-600 to-red-600',
    emoji: '🍑'
  },
  {
    id: 'vip-battle',
    name: 'VIP Section Wars',
    description: 'Which VIP table brings the most energy?',
    icon: Star,
    broadcastType: 'poll',
    defaultDuration: 180,
    suggestedContestants: 0,
    defaultOptions: [
      { id: '1', text: 'Table 1 - The Ballers 💸', emoji: '💸' },
      { id: '2', text: 'Table 2 - The Party Crew 🎉', emoji: '🎉' },
      { id: '3', text: 'Table 3 - The Wild Ones 😈', emoji: '😈' },
      { id: '4', text: 'Table 4 - The Legends 👑', emoji: '👑' }
    ],
    energy: 'hype',
    bgGradient: 'from-gold to-black',
    emoji: '🍾'
  },
  {
    id: 'body-shots',
    name: 'Body Shot Challenge',
    description: 'Things are getting spicy - who\'s brave enough?',
    icon: Zap,
    broadcastType: 'contest',
    defaultDuration: 120,
    suggestedContestants: 4,
    defaultOptions: [
      { id: '1', text: 'Most Creative 🎨', emoji: '🎨' },
      { id: '2', text: 'Sexiest Shot 🔥', emoji: '🔥' },
      { id: '3', text: 'Crowd Favorite 💋', emoji: '💋' },
      { id: '4', text: 'Wild Card 😈', emoji: '😈' }
    ],
    energy: 'explosive',
    bgGradient: 'from-red-600 to-purple-600',
    emoji: '💋'
  },
  {
    id: 'freestyle-cypher',
    name: 'Freestyle Cypher Circle',
    description: 'Spit bars, drop beats, own the mic',
    icon: Mic,
    broadcastType: 'contest',
    defaultDuration: 240,
    suggestedContestants: 8,
    defaultOptions: [
      { id: '1', text: 'Sickest Bars 🎤', emoji: '🎤' },
      { id: '2', text: 'Best Flow 🌊', emoji: '🌊' },
      { id: '3', text: 'Crowd Reaction 🔥', emoji: '🔥' },
      { id: '4', text: 'Lyrical Genius 🧠', emoji: '🧠' }
    ],
    energy: 'hype',
    bgGradient: 'from-black to-red',
    emoji: '🎤'
  },
  {
    id: 'bottle-wars',
    name: 'Bottle Service Wars',
    description: 'Which crew can bring the most heat with their bottles?',
    icon: PartyPopper,
    broadcastType: 'poll',
    defaultDuration: 150,
    suggestedContestants: 0,
    defaultOptions: [
      { id: '1', text: 'Best Presentation 🎆', emoji: '🎆' },
      { id: '2', text: 'Biggest Spenders 💰', emoji: '💰' },
      { id: '3', text: 'Wildest Celebration 🍾', emoji: '🍾' },
      { id: '4', text: 'VIP Energy 👑', emoji: '👑' }
    ],
    energy: 'explosive',
    bgGradient: 'from-gold to-black',
    emoji: '🍾'
  },
  {
    id: 'couples-challenge',
    name: 'Couple Goals Competition',
    description: 'Which couple runs the club tonight?',
    icon: Heart,
    broadcastType: 'contest',
    defaultDuration: 120,
    suggestedContestants: 6,
    defaultOptions: [
      { id: '1', text: 'Hottest Chemistry 🔥', emoji: '🔥' },
      { id: '2', text: 'Best Dancers 💃', emoji: '💃' },
      { id: '3', text: 'Most Style 💎', emoji: '💎' },
      { id: '4', text: 'Crowd Favorites 💕', emoji: '💕' }
    ],
    energy: 'hype',
    bgGradient: 'from-pink-600 to-red-600',
    emoji: '💑'
  }
];

// Magical emoji collections
const EMOJI_PACKS = {
  fire: ['🔥', '💥', '⚡', '✨', '💫'],
  party: ['🎉', '🎊', '🥳', '🍾', '🎆'],
  love: ['💖', '💕', '💗', '💋', '😍'],
  crown: ['👑', '🏆', '💎', '⭐', '🌟'],
  club: ['🎵', '🎶', '💃', '🕺', '🔊'],
  wild: ['😈', '🔥', '💋', '🍑', '💦'],
  money: ['💸', '💰', '💵', '💎', '🤑']
};

// Energy level descriptions
const ENERGY_LEVELS = {
  chill: { label: 'Chill Vibes', icon: '😌', color: 'text-blue-500' },
  medium: { label: 'Good Energy', icon: '😊', color: 'text-green-500' },
  hype: { label: 'Hype Mode', icon: '🔥', color: 'text-orange-500' },
  explosive: { label: 'EXPLOSIVE!', icon: '🚀', color: 'text-red-500' }
};

export function EventCreator({ isOpen, onClose, onEventCreated, availableMembers, location }: EventCreatorProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [duration, setDuration] = useState(120);
  const [selectedContestants, setSelectedContestants] = useState<string[]>([]);
  const [votingOptions, setVotingOptions] = useState<BroadcastOption[]>([
    { id: '1', text: 'Option 1', emoji: '1️⃣' },
    { id: '2', text: 'Option 2', emoji: '2️⃣' }
  ]);
  const [showResultsLive, setShowResultsLive] = useState(true);
  const [selectedEmojiPack] = useState<keyof typeof EMOJI_PACKS>('party');
  const [customBgColor] = useState('#000000');
  const [isCreating, setIsCreating] = useState(false);

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setEventTitle(template.name);
    setEventDescription(template.description);
    setDuration(template.defaultDuration);
    if (template.defaultOptions) {
      setVotingOptions(template.defaultOptions);
    }
    setActiveTab('custom');
    toast.success(`✨ ${template.name} template loaded!`);
  };

  const addVotingOption = () => {
    const emojis = ['3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
    const nextEmoji = emojis[votingOptions.length - 2] || '➕';
    
    const newOption: BroadcastOption = {
      id: Date.now().toString(),
      text: `Option ${votingOptions.length + 1}`,
      emoji: nextEmoji
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
      toast.error('🎭 Your event needs a name!');
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

      // Build the message
      let message = eventDescription || `🎉 Join us for ${eventTitle}!`;
      
      // Add contestant names if selected
      if (selectedContestants.length > 0 && availableMembers.length > 0) {
        const contestantNames = selectedContestants
          .map(id => availableMembers.find(m => m.id === id)?.displayName)
          .filter(Boolean)
          .slice(0, 4) // Limit to 4 names
          .join(' vs ');
        
        if (contestantNames) {
          message += `\n\n🌟 Featuring: ${contestantNames}`;
        }
      }

      // Convert voting options to JSON-compatible format
      const jsonVotingOptions = votingOptions.map(option => ({
        id: option.id,
        text: option.text,
        emoji: option.emoji
      }));

      // Create broadcast for the event
      const broadcastData: Database['public']['Tables']['dj_broadcasts']['Insert'] = {
        dj_id: user.id,
        location_id: locationId,
        broadcast_type: broadcastType,
        title: `${selectedTemplate?.emoji || '🎉'} ${eventTitle}`,
        message: message,
        subtitle: `${votingOptions.length} options • ${duration}s to vote`,
        priority: 'high',
        duration_seconds: duration,
        auto_close: false,
        status: 'active',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + duration * 1000).toISOString(),
        // Magical styling
        background_color: selectedTemplate ? '#000000' : customBgColor,
        text_color: '#ffffff',
        accent_color: '#fbbf24',
        animation_type: selectedTemplate?.energy === 'explosive' ? 'shake' : 
                       selectedTemplate?.energy === 'hype' ? 'bounce' : 
                       'slide',
        emoji_burst: EMOJI_PACKS[selectedEmojiPack],
        // Voting configuration - properly typed as JSON
        interaction_config: {
          response_type: 'multiple_choice',
          options: jsonVotingOptions,
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
        tags: ['event', broadcastType, selectedTemplate?.energy || 'medium'],
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

      toast.success(`🎊 "${eventTitle}" is LIVE! Let the games begin!`);
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
    setActiveTab('templates');
    setShowResultsLive(true);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Create the title element for the modal
  const modalTitle = 'Event Creator';

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="4xl"
    >
      <div className="p-0">
        {/* Modal Header with badges */}
        <div className="flex items-center gap-2 mb-6 p-4 border-b">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Event Creator</h2>
          <Badge variant="secondary" className="ml-2">
            <Zap className="w-3 h-3 mr-1" />
            Magical
          </Badge>
        </div>

        <div className="px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="templates" className="gap-2 py-3">
                <Wand2 className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2 py-3">
                <Palette className="w-4 h-4" />
                Customize
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 py-3">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <TabsContent value="templates" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventTemplates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-lg bg-gradient-to-br ${template.bgGradient} text-white border-0`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <IconComponent className="w-8 h-8" />
                          <Badge variant="secondary" className="text-black">
                            {ENERGY_LEVELS[template.energy].icon} {ENERGY_LEVELS[template.energy].label}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg mb-2">{template.emoji} {template.name}</h3>
                        <p className="text-sm opacity-90 mb-4">{template.description}</p>
                        <div className="flex items-center justify-between text-xs opacity-75">
                          <span>{template.defaultDuration}s duration</span>
                          <span>{template.suggestedContestants} contestants</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-title" className="text-sm font-medium mb-2 block">
                      Event Title
                    </Label>
                    <Input
                      id="event-title"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter event name..."
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-description" className="text-sm font-medium mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      id="event-description"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Describe your event..."
                      rows={3}
                      maxLength={250}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration-slider" className="text-sm font-medium mb-2 block">
                      Duration: {duration} seconds
                    </Label>
                    <input
                      id="duration-slider"
                      type="range"
                      min="30"
                      max="300"
                      step="15"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`Event duration: ${duration} seconds`}
                      title={`Event duration: ${duration} seconds`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>30s</span>
                      <span>5 min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Voting Options</Label>
                    <div className="space-y-2">
                      {votingOptions.map((option, index) => (
                        <div key={option.id} className="flex gap-2">
                          <Input
                            value={option.emoji}
                            onChange={(e) => updateVotingOption(option.id, 'emoji', e.target.value)}
                            className="w-16"
                            maxLength={2}
                            aria-label={`Emoji for option ${index + 1}`}
                          />
                          <Input
                            value={option.text}
                            onChange={(e) => updateVotingOption(option.id, 'text', e.target.value)}
                            className="flex-1"
                            placeholder={`Option ${index + 1}`}
                            aria-label={`Text for option ${index + 1}`}
                          />
                          {votingOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVotingOption(option.id)}
                              aria-label={`Remove option ${index + 1}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addVotingOption}
                        className="w-full"
                        disabled={votingOptions.length >= 6}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-results"
                      checked={showResultsLive}
                      onCheckedChange={setShowResultsLive}
                    />
                    <Label htmlFor="show-results">Show results live</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-bold mb-2">
                      {selectedTemplate?.emoji || '🎉'} {eventTitle || 'Event Preview'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {eventDescription || 'Your event description will appear here'}
                    </p>
                    
                    <div className="grid gap-2 max-w-md mx-auto">
                      {votingOptions.map((option) => (
                        <Button key={option.id} variant="outline" className="justify-start">
                          <span className="mr-2">{option.emoji}</span>
                          {option.text}
                        </Button>
                      ))}
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                      Duration: {duration} seconds • Live results: {showResultsLive ? 'On' : 'Off'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button
              onClick={createEvent}
              disabled={!eventTitle.trim() || isCreating}
              className="flex-1"
              size="lg"
            >
              {isCreating ? (
                'Creating Event...'
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} size="lg">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </CenteredModal>
  );
}