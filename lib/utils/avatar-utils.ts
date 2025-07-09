/**
 * Avatar Utility Functions
 * 
 * Centralized utilities for handling avatar URLs and fallbacks
 * to prevent code duplication across components.
 */

// Types for avatar sources
interface AvatarSource {
  profile_image_url?: string | null;
  profile_pic_url?: string | null;
  avatar_url?: string | null;
}

interface AvatarOptions {
  fallbackIcon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Default fallback icon
export const DEFAULT_AVATAR_ICON = '/icons/wolf-icon-light-screen.png';

/**
 * Resolves avatar URL with fallback chain
 * Priority: profile_image_url > profile_pic_url > avatar_url > fallback
 */
export function resolveAvatarUrl(
  source: AvatarSource | string | null | undefined,
  options: AvatarOptions = {}
): string {
  const { fallbackIcon = DEFAULT_AVATAR_ICON } = options;
  
  // Handle string input (direct URL)
  if (typeof source === 'string' && source.trim()) {
    return source;
  }
  
  // Handle null/undefined
  if (!source || typeof source !== 'object') {
    return fallbackIcon;
  }
  
  // Apply fallback chain
  return (
    source.profile_image_url ||
    source.profile_pic_url ||
    source.avatar_url ||
    fallbackIcon
  );
}

/**
 * Resolves avatar URL specifically for chat contexts
 * Handles message-specific avatar resolution with member fallback
 */
export function resolveChatAvatarUrl(
  messageAvatar?: string | null,
  memberAvatar?: string | null,
  fallback: string = DEFAULT_AVATAR_ICON
): string {
  return messageAvatar || memberAvatar || fallback;
}

/**
 * Resolves avatar URL for wolfpack members
 * Handles the specific pattern used in wolfpack components
 */
export function resolveWolfpackMemberAvatar(
  member: { avatar_url?: string | null } | null | undefined,
  fallback: string = DEFAULT_AVATAR_ICON
): string {
  return member?.avatar_url || fallback;
}

/**
 * Resolves display name with fallback chain
 * Common pattern used alongside avatar resolution
 */
export function resolveDisplayName(
  primaryName?: string | null,
  fallbackName?: string | null,
  defaultName: string = 'Pack Member'
): string {
  return primaryName || fallbackName || defaultName;
}

/**
 * Creates a complete user display object with avatar and name
 * Useful for components that need both avatar and name resolution
 */
export function resolveUserDisplay(
  user: AvatarSource & { display_name?: string | null } | null | undefined,
  options: {
    fallbackName?: string;
    fallbackIcon?: string;
  } = {}
): {
  avatarUrl: string;
  displayName: string;
} {
  const { fallbackName = 'Pack Member', fallbackIcon = DEFAULT_AVATAR_ICON } = options;
  
  return {
    avatarUrl: resolveAvatarUrl(user, { fallbackIcon }),
    displayName: resolveDisplayName(user?.display_name, undefined, fallbackName)
  };
}