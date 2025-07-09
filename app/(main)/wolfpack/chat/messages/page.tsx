'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import PrivateMessagesInterface from '@/components/wolfpack/PrivateMessagesInterface';
import { Loader2 } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { isMember: isInPack, isLoading: packLoading } = useConsistentWolfpackAccess();

  const handleNavigateToPrivateChat = (userId: string, userName: string) => {
    router.push(`/wolfpack/chat/private/${userId}`);
  };

  const handleBackToChat = () => {
    router.push('/wolfpack/chat');
  };

  // Loading states
  if (authLoading || packLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-white font-medium mb-2">Authentication Required</p>
          <p className="text-gray-400 text-sm mb-4">Please sign in to view messages</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Pack membership required
  if (!isInPack) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🐺</span>
          </div>
          <p className="text-white font-medium mb-2">Join the Wolf Pack</p>
          <p className="text-gray-400 text-sm mb-4">You need to be at Side Hustle Bar to view messages</p>
          <button
            onClick={() => router.push('/wolfpack/welcome')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Enable Location & Join Pack
          </button>
        </div>
      </div>
    );
  }

  return (
    <PrivateMessagesInterface
      onNavigateToPrivateChat={handleNavigateToPrivateChat}
      onBack={handleBackToChat}
    />
  );
}