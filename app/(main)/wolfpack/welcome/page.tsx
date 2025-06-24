"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimpleWolfpack } from '@/hooks/useSimpleWolfpack';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  Shield, 
  Users, 
  UtensilsCrossed,
  Loader2,
  CheckCircle
} from 'lucide-react';

export default function WolfpackWelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInPack, isLoading, joinPack } = useSimpleWolfpack();

  useEffect(() => {
    // If already in pack, redirect immediately
    if (isInPack && !isLoading) {
      router.push('/wolfpack');
    }
  }, [isInPack, isLoading, router]);

  // Redirect to login if not authenticated
  if (!user && !isLoading) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking pack status...</p>
          </div>
        </div>
      </div>
    );
  }

  // If already in pack, this will redirect above, but showing loading state just in case
  if (isInPack) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <p className="text-muted-foreground">Redirecting to pack...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to the Wolf Pack! 🐺
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Join Salem&apos;s most exclusive bar community and unlock revolutionary social dining features.
          </p>
          
          <Card className="mb-8 border-2 border-purple-500/20 bg-purple-50/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Connect with other pack members in real-time</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Order food & drinks directly to bartender</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Participate in exclusive events and voting</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Access member-only features</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            onClick={async () => {
              await joinPack();
              router.push('/wolfpack');
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining Pack...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Join the Pack 🐺
              </>
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            By joining, you agree to our community guidelines. Your experience will be amazing!
          </p>
        </div>
      </div>
    </div>
  );
}
