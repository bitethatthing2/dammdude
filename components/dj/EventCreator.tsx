'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Trophy, Music, Star, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
interface Member {
  id: string;
  displayName: string;
  profilePicture?: string;
}

interface CreatedEvent {
  id: string;
  title: string;
  description: string;
  duration: number;
  contestants: Member[];
  voting_options: string[];
  event_type: string;
  voting_type: string;
  location: string;
  status: string;
  created_at: string;
}

interface EventCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: CreatedEvent) => void;
  availableMembers: Member[];
  location: 'salem' | 'portland';
}

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  votingType: 'single' | 'multiple' | 'ranking';
  defaultDuration: number;
  suggestedContestants: number;
}

const eventTemplates: EventTemplate[] = [
  {
    id: 'freestyle-friday',
    name: 'Freestyle Friday',
    description: 'Rap battle and freestyle competition',
    icon: Mic,
    votingType: 'single',
    defaultDuration: 15,
    suggestedContestants: 4
  },
  {
    id: 'costume-contest',
    name: 'Costume Contest',
    description: 'Best dressed competition',
    icon: Star,
    votingType: 'single',
    defaultDuration: 10,
    suggestedContestants: 6
  },
  {
    id: 'dance-battle',
    name: 'Dance Battle',
    description: 'Show off your moves',
    icon: Music,
    votingType: 'single',
    defaultDuration: 12,
    suggestedContestants: 4
  },
  {
    id: 'trivia-night',
    name: 'Trivia Challenge',
    description: 'Test your knowledge',
    icon: Trophy,
    votingType: 'multiple',
    defaultDuration: 20,
    suggestedContestants: 8
  }
];

export function EventCreator({ isOpen, onClose, onEventCreated, availableMembers, location }: EventCreatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [selectedContestants, setSelectedContestants] = useState<string[]>([]);
  const [votingOptions, setVotingOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [isCustomEvent, setIsCustomEvent] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setEventTitle(template.name);
    setEventDescription(template.description);
    setDuration(template.defaultDuration);
    setIsCustomEvent(false);
  };

  const handleCustomEvent = () => {
    setSelectedTemplate(null);
    setEventTitle('');
    setEventDescription('');
    setDuration(15);
    setIsCustomEvent(true);
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
    setVotingOptions([...votingOptions, `Option ${votingOptions.length + 1}`]);
  };

  const updateVotingOption = (index: number, value: string) => {
    const newOptions = [...votingOptions];
    newOptions[index] = value;
    setVotingOptions(newOptions);
  };

  const removeVotingOption = (index: number) => {
    if (votingOptions.length > 2) {
      setVotingOptions(votingOptions.filter((_, i) => i !== index));
    }
  };

  const createEvent = async () => {
    if (!eventTitle.trim()) return;

    setIsCreating(true);
    try {      const eventData = {
        title: eventTitle,
        description: eventDescription,
        duration: duration,
        contestants: selectedContestants,
        voting_options: votingOptions,
        event_type: selectedTemplate?.id || 'custom',
        voting_type: selectedTemplate?.votingType || 'single',
        location: location,
        status: 'active',
        created_at: new Date().toISOString()
      };

      // For now, we'll just call the callback with mock data
      // In a real implementation, this would save to the database
      const selectedMembers: Member[] = selectedContestants
        .map(id => availableMembers.find(m => m.id === id))
        .filter((member): member is Member => member !== undefined);

      const mockEvent: CreatedEvent = {
        id: `event-${Date.now()}`,
        ...eventData,
        contestants: selectedMembers
      };

      onEventCreated(mockEvent);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setEventTitle('');
    setEventDescription('');
    setDuration(15);
    setSelectedContestants([]);
    setVotingOptions(['Option 1', 'Option 2']);
    setIsCustomEvent(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Template Selection */}
          {!selectedTemplate && !isCustomEvent && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Event Type</h3>
              <div className="grid grid-cols-2 gap-4">
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
                          <Badge variant="secondary">{template.votingType}</Badge>
                          <Badge variant="outline">{template.defaultDuration}min</Badge>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Event Title</label>
                  <Input 
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input 
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                    min="5"
                    max="60"
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

              {/* Contestant Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Contestants ({selectedContestants.length} selected)
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2">
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
                      />
                      <span className="text-xs">{member.displayName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voting Options */}
              <div>
                <label className="text-sm font-medium mb-2 block">Voting Options</label>
                <div className="space-y-2">
                  {votingOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        value={option}
                        onChange={(e) => updateVotingOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {votingOptions.length > 2 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeVotingOption(index)}
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
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={createEvent} 
                  className="flex-1"
                  disabled={!eventTitle.trim() || isCreating}
                >
                  {isCreating ? 'Creating Event...' : 'Create Event'}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
