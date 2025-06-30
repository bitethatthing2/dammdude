import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface UserFriendlyError {
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
  retryable: boolean;
  action?: string;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  locationId?: string;
  membershipId?: string;
  additional?: Record<string, unknown>;
}

// FIXED: Properly typed error interfaces
interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

interface AuthError {
  message: string;
  status?: number;
  error_description?: string;
}

interface GeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED?: number;
  POSITION_UNAVAILABLE?: number;
  TIMEOUT?: number;
}

// FIXED: Union type for all possible error types - now exported
export type WolfpackError = PostgrestError | Error | DatabaseError | AuthError | GeolocationError | { message: string; code?: string };

export class WolfpackErrorHandler {
  /**
   * Handle Supabase PostgrestError consistently across the app
   */
  static handleSupabaseError(
    error: WolfpackError,
    context?: ErrorContext
  ): UserFriendlyError {
    // Log error for debugging
    console.error('Wolfpack Error:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });

    // Handle PostgrestError specifically
    if (this.isPostgrestError(error)) {
      return this.handlePostgrestError(error, context);
    }

    // Handle generic Error
    if (error instanceof Error) {
      return this.handleGenericError(error, context);
    }

    // Handle database errors
    if (this.isDatabaseError(error)) {
      return this.handleDatabaseError(error, context);
    }

    // Handle auth errors
    if (this.isAuthError(error)) {
      return this.handleAuthError(error);
    }

    // Handle geolocation errors
    if (this.isGeolocationError(error)) {
      return this.handleLocationError(error);
    }

    // Handle unknown error format
    return {
      message: 'An unexpected error occurred',
      type: 'error',
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Type guards for different error types
   */
  private static isPostgrestError(error: WolfpackError): error is PostgrestError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error && 'details' in error;
  }

  private static isDatabaseError(error: WolfpackError): error is DatabaseError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error && !('details' in error);
  }

  private static isAuthError(error: WolfpackError): error is AuthError {
    return typeof error === 'object' && error !== null && 'message' in error && 
           (error.message.includes('auth') || error.message.includes('credentials') || error.message.includes('email'));
  }

  private static isGeolocationError(error: WolfpackError): error is GeolocationError {
    return typeof error === 'object' && error !== null && 'code' in error && typeof (error as GeolocationError).code === 'number';
  }

  /**
   * Handle specific PostgrestError codes
   */
  private static handlePostgrestError(
    error: PostgrestError,
    context?: ErrorContext
  ): UserFriendlyError {
    const errorMap: Record<string, UserFriendlyError> = {
      // Authentication errors
      'PGRST301': {
        message: 'Authentication required',
        type: 'warning',
        retryable: false,
        action: 'Please sign in to continue'
      },
      'PGRST302': {
        message: 'Access denied',
        type: 'error',
        retryable: false,
        action: 'You don\'t have permission for this action'
      },

      // Data errors
      'PGRST116': {
        message: 'No data found',
        type: 'info',
        retryable: false,
        action: 'The requested information is not available'
      },
      'PGRST204': {
        message: 'No content',
        type: 'info',
        retryable: false
      },

      // Database constraint errors
      '23505': {
        message: 'Duplicate entry',
        type: 'warning',
        retryable: false,
        action: 'This action has already been completed'
      },
      '23503': {
        message: 'Related data not found',
        type: 'error',
        retryable: false,
        action: 'Please ensure all required information is provided'
      },
      '23514': {
        message: 'Invalid data provided',
        type: 'error',
        retryable: false,
        action: 'Please check your input and try again'
      },

      // Network/connection errors
      'PGRST000': {
        message: 'Connection failed',
        type: 'error',
        retryable: true,
        action: 'Please check your internet connection and try again'
      },

      // Generic SQL errors
      '42P01': {
        message: 'Service temporarily unavailable',
        type: 'error',
        retryable: true,
        action: 'Please try again in a moment'
      }
    };

    const mappedError = errorMap[error.code];
    if (mappedError) {
      return {
        ...mappedError,
        code: error.code
      };
    }

    // Default handling for unmapped PostgrestError
    return {
      message: this.getGenericErrorMessage(error.message, context),
      type: 'error',
      code: error.code,
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Handle database errors
   */
  private static handleDatabaseError(
    error: DatabaseError,
    context?: ErrorContext
  ): UserFriendlyError {
    return {
      message: this.getGenericErrorMessage(error.message, context),
      type: 'error',
      code: error.code,
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Handle generic JavaScript errors
   */
  private static handleGenericError(
    error: Error,
    context?: ErrorContext
  ): UserFriendlyError {
    // Common error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        message: 'Network connection failed',
        type: 'error',
        retryable: true,
        action: 'Please check your internet connection and try again'
      };
    }

    if (error.message.includes('permission') || error.message.includes('denied')) {
      return {
        message: 'Permission denied',
        type: 'error',
        retryable: false,
        action: 'Please enable the required permissions and try again'
      };
    }

    if (error.message.includes('timeout')) {
      return {
        message: 'Request timed out',
        type: 'error',
        retryable: true,
        action: 'Please try again'
      };
    }

    // Location-specific errors
    if (context?.operation.includes('location')) {
      if (error.message.includes('geolocation')) {
        return {
          message: 'Location access required',
          type: 'warning',
          retryable: false,
          action: 'Please enable location services and try again'
        };
      }
    }

    // Membership-specific errors
    if (context?.operation.includes('membership') || context?.operation.includes('join')) {
      if (error.message.includes('location')) {
        return {
          message: 'You must be at Side Hustle Bar to join',
          type: 'warning',
          retryable: false,
          action: 'Visit one of our locations to join the Wolf Pack'
        };
      }
    }

    return {
      message: this.getGenericErrorMessage(error.message, context),
      type: 'error',
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Get user-friendly error message based on operation context
   */
  private static getGenericErrorMessage(
    originalMessage: string,
    context?: ErrorContext
  ): string {
    if (!context?.operation) {
      return 'An error occurred';
    }

    const operationMessages: Record<string, string> = {
      'auth': 'Authentication failed',
      'login': 'Login failed',
      'signup': 'Sign up failed',
      'location': 'Location verification failed',
      'membership': 'Membership operation failed',
      'join': 'Failed to join Wolf Pack',
      'leave': 'Failed to leave Wolf Pack',
      'profile': 'Profile update failed',
      'chat': 'Chat operation failed',
      'event': 'Event operation failed',
      'vote': 'Voting failed',
      'order': 'Order operation failed'
    };

    // Find matching operation
    for (const [key, message] of Object.entries(operationMessages)) {
      if (context.operation.toLowerCase().includes(key)) {
        return message;
      }
    }

    return 'Operation failed';
  }

  /**
   * Get error message for specific wolfpack operations
   */
  static getWolfpackErrorMessage(operation: string, error: WolfpackError): string {
    const context: ErrorContext = { operation };
    const userError = this.handleSupabaseError(error, context);
    return userError.message;
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: WolfpackError): boolean {
    const userError = this.handleSupabaseError(error);
    return userError.retryable;
  }

  /**
   * Get suggested action for error
   */
  static getErrorAction(error: WolfpackError): string | undefined {
    const userError = this.handleSupabaseError(error);
    return userError.action;
  }

  /**
   * Log error with context for monitoring
   */
  static logError(
    error: WolfpackError,
    context: ErrorContext,
    userId?: string
  ): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: this.getErrorMessage(error),
        code: this.getErrorCode(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      context,
      userId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    console.error('Wolfpack Error Log:', errorLog);

    // In production, you might want to send this to an error monitoring service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorMonitoring(errorLog);
    }
  }

  /**
   * Helper to safely extract error message
   */
  private static getErrorMessage(error: WolfpackError): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error';
  }

  /**
   * Helper to safely extract error code
   */
  private static getErrorCode(error: WolfpackError): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return String(error.code);
    }
    return 'UNKNOWN';
  }

  /**
   * Create error context for consistent logging
   */
  static createContext(
    operation: string,
    additionalData?: Record<string, unknown>
  ): ErrorContext {
    return {
      operation,
      additional: additionalData
    };
  }

  /**
   * Handle authentication specific errors
   */
  static handleAuthError(error: AuthError): UserFriendlyError {
    const authErrorMap: Record<string, string> = {
      'invalid_credentials': 'Invalid email or password',
      'email_not_confirmed': 'Please confirm your email address',
      'too_many_requests': 'Too many attempts. Please try again later',
      'weak_password': 'Password is too weak',
      'email_address_invalid': 'Invalid email address',
      'signup_disabled': 'Sign up is currently disabled',
      'email_address_not_authorized': 'This email is not authorized',
      'invalid_request': 'Invalid request format'
    };

    const message = authErrorMap[error.message] || 'Authentication failed';

    return {
      message,
      type: 'error',
      retryable: error.message !== 'email_address_not_authorized',
      action: error.message === 'email_not_confirmed' 
        ? 'Check your email for confirmation link' 
        : 'Please try again'
    };
  }

  /**
   * Handle location specific errors
   */
  static handleLocationError(error: GeolocationError): UserFriendlyError {
    if (error.code === 1) { // PERMISSION_DENIED
      return {
        message: 'Location access denied',
        type: 'warning',
        retryable: false,
        action: 'Please enable location services in your browser settings'
      };
    }

    if (error.code === 2) { // POSITION_UNAVAILABLE
      return {
        message: 'Location unavailable',
        type: 'error',
        retryable: true,
        action: 'Please try again or ensure GPS is enabled'
      };
    }

    if (error.code === 3) { // TIMEOUT
      return {
        message: 'Location request timed out',
        type: 'error',
        retryable: true,
        action: 'Please try again'
      };
    }

    return {
      message: 'Location verification failed',
      type: 'error',
      retryable: true,
      action: 'Please ensure location services are enabled'
    };
  }
}