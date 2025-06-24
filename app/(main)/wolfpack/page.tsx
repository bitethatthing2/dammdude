"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/contexts/AuthContext';
import { BackButton } from '@/components/shared/BackButton';
import { useSimpleWolfpack } from '@/hooks/useSimpleWolfpack';
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
  const { isInPack, isLoading, error } = useSimpleWolfpack();

  useEffect(() => {
    // If not in pack and not loading, redirect to welcome
    if (!isInPack && !isLoading && user) {
      router.push('/wolfpack/welcome');
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
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BackButton fallbackHref="/" />
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Wolf Pack</h1>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please login to access Wolf Pack features.
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button onClick={() => router.push('/login')} className="w-full">
              Login to Continue
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

  // If user is in the pack - show member features
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
            <h1 className="text-2xl font-bold">Wolf Pack Member</h1>
            <p className="text-muted-foreground">Welcome back to the pack!</p>
          </div>
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active Member
          </Badge>
        </div>

        {/* Member Status Card */}
        <Card className="mb-8 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Star className="h-5 w-5" />
              You&apos;re in the Pack!
            </CardTitle>
            <CardDescription className="text-green-700">
              Your Wolf Pack membership is active. You can now access all premium features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-800">Status</p>
                <p className="text-sm text-green-700">Active Member</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-800">Access Level</p>
                <p className="text-sm text-green-700">Full Pack Access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Features */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Available Now
              </CardTitle>
              <CardDescription>
                Features you can use with your membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Order Food & Drinks</h3>
                  <p className="text-sm text-muted-foreground">
                    Place orders directly through the bartender interface
                  </p>
                  <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto" onClick={() => router.push('/menu')}>
                    Start Ordering <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Wolf Pack Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with other pack members in real-time
                  </p>
                  <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto" onClick={() => router.push('/wolfpack/chat')}>
                    Join Chat <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Member Benefits
              </CardTitle>
              <CardDescription>
                Exclusive perks for Wolf Pack members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Priority ordering and service</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Access to Wolf Pack chat</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Exclusive event invitations</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Member-only offers and discounts</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Button onClick={() => router.push('/menu')} className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Order Now
          </Button>
          <Button variant="outline" onClick={() => router.push('/wolfpack/chat')} className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Pack Chat
          </Button>
          <Button variant="outline" onClick={() => router.push('/events')} className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Events
          </Button>
        </div>
      </div>
    </div>
  );
}
