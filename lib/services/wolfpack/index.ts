// =============================================================================
// UNIFIED WOLFPACK SERVICE - SINGLE ENTRY POINT
// =============================================================================

// Export all types
export * from './types';
export * from './errors';

// Export error handler class for backwards compatibility
export { 
  WolfpackServiceError as WolfpackErrorHandler,
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse 
} from './errors';

// Export individual services
export { WolfpackAuthService } from './auth';
export { WolfpackFeedService } from './feed';

// Import all services for unified interface
import { WolfpackAuthService } from './auth';
import { WolfpackFeedService } from './feed';

// Temporary imports for legacy service compatibility
import { WolfpackBackendService } from '../wolfpack-backend.service';
import { WolfpackSocialService } from '../wolfpack-social.service';

/**
 * Unified Wolfpack Service - Single interface for all Wolfpack functionality
 * 
 * This consolidates all the fragmented Wolfpack services into a single, 
 * well-organized service with clear module boundaries.
 * 
 * Usage:
 * ```typescript
 * import { WolfpackService } from '@/lib/services/wolfpack';
 * 
 * // Authentication
 * const user = await WolfpackService.auth.getCurrentUser();
 * 
 * // Feed operations
 * const feed = await WolfpackService.feed.fetchFeedItems();
 * 
 * // Social features (coming soon)
 * // const likes = await WolfpackService.social.likePost(postId);
 * ```
 */
export class WolfpackService {
  // Authentication & Authorization
  static auth = WolfpackAuthService;
  
  // Feed Management
  static feed = WolfpackFeedService;
  
  // Legacy backend service (temporary compatibility)
  static backend = WolfpackBackendService;
  
  // Legacy social service (temporary compatibility)
  static social = WolfpackSocialService;
  // static membership = WolfpackMembershipService;
  // static location = WolfpackLocationService;
  // static events = WolfpackEventsService;
  // static broadcasts = WolfpackBroadcastService;
  // static realtime = WolfpackRealtimeService;

  /**
   * Get service version and health info
   */
  static getServiceInfo() {
    return {
      version: '2.0.0-consolidated',
      phase: 'Phase 2 - Service Consolidation',
      status: 'In Progress',
      completedModules: ['auth', 'feed'],
      pendingModules: ['social', 'membership', 'location', 'events', 'broadcasts', 'realtime'],
      previousServices: [
        'wolfpack.service.ts',
        'wolfpack-backend.service.ts', 
        'wolfpack-enhanced.service.ts',
        'wolfpack-auth.service.ts',
        'wolfpack-social.service.ts',
        'wolfpack-membership.service.ts',
        'wolfpack-location.service.ts'
      ]
    };
  }

  /**
   * Initialize the service (for any setup needed)
   */
  static async initialize() {
    console.log('🐺 Wolfpack Service v2.0 - Consolidated Architecture');
    console.log('📋 Service Info:', this.getServiceInfo());
    return true;
  }
}

// Default export for convenience
export default WolfpackService;

// Legacy compatibility exports (temporary during migration)
export { WolfpackAuthService as LegacyWolfpackAuthService };
export { WolfpackFeedService as LegacyWolfpackFeedService };
export { WolfpackBackendService };
export { WolfpackSocialService };

// Export with lowercase for backward compatibility
export { WolfpackSocialService as wolfpackSocialService };