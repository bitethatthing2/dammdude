// CREATE components/wolfpack/QuickActionButtons.tsx
import { MapPin, Truck, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';

export function QuickActionButtons() {
  const router = useRouter();
  const { canCheckout } = useWolfpackAccess();

  const handleDirections = () => {
    // Open Google Maps to nearest location
    const salemCoords = "44.9429,-123.0351";
    const portlandCoords = "45.5152,-122.6784";
    window.open(`https://maps.google.com/?q=${salemCoords}`, '_blank');
  };

  const handleOrderOnline = () => {
    // Show modal with DoorDash, Uber Eats, Postmates links
    // For now, open a simple alert - this could be enhanced with a modal
    alert('Order online through:\n• DoorDash\n• Uber Eats\n• Postmates\n\nFeature coming soon!');
  };

  const handleJoinWolfpack = () => {
    if (!canCheckout) {
      router.push('/wolfpack/join');
    } else {
      router.push('/wolfpack');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Button 
        onClick={handleDirections}
        className="h-20 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg"
      >
        <div className="text-center">
          <MapPin className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Directions</div>
          <div className="text-xs opacity-80">Portland/Salem</div>
        </div>
      </Button>

      <Button 
        onClick={handleOrderOnline}
        className="h-20 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg"
      >
        <div className="text-center">
          <Truck className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Order Online</div>
          <div className="text-xs opacity-80">DoorDash, Uber Eats</div>
        </div>
      </Button>

      <Button 
        onClick={handleJoinWolfpack}
        className="h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg"
      >
        <div className="text-center">
          <Users className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Join the Wolfpack</div>
          <div className="text-xs opacity-80">Location verification</div>
        </div>
      </Button>

      <Button 
        onClick={() => router.push('/menu')}
        className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg"
      >
        <div className="text-center">
          <Menu className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Food & Drink Menu</div>
          <div className="text-xs opacity-80">Browse offerings</div>
        </div>
      </Button>
    </div>
  );
}
