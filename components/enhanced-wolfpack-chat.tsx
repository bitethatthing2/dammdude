"use client";

import { useState, useEffect } from 'react'
import { RealtimeChat } from '@/components/realtime-chat'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Users, MessageCircle, Calendar, MapPin, Sparkles, AlertCircle, Send } from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useWolfPack, useWolfPackActions, useLocationVerification, WolfPackMember } from '@/hooks/use-wolfpack'
import type { ChatMessage } from '@/components/realtime-chat'

interface JoinPackFormData {
  username: string
  emoji: string
  status: string
  favoriteDrink: string
  currentVibe: string
  lookingFor: string
}

interface PrivateMessageDialog {
  isOpen: boolean
  recipient: WolfPackMember | null
  message: string
}

// Available emojis for wolf pack members
const WOLF_EMOJIS = ['🐺', '🦊', '🐕', '🐾', '🦮', '🐩', '🦴', '🐕‍🦺']
const DJ_EMOJIS = ['🎧', '🎵', '🎶', '🎤', '🎸', '🎹', '🎺', '🎷']
const BARTENDER_EMOJIS = ['🍺', '🍻', '🥃', '🍸', '🍹', '🍷', '🥂', '🍾']

export default function EnhancedWolfPackChat() {
  const { user } = useAuth()
  const { location, loading: locationLoading, error: locationError, verifyLocation } = useLocationVerification()
  const { 
    packMembers, 
    activeEvents, 
    session, 
    isInPack, 
    loading: packLoading, 
    error: packError,
    joinPack,
    leavePack 
  } = useWolfPack(location)
  const { sendWink, joinEvent, voteInEvent, sendPrivateMessage } = useWolfPackActions()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedTab, setSelectedTab] = useState('pack')
  const [joinFormData, setJoinFormData] = useState<JoinPackFormData>({
    username: user?.email?.split('@')[0] || '',
    emoji: '🐺',
    status: 'Just arrived',
    favoriteDrink: '',
    currentVibe: '',
    lookingFor: 'Good conversations'
  })
  const [joining, setJoining] = useState(false)
  const [privateMessageDialog, setPrivateMessageDialog] = useState<PrivateMessageDialog>({
    isOpen: false,
    recipient: null,
    message: ''
  })

  const handleJoinPack = async () => {
    setJoining(true)
    const result = await joinPack({
      username: joinFormData.username,
      emoji: joinFormData.emoji,
      status: joinFormData.status,
      favorite_drink: joinFormData.favoriteDrink,
      vibe_status: joinFormData.currentVibe,
      looking_for: joinFormData.lookingFor
    })
    
    if (result.error) {
      console.error('Failed to join pack:', result.error)
    }
    setJoining(false)
  }

  const handleSendWink = async (memberId: string) => {
    const result = await sendWink(memberId)
    if (result.error) {
      console.error('Failed to send wink:', result.error)
    }
  }

  const handleJoinEvent = async (eventId: string) => {
    const result = await joinEvent(eventId)
    if (result.error) {
      console.error('Failed to join event:', result.error)
    }
  }

  const handleMessage = async (newMessages: ChatMessage[]) => {
    setMessages(newMessages)
  }

  const openPrivateMessage = (member: WolfPackMember) => {
    setPrivateMessageDialog({
      isOpen: true,
      recipient: member,
      message: ''
    })
  }

  const sendPrivateMsg = async () => {
    if (!privateMessageDialog.recipient || !privateMessageDialog.message.trim()) return
    
    const result = await sendPrivateMessage(
      privateMessageDialog.recipient.id,
      privateMessageDialog.message
    )
    
    if (!result.error) {
      setPrivateMessageDialog({ isOpen: false, recipient: null, message: '' })
    }
  }

  // Loading state
  if (locationLoading || packLoading) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Verifying your location...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Location error state
  if (locationError || !location) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Required
            </CardTitle>
            <CardDescription>
              You need to be at Side Hustle Bar to join the Wolf Pack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>The Wolf Pack is an exclusive experience for people currently at:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Side Hustle Salem</li>
                <li>Side Hustle Portland</li>
              </ul>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={verifyLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Location...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not in pack - show join form
  if (!isInPack) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Join the Wolf Pack
            </CardTitle>
            <CardDescription>
              Welcome to Side Hustle {location === 'salem' ? 'Salem' : 'Portland'}! 
              Create your Wolf Profile to join the pack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Pack Name</Label>
                <Input
                  id="username"
                  placeholder="Your wolf pack name"
                  value={joinFormData.username}
                  onChange={(e) => setJoinFormData({ ...joinFormData, username: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Choose Your Pack Emoji</Label>
                <div className="grid grid-cols-8 gap-2">
                  {WOLF_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant={joinFormData.emoji === emoji ? 'default' : 'outline'}
                      size="sm"
                      className="text-xl p-2"
                      onClick={() => setJoinFormData({ ...joinFormData, emoji })}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Current Status</Label>
                <Input
                  id="status"
                  placeholder="e.g., Celebrating 🎉, Just arrived, Dancing 💃"
                  value={joinFormData.status}
                  onChange={(e) => setJoinFormData({ ...joinFormData, status: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="favoriteDrink">Favorite Drink</Label>
                <Input
                  id="favoriteDrink"
                  placeholder="e.g., Old Fashioned, IPA, Margarita"
                  value={joinFormData.favoriteDrink}
                  onChange={(e) => setJoinFormData({ ...joinFormData, favoriteDrink: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentVibe">Current Vibe</Label>
                <Input
                  id="currentVibe"
                  placeholder="e.g., Social butterfly, Chill vibes, Party mode"
                  value={joinFormData.currentVibe}
                  onChange={(e) => setJoinFormData({ ...joinFormData, currentVibe: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lookingFor">Looking For</Label>
                <Input
                  id="lookingFor"
                  placeholder="e.g., Making friends, Good conversations, Dancing partners"
                  value={joinFormData.lookingFor}
                  onChange={(e) => setJoinFormData({ ...joinFormData, lookingFor: e.target.value })}
                />
              </div>
            </div>
            
            {packError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{packError}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleJoinPack}
              disabled={joining || !joinFormData.username}
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Pack...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Join the Pack
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Wolf Pack interface
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🐺 Wolf Pack
              <Badge variant="secondary">{location?.toUpperCase()}</Badge>
            </h1>
            <p className="text-muted-foreground">
              {packMembers.length} wolves in the pack tonight
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Live
            </Badge>
            <Button variant="outline" size="sm" onClick={leavePack}>
              Leave Pack
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pack">
            <Users className="h-4 w-4 mr-2" />
            Pack View
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pack" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>The {location === 'salem' ? 'Salem' : 'Portland'} Pack</CardTitle>
              <CardDescription>
                Click on any pack member to send them a message or wink
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4 p-4">
                {/* Bartenders section */}
                <div className="col-span-full">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <span>Bartenders</span>
                    <div className="flex gap-1">
                      {BARTENDER_EMOJIS.slice(0, 3).map(e => (
                        <span key={e} className="text-xs">{e}</span>
                      ))}
                    </div>
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {packMembers
                      .filter(m => m.role === 'bartender')
                      .map((member) => (
                        <button
                          key={member.id}
                          onClick={() => openPrivateMessage(member)}
                          className="group relative transition-transform hover:scale-110"
                        >
                          <div className="relative">
                            {member.emoji ? (
                              <span className="text-4xl">{member.emoji}</span>
                            ) : (
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.profile_image_url} />
                                <AvatarFallback>
                                  {member.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {member.status && (
                              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {member.status.split(' ')[0]}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <p className="text-xs mt-1 text-center max-w-[60px] truncate">
                            {member.username}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* DJs section */}
                <div className="col-span-full">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <span>DJ</span>
                    <div className="flex gap-1">
                      {DJ_EMOJIS.slice(0, 3).map(e => (
                        <span key={e} className="text-xs">{e}</span>
                      ))}
                    </div>
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {packMembers
                      .filter(m => m.role === 'dj')
                      .map((member) => (
                        <button
                          key={member.id}
                          onClick={() => openPrivateMessage(member)}
                          className="group relative transition-transform hover:scale-110"
                        >
                          <div className="relative">
                            {member.emoji ? (
                              <span className="text-4xl">{member.emoji}</span>
                            ) : (
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.profile_image_url} />
                                <AvatarFallback>
                                  {member.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="absolute -bottom-1 -right-1">
                              <span className="text-xs">🎵</span>
                            </div>
                          </div>
                          <p className="text-xs mt-1 text-center max-w-[60px] truncate">
                            {member.username}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Wolf pack members */}
                <div className="col-span-full">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <span>The Pack</span>
                    <div className="flex gap-1">
                      {WOLF_EMOJIS.slice(0, 8).map((e, i) => (
                        <span key={e} className="text-xs" style={{ opacity: 1 - (i * 0.1) }}>{e}</span>
                      ))}
                    </div>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {packMembers
                      .filter(m => !m.role || m.role === 'user')
                      .map((member) => (
                        <button
                          key={member.id}
                          onClick={() => openPrivateMessage(member)}
                          className="group relative transition-transform hover:scale-110"
                        >
                          <div className="relative">
                            {member.emoji ? (
                              <span className="text-4xl">{member.emoji}</span>
                            ) : (
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.profile_image_url} />
                                <AvatarFallback>
                                  {member.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {member.vibe_status && (
                              <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                                <span className="text-xs">✨</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs mt-1 text-center max-w-[60px] truncate">
                            {member.username}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pack Chat</CardTitle>
              <CardDescription>
                Chat with everyone at {location === 'salem' ? 'Salem' : 'Portland'} location
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <RealtimeChat
                roomName={`wolfpack-${location}`}
                username={session?.username || user?.email?.split('@')[0] || 'anonymous'}
                messages={messages}
                onMessage={handleMessage}
                className="h-full"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4">
            {packMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {member.emoji ? (
                        <span className="text-4xl">{member.emoji}</span>
                      ) : (
                        <Avatar>
                          <AvatarImage src={member.profile_image_url} />
                          <AvatarFallback>
                            {member.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.username}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {member.status}
                          </Badge>
                          {member.role && (
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {member.favorite_drink && (
                            <p>🍹 {member.favorite_drink}</p>
                          )}
                          {member.vibe_status && (
                            <p>✨ {member.vibe_status}</p>
                          )}
                          {member.looking_for && (
                            <p>👋 {member.looking_for}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {member.user_id !== user?.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendWink(member.id)}
                        >
                          😉 Wink
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPrivateMessage(member)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4">
            {activeEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No active events right now</p>
                </CardContent>
              </Card>
            ) : (
              activeEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {event.title}
                          {event.is_active && (
                            <Badge variant="default" className="animate-pulse">
                              LIVE
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {event.type === 'contest' && '🏆 Contest'}
                        {event.type === 'trivia' && '🧠 Trivia'}
                        {event.type === 'special' && '✨ Special'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {event.participant_count} participants
                      </span>
                      {event.is_active && (
                        <Button size="sm" onClick={() => handleJoinEvent(event.id)}>
                          Join Event
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* DJ Announcement Banner */}
      {activeEvents.some(e => e.is_active) && (
        <Card className="mt-4 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">🎵</span>
              <div className="flex-1">
                <p className="font-semibold">DJ Announcement</p>
                <p className="text-sm text-muted-foreground">
                  Costume contest voting starts in 5 minutes! Get ready to show your support!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Private Message Dialog */}
      <Dialog 
        open={privateMessageDialog.isOpen} 
        onOpenChange={(open) => !open && setPrivateMessageDialog({ isOpen: false, recipient: null, message: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Send Message to {privateMessageDialog.recipient?.username}
              {privateMessageDialog.recipient?.emoji && (
                <span className="text-2xl">{privateMessageDialog.recipient.emoji}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              Send a private message to this pack member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={privateMessageDialog.message}
              onChange={(e) => setPrivateMessageDialog({ ...privateMessageDialog, message: e.target.value })}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrivateMessageDialog({ ...privateMessageDialog, message: privateMessageDialog.message + ' 😉' })}
              >
                😉
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrivateMessageDialog({ ...privateMessageDialog, message: privateMessageDialog.message + ' 🍻' })}
              >
                🍻
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrivateMessageDialog({ ...privateMessageDialog, message: privateMessageDialog.message + ' 🎉' })}
              >
                🎉
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPrivateMessageDialog({ isOpen: false, recipient: null, message: '' })}
            >
              Cancel
            </Button>
            <Button onClick={sendPrivateMsg} disabled={!privateMessageDialog.message.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
