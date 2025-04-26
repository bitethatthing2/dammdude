/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use NotificationGuide from '@/components/shared/NotificationGuide' instead.
 * This file exists only for backward compatibility.
 */

"use client";

import NotificationGuide from '../NotificationGuide';

interface SimpleNotificationGuideProps {
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

/**
 * @deprecated Use NotificationGuide from '@/components/shared/NotificationGuide' instead
 */
export function SimpleNotificationGuide({ 
  variant = 'button',
  className = ''
}: SimpleNotificationGuideProps) {
  // Forward all props to the NotificationGuide component
  return <NotificationGuide variant={variant} className={className} />;
}
