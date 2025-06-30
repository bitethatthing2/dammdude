import { MapPin, Truck, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

export function QuickActionButtons() {
  const router = useRouter();
  const { isMember: canCheckout } = useWolfpackAccess();
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

  const handleDirections = () => {
    // Open Google Maps to nearest location
    const salemCoords = "44.9429,-123.0351";
    // Portland coordinates: "45.5152,-122.6784" - available if needed
    window.open(`https://maps.google.com/?q=${salemCoords}`, '_blank');
  };

  const handleOrderOnline = () => {
    setShowDeliveryDialog(true);
  };

  const handleJoinWolfpack = () => {
    if (!canCheckout) {
      router.push('/wolfpack/join');
    } else {
      router.push('/wolfpack');
    }
  };

  return (
    <>
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

      {/* Delivery Services Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Online</DialogTitle>
          <DialogDescription>
            Choose your preferred delivery service
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={() => window.open('https://www.doordash.com/store/side-hustle-lounge-salem-23456789/', '_blank')}
            className="w-full justify-start"
            variant="outline"
          >
            <Truck className="mr-2 h-4 w-4" />
            DoorDash
          </Button>
          <Button
            onClick={() => window.open('https://www.ubereats.com/store/side-hustle-lounge/abcdef123456', '_blank')}
            className="w-full justify-start"
            variant="outline"
          >
            <Truck className="mr-2 h-4 w-4" />
            Uber Eats
          </Button>
          <Button
            onClick={() => window.open('https://postmates.com/merchant/side-hustle-lounge-salem', '_blank')}
            className="w-full justify-start"
            variant="outline"
          >
            <Truck className="mr-2 h-4 w-4" />
            Postmates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
