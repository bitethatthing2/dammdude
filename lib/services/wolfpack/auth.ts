import { supabase } from '@/lib/supabase';
import { WolfpackUser, ServiceResponse } from './types';
import { 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
  validateRequired,
  validateUUID 
} from './errors';

// =============================================================================
// WOLFPACK AUTHENTICATION & AUTHORIZATION SERVICE
// =============================================================================

export class WolfpackAuthService {
  /**
   * Get current authenticated user with wolfpack profile
   */
  static getCurrentUser = withErrorHandling(async (): Promise<WolfpackUser | null> => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw new AuthenticationError(authError.message);
    if (!authUser) return null;

    // Get the public user profile
    const { data: publicUser, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') return null;
      throw profileError;
    }

    return publicUser as WolfpackUser;
  }, 'WolfpackAuthService.getCurrentUser');

  /**
   * Verify user is authenticated
   */
  static verifyUser = withErrorHandling(async (): Promise<WolfpackUser> => {
    const user = await this.getCurrentUser();
    if (!user) throw new AuthenticationError();
    return user;
  }, 'WolfpackAuthService.verifyUser');

  /**
   * Check if user is VIP
   */
  static isVipUser = withErrorHandling(async (userId?: string): Promise<boolean> => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const user = await this.getCurrentUser();
      if (!user) return false;
      targetUserId = user.id;
    }

    validateUUID(targetUserId, 'User ID');

    const { data: user, error } = await supabase
      .from('users')
      .select('is_vip')
      .eq('id', targetUserId)
      .single();

    if (error) throw error;
    return user?.is_vip || false;
  }, 'WolfpackAuthService.isVipUser');

  /**
   * Check if user has location bypass permissions
   */
  static hasLocationBypass = withErrorHandling(async (userId?: string): Promise<boolean> => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const user = await this.getCurrentUser();
      if (!user) return false;
      targetUserId = user.id;
    }

    validateUUID(targetUserId, 'User ID');

    const { data: user, error } = await supabase
      .from('users')
      .select('location_bypass')
      .eq('id', targetUserId)
      .single();

    if (error) throw error;
    return user?.location_bypass || false;
  }, 'WolfpackAuthService.hasLocationBypass');

  /**
   * Get user display name with priority order
   */
  static getUserDisplayName(user: Partial<WolfpackUser>): string {
    if (user.display_name?.trim()) return user.display_name.trim();
    
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) return fullName;
    
    return 'Anonymous';
  }

  /**
   * Check if user can perform admin actions
   */
  static canPerformAdminActions = withErrorHandling(async (userId?: string): Promise<boolean> => {
    const isVip = await this.isVipUser(userId);
    const hasLocationBypass = await this.hasLocationBypass(userId);
    
    return isVip || hasLocationBypass;
  }, 'WolfpackAuthService.canPerformAdminActions');

  /**
   * Validate session and return user
   */
  static validateSession = withErrorHandling(async (): Promise<ServiceResponse<WolfpackUser>> => {
    try {
      const user = await this.verifyUser();
      return createSuccessResponse(user);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, 'WolfpackAuthService.validateSession');

  /**
   * Get user by ID with optional authentication check
   */
  static getUserById = withErrorHandling(async (
    userId: string, 
    requireAuth = false
  ): Promise<WolfpackUser | null> => {
    validateRequired(userId, 'User ID');
    validateUUID(userId, 'User ID');

    if (requireAuth) {
      await this.verifyUser();
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return user as WolfpackUser;
  }, 'WolfpackAuthService.getUserById');

  /**
   * Check if user owns resource
   */
  static userOwnsResource = withErrorHandling(async (
    resourceUserId: string,
    currentUserId?: string
  ): Promise<boolean> => {
    validateRequired(resourceUserId, 'Resource User ID');
    validateUUID(resourceUserId, 'Resource User ID');

    let userId = currentUserId;
    if (!userId) {
      const user = await this.getCurrentUser();
      if (!user) return false;
      userId = user.id;
    }

    return resourceUserId === userId;
  }, 'WolfpackAuthService.userOwnsResource');

  /**
   * Require user ownership or VIP status
   */
  static requireOwnershipOrVip = withErrorHandling(async (
    resourceUserId: string,
    currentUserId?: string
  ): Promise<void> => {
    const user = currentUserId ? 
      await this.getUserById(currentUserId, false) : 
      await this.verifyUser();

    if (!user) throw new AuthenticationError();

    const ownsResource = await this.userOwnsResource(resourceUserId, user.id);
    const isVip = await this.isVipUser(user.id);

    if (!ownsResource && !isVip) {
      throw new AuthorizationError('Must be resource owner or VIP user');
    }
  }, 'WolfpackAuthService.requireOwnershipOrVip');

  /**
   * Get user profile helpers
   */
  static getUserHelpers(user: WolfpackUser) {
    return {
      displayName: this.getUserDisplayName(user),
      avatar: user.avatar_url || '/icons/wolf-icon.png',
      isVip: user.is_vip || false,
      hasLocationBypass: user.location_bypass || false,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined
    };
  }

  /**
   * Refresh user session
   */
  static refreshSession = withErrorHandling(async (): Promise<ServiceResponse<WolfpackUser>> => {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      return createErrorResponse(new AuthenticationError(error.message));
    }

    if (!data.user) {
      return createErrorResponse(new AuthenticationError('No user in refreshed session'));
    }

    const user = await this.getCurrentUser();
    if (!user) {
      return createErrorResponse(new NotFoundError('User profile'));
    }

    return createSuccessResponse(user);
  }, 'WolfpackAuthService.refreshSession');

  /**
   * Sign out user
   */
  static signOut = withErrorHandling(async (): Promise<ServiceResponse<void>> => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return createErrorResponse(new AuthenticationError(error.message));
    }

    return createSuccessResponse(undefined);
  }, 'WolfpackAuthService.signOut');
}