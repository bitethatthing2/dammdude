import { Metadata } from 'next';
import { DJAuthGuard } from '@/components/dj/DJAuthGuard';
import { DJDashboard } from '@/components/dj/DJDashboard';

export const metadata: Metadata = {
  title: 'DJ Control Center - Side Hustle Wolf Pack',
  description: 'DJ interface for managing Wolf Pack events and communications'
};

export default function DJPage() {
  return (
    <DJAuthGuard>
      <div className="dj-page min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <DJDashboard />
        </div>
      </div>
    </DJAuthGuard>
  );
}
