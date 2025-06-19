// Main notification exports - single source of truth
export * from './topic-management';
export * from './wolfpack-notifications';

// Re-export for backward compatibility
export {
  subscribeToTopic,
  unsubscribeFromTopic,
  getSubscribedTopics,
  getAvailableTopics,
  subscribeToWolfPackLocation,
  unsubscribeFromAllWolfPackLocations,
  updateNotificationPreferences,
  canSubscribeToTopic,
  getUserNotificationPreferences,
  getTopicsForRole
} from './topic-management';

export {
  sendChatMessageNotification,
  sendOrderUpdateNotification,
  sendMemberJoinedNotification,
  sendEventAnnouncementNotification,
  sendWinkNotification,
  getUserNotificationPreferences as getWolfPackNotificationPreferences,
  updateNotificationPreferences as updateWolfPackNotificationPreferences
} from './wolfpack-notifications';
