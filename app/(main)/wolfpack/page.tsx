"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/contexts/AuthContext';
import { BackButton } from '@/components/shared/BackButton';
import { useWolfpack } from '@/hooks/useWolfpack';
import { 
  Shield, 
  Users, 
  MessageCircle, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  UtensilsCrossed
} from 'lucide-react';

export default function WolfpackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInPack, isLoading, error } = useWolfpack();

  useEffect(() => {
    // Streamlined redirect logic
    if (!isLoading && user) {
      if (!isInPack) {
        // Direct to welcome for pack joining
        router.push('/wolfpack/welcome');
      }
    } else if (!isLoading && !user) {
      // Direct to login with return path
      router.push('/login?returnTo=/wolfpack');
    }
  }, [isInPack, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking your Wolf Pack status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-gray-600 to-slate-600 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">🔒 Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to access the Wolf Pack at Side Hustle Bar.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/login?returnTo=/wolfpack')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              Sign In to Join Pack
            </Button>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BackButton fallbackHref="/" />
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Wolf Pack</h1>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button onClick={() => router.push('/wolfpack/welcome')} className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If not in pack, this will redirect above, but show loading state just in case
  if (!isInPack) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting to welcome...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is in the pack - direct to chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Compact Header for Mobile */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">🐺 Wolf Pack</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Active Member</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => router.push('/wolfpack/chat')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Enter Chat</span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </div>

        {/* Quick Status Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Pack Member Active
                </h3>
                <p className="text-sm text-green-600">All features unlocked</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
        </div>

        {/* Primary Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {/* Main Chat Access */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 cursor-pointer hover:shadow-lg transition-all" 
                onClick={() => router.push('/wolfpack/chat')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">🐺 Enter Wolf Pack</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join the live chat and connect with your pack
              </p>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Chatting
              </Button>
            </CardContent>
          </Card>

          {/* Quick Order */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 cursor-pointer hover:shadow-lg transition-all" 
                onClick={() => router.push('/menu')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">🍽️ Quick Order</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fast-track your food and drink orders
              </p>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                Order Now
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Member Benefits - Compact */}
        <Card className="border border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Star className="h-5 w-5" />
              Your Pack Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Priority Service</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Live Chat Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Event Invitations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Member Discounts</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
