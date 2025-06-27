// Main notification exports - single source of truth
export * from './wolfpack-notifications';

// Re-export specific functions with proper typing
export {
  sendChatMessageNotification,
  sendOrderUpdateNotification,
  sendMemberJoinedNotification,
  sendEventAnnouncementNotification,
  sendWinkNotification,
  getUserNotificationPreferences,
  updateNotificationPreferences,
  registerDeviceToken,
  unregisterDeviceToken,
  getNotificationHistory,
  markNotificationAsRead,
  markNotificationAsClicked
} from './wolfpack-notifications';

// Topic management exports
export {
  TopicManagement,
  createTopicManagement,
  getTopicsForRole,
  getSubscribedTopics,
  type NotificationTopic,
  type TopicSubscription,
  type NotificationTopicInsert,
  type NotificationTopicUpdate,
  type TopicSubscriptionInsert,
  type TopicSubscriptionUpdate
} from './topic-management';

// Types
export type {
  WolfPackNotificationData,
  NotificationPreferences
} from './wolfpack-notifications';
