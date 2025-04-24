import RealtimeOrderList from '@/components/admin/RealtimeOrderList';
import { NotificationSender } from '@/components/admin/NotificationSender';

export default function BarTapAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bar Tap Orders</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RealtimeOrderList />
        </div>
        
        <div>
          <NotificationSender />
        </div>
      </div>
    </div>
  );
}