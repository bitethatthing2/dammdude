'use client';

import { WolfpackProfileManager } from '@/components/wolfpack/WolfpackProfileManager';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <WolfpackProfileManager />
    </div>
  );
}