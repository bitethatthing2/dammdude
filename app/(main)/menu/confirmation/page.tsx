'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState(15); // 15 minute default
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes in seconds
  
  // Get the order ID from URL query parameters
  const orderId = searchParams.get('orderId');
  
  // Fetch order details
  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) {
        router.push('/menu');
        return;
      }
      
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      
      try {
        // Fetch order
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single();
          
        if (error) throw error;
        
        setOrderDetails(data);
        if (data.estimated_time) {
          setEstimatedTime(data.estimated_time);
          setCountdown(data.estimated_time * 60);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOrderDetails();
  }, [orderId, router]);
  
  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);
  
  // Format countdown time
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Return to menu
  const backToMenu = () => {
    router.push('/menu');
  };
  
  // Set up real-time subscription for order status updates
  useEffect(() => {
    if (!orderId) return;
    
    const supabase = getSupabaseBrowserClient();
    
    // Subscribe to changes on the order
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload: { new: any; old: any }) => {
        // Update order details when changes occur
        setOrderDetails((prev: any) => ({
          ...prev,
          ...payload.new
        }));
        
        // If status changed to "ready", we could also show a notification
        if (payload.new.status === 'ready') {
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Your order is ready!', {
              body: 'Please come to the bar to pick up your order.'
            });
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.channel(`order-${orderId}`).unsubscribe();
    };
  }, [orderId]);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-center text-muted-foreground">Loading your order details...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md w-full mx-auto shadow-sm">
        <CardHeader className="pb-0 pt-6">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-center">Order Confirmed!</h1>
          <p className="text-muted-foreground text-center text-sm">
            Your order #{orderId && orderId.slice(-6)} has been received and is being prepared.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">Estimated Time:</span>
            </div>
            <div className="text-3xl font-bold my-3 text-center">
              {formatCountdown()}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your order will be ready to pick up at the bar.
            </p>
          </div>
          
          <div className="border border-border rounded-lg p-4">
            <h2 className="font-medium mb-2 text-center">Table Number</h2>
            <div className="text-2xl font-bold text-center">
              {orderDetails?.table_id || 'Not specified'}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
            <p>We'll notify you when your order is ready.</p>
            <p>Remember there's a 15-minute time limit for each table.</p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={backToMenu}
            className="w-full"
            variant="default"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
