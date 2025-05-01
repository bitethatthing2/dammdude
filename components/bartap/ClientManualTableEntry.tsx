"use client";

import { ManualTableEntry } from './ManualTableEntry';
import { BarTapProvider } from '@/lib/contexts/bartap-context';

export function ClientManualTableEntry() {
  return (
    <BarTapProvider>
      <ManualTableEntry />
    </BarTapProvider>
  );
}
