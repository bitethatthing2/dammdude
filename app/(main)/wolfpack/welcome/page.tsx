"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/shared/BackButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Star, 
  CheckCircle, 
  MessageCircle,
  MapPin,
  Users,
  UtensilsCrossed,
  Calendar,
  ArrowRight,
  User,
  Music,
  Vote,
  Bell,
  Smartphone,
  Heart,
  Zap,
  Info,
  Trophy,
  Sparkles
} from 'lucide-react';

export default function WolfpackWelcomePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const onboardingSteps = [
    {
      icon: MapPin,
      title: "🎯 You're Verified & In!",
      description: "Your location has been confirmed - you're now part of an exclusive community that only exists when you're physically here at Side Hustle Bar.",
      action: "See Who Else is Here",
      actionIcon: Users,
      actionUrl: "/chat"
    },
    {
      icon: Users,
      title: "🐺 Meet Your Pack",
      description: "See other wolves on the live bar map, view their profiles, and start conversations. Everyone you see is someone you could walk over and meet right now!",
      action: "View Live Pack Map",
      actionIcon: Users,
      actionUrl: "/chat"
    },
    {
      icon: MessageCircle,
      title: "💬 Connect & Socialize",
      description: "Send messages, 'winks', and connect with fellow pack members. Build your bar social network in real-time!",
      action: "Start Chatting",
      actionIcon: MessageCircle,
      actionUrl: "/chat"
    },
    {
      icon: UtensilsCrossed,
      title: "🍹 Revolutionary Ordering",
      description: "Skip the wait and order directly through the app. Your bartender gets your order instantly - just pay at the bar when ready!",
      action: "Browse Menu",
      actionIcon: UtensilsCrossed,
      actionUrl: "/menu"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BackButton fallbackHref="/" />
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Welcome to the Wolf Pack! 🐺</h1>
            <p className="text-muted-foreground">Your exclusive bar community awaits</p>
          </div>
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active Member
          </Badge>
        </div>

        {/* Welcome Hero Card */}
        <Card className="mb-8 border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/5 overflow-hidden">
          <CardContent className="pt-8 pb-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎉 Welcome to the Pack! 🐺
              </h2>
              <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
                You&apos;ve just joined Side Hustle Bar&apos;s most exclusive community - a revolutionary social dining experience that transforms every visit into an adventure!
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Your Wolf Pack membership gives you access to features that bridge digital connection with real-world social interaction in ways you&apos;ve never experienced before.
              </p>

              <Alert className="mb-6 border-green-200 bg-green-50 max-w-2xl mx-auto">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>🎯 You&apos;re now part of something special:</strong> An authentic, location-based community where everyone you interact with is someone you could literally walk over and meet in person right now!
                </AlertDescription>
              </Alert>
            </div>
            
            {/* Quick Start Actions */}
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Button 
                size="lg" 
                onClick={() => router.push('/chat')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Users className="h-5 w-5" />
                See Who&apos;s Here Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => router.push('/menu')}
                className="flex items-center gap-2 border-purple-300 hover:bg-purple-50"
              >
                <UtensilsCrossed className="h-5 w-5" />
                Start Ordering
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Onboarding Steps */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Quick Start Guide
                </CardTitle>
                <CardDescription>
                  Get started with these essential features
                </CardDescription>
              </div>
              <Badge variant="outline">
                {currentStep + 1} of {onboardingSteps.length}
              </Badge>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className={`bg-purple-600 h-2 rounded-full transition-all duration-300 wolfpack-progress-bar`}
                data-progress={`${(currentStep + 1) / onboardingSteps.length * 100}`}
              />
            </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onboardingSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isActive ? 'border-purple-500 bg-purple-50' : 
                      isCompleted ? 'border-green-200 bg-green-50' : 
                      'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-purple-500 text-white' :
                        isCompleted ? 'bg-green-600 text-white' :
                        'bg-muted'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        {isActive && (
                          <Button size="sm" className="mt-2">
                            <step.actionIcon className="h-4 w-4 mr-1" />
                            {step.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Core Features Explained */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Live Bar Experience */}
          <Card className="border-purple-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Users className="h-5 w-5" />
                Live Bar Map & Avatars
              </CardTitle>
              <CardDescription>
                See who&#39;s in your pack right now
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-purple-600" />
                  How it works:
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Each member appears as a wolf avatar on the digital bar map</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Tap any avatar to view their profile and start chatting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>See real-time movement as people arrive and leave</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Profile pictures help you recognize fellow pack members</span>
                  </li>
                </ul>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/chat')}
              >
                Explore the Pack Map
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* DJ Events & Voting */}
          <Card className="border-orange-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Music className="h-5 w-5" />
                DJ Events & Live Voting
              </CardTitle>
              <CardDescription>
                Participate in live entertainment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Vote className="h-4 w-4 text-orange-600" />
                  Live Events Include:
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">🎤</span>
                    <span>Freestyle Fridays & Rap Battles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">🎃</span>
                    <span>Costume Competitions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">🎵</span>
                    <span>DJ-created spontaneous events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">🗳️</span>
                    <span>Vote for contestants in real-time</span>
                  </li>
                </ul>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/events')}
              >
                Check Tonight&#39;s Events
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                All Pack Features
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAllFeatures(!showAllFeatures)}
              >
                {showAllFeatures ? 'Show Less' : 'Show All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Always visible features */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <UtensilsCrossed className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Effortless Ordering</h3>
                  <p className="text-sm text-muted-foreground">
                    Order directly from your phone, pay at the bar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Private Messaging</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with other pack members at your location
                  </p>
                </div>
              </div>

              {showAllFeatures && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Location-Based Packs</h3>
                      <p className="text-sm text-muted-foreground">
                        Salem & Portland packs with local features
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Exclusive Events</h3>
                      <p className="text-sm text-muted-foreground">
                        Member-only events and competitions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                      <User className="h-4 w-4 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Saved Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        Your profile and settings are always saved
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Zap className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Daily Reset</h3>
                      <p className="text-sm text-muted-foreground">
                        Fresh start daily at 2:38 AM
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* App Setup Reminders */}
        <Card className="mb-8 border-blue-500/10 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Complete Your Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">Get order updates & event alerts</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Install the App</p>
                    <p className="text-sm text-muted-foreground">For the best experience</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Install</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Ready to explore?</h3>
          <p className="text-muted-foreground mb-4">Jump into the pack and start connecting!</p>
          <div className="flex gap-3 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/chat')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Users className="h-5 w-5 mr-2" />
              Enter the Pack
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => router.push('/profile')}
            >
              <User className="h-5 w-5 mr-2" />
              Setup Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
