'use client';

import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSafeNotifications } from '@/lib/contexts/unified-notification-context';

interface NotificationIndicatorProps {
  variant?: 'default' | 'outline' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * Unified notification indicator component
 * Displays a bell icon with an unread count badge
 */
export function NotificationIndicator({
  variant = 'default',
  size = 'md',
  onClick,
}: NotificationIndicatorProps) {
  // Safely get notifications context - returns null if not available
  const context = useSafeNotifications();
  const unreadCount = context?.unreadCount || 0;
  
  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'h-8 w-8',
      icon: 'h-4 w-4',
      badge: 'h-4 w-4 text-[10px]',
    },
    md: {
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
      badge: 'h-5 w-5 text-xs',
    },
    lg: {
      button: 'h-12 w-12',
      icon: 'h-6 w-6',
      badge: 'h-6 w-6 text-xs',
    },
  };
  
  // Variant configurations
  const variantConfig = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    subtle: 'bg-background hover:bg-muted',
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`relative ${sizeConfig[size].button} p-0`}
      onClick={onClick}
    >
      <Bell className={sizeConfig[size].icon} />
      
      {unreadCount > 0 && (
        <Badge 
          variant="destructive"
          className={`absolute -top-1 -right-1 flex items-center justify-center p-0 ${sizeConfig[size].badge} rounded-full`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

export default NotificationIndicator;
