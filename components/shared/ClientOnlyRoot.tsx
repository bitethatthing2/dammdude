'use client';

import dynamic from 'next/dynamic';

// This component only exists to handle the ssr: false dynamic import
// in a client component context
const ClientRootComponent = dynamic(
  () => import('@/components/shared/ClientWrapper').then(mod => mod.ClientWrapper),
  { ssr: false }
);

export function ClientOnlyRoot() {
  return <ClientRootComponent />;
}
