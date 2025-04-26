"use client";

import { Suspense } from 'react';
import { Utensils, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { useCartState } from '@/lib/hooks/useCartState';

// Client-side only component for the cart button
const CartButton = dynamic(() => Promise.resolve(({ itemCount, onClick }: { itemCount: number; onClick: () => void }) => (
  <Button 
    onClick={onClick}
    size="icon"
    variant="outline"
    className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg md:bottom-8 z-50"
  >
    <ShoppingCart className="h-6 w-6" />
    {itemCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
        {itemCount}
      </span>
    )}
  </Button>
)), { ssr: false });

export default function MenuPage() {
  const { items, toggleCart } = useCartState();
  const cartItemCount = items.reduce((total: number, item: any) => total + item.quantity, 0);
  
  return (
    <div className="container py-8 pb-24">
      <div className="flex items-center mb-8">
        <Utensils className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Our Menu</h1>
      </div>
      
      <Suspense fallback={<MenuPageSkeleton />}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Menu Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're currently updating our menu with exciting new items. 
            Check back soon to see our full selection of food and drinks!
          </p>
        </div>
      </Suspense>
      
      {/* Cart button - dynamically loaded to avoid SSR issues */}
      <CartButton itemCount={cartItemCount} onClick={toggleCart} />
    </div>
  );
}

function MenuPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 h-48 animate-pulse">
              <div className="h-24 rounded-md bg-muted mb-4" />
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
