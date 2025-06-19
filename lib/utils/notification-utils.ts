// Re-export everything from the topic management utility
export * from '../notifications/topic-management';

// Legacy compatibility - keeping old function signatures
import { 
  subscribeToTopic as newSubscribeToTopic,
  unsubscribeFromTopic as newUnsubscribeFromTopic,
  getSubscribedTopics as newGetSubscribedTopics,
  subscribeToWolfPackLocation as newSubscribeToWolfPackLocation,
  unsubscribeFromAllWolfPackLocations as newUnsubscribeFromAllWolfPackLocations,
  getUserNotificationPreferences as newGetUserNotificationPreferences
} from '../notifications/topic-management';

// Maintain backward compatibility with existing code
export const subscribeToTopic = newSubscribeToTopic;
export const unsubscribeFromTopic = newUnsubscribeFromTopic;
export const getSubscribedTopics = newGetSubscribedTopics;
export const subscribeToWolfPackLocation = newSubscribeToWolfPackLocation;
export const unsubscribeFromAllWolfPackLocations = newUnsubscribeFromAllWolfPackLocations;
export const getUserNotificationPreferences = newGetUserNotificationPreferences;
