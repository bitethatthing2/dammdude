'use client';

import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import WolfpackChatInterface from '@/components/wolfpack/WolfpackChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WolfpackChannelsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isMember: isInPack, isLoading: packLoading } = useConsistentWolfpackAccess();

  const isLoading = authLoading || packLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Wolfpack Channels...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please sign in to access Wolfpack Chat Channels.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/login')} className="flex-1">
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/wolfpack')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInPack) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Join the Wolf Pack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to be a Wolfpack member to access chat channels.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push('/wolfpack/welcome')} 
                className="flex-1"
              >
                Join Wolfpack
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/wolfpack')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/wolfpack')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pack
          </Button>
          <div>
            <h1 className="text-xl font-semibold">🐺 Wolfpack Chat Channels</h1>
            <p className="text-sm text-muted-foreground">
              Join public conversations with pack members
            </p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4">
        <WolfpackChatInterface className="h-[calc(100vh-8rem)]" />
      </div>
    </div>
  );
}