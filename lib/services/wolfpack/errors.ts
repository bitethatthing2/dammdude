import { WolfpackError } from './types';

// =============================================================================
// CENTRALIZED ERROR HANDLING FOR WOLFPACK SERVICES
// =============================================================================

export class WolfpackServiceError extends Error implements WolfpackError {
  public code?: string;
  public details?: any;
  public statusCode?: number;

  constructor(message: string, code?: string, details?: any, statusCode?: number) {
    super(message);
    this.name = 'WolfpackServiceError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

// Specific error types
export class AuthenticationError extends WolfpackServiceError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', null, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends WolfpackServiceError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'INSUFFICIENT_PERMISSIONS', null, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends WolfpackServiceError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', { resource }, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends WolfpackServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details, 400);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends WolfpackServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'DATABASE_ERROR', originalError, 500);
    this.name = 'DatabaseError';
  }
}

export class LocationError extends WolfpackServiceError {
  constructor(message: string, details?: any) {
    super(message, 'LOCATION_ERROR', details, 403);
    this.name = 'LocationError';
  }
}

export class RateLimitError extends WolfpackServiceError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', null, 429);
    this.name = 'RateLimitError';
  }
}

// Error mapping utilities
export function mapSupabaseError(error: any): WolfpackServiceError {
  if (!error) return new WolfpackServiceError('Unknown error occurred');

  // Map common Supabase error codes
  switch (error.code) {
    case '42P01':
      return new NotFoundError('Table');
    case '23503':
      return new ValidationError('Foreign key constraint violation', error);
    case '23505':
      return new ValidationError('Unique constraint violation', error);
    case 'PGRST116':
      return new NotFoundError('Record');
    case '42501':
      return new AuthorizationError('Database permission denied');
    default:
      return new DatabaseError(error.message || 'Database operation failed', error);
  }
}

// Error logging utility
export function logError(error: WolfpackServiceError, context?: Record<string, any>) {
  const logData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Wolfpack Service Error:', logData);
  }

  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service
  }
}

// Error handling wrapper for service methods
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const wolfpackError = error instanceof WolfpackServiceError 
        ? error 
        : mapSupabaseError(error);
      
      logError(wolfpackError, { context, args: args.slice(0, 2) }); // Limit args for privacy
      throw wolfpackError;
    }
  };
}

// Response wrapper utilities
export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
    error: undefined
  };
}

export function createErrorResponse(error: WolfpackServiceError | string) {
  const wolfpackError = typeof error === 'string' 
    ? new WolfpackServiceError(error) 
    : error;

  return {
    success: false,
    data: undefined,
    error: wolfpackError.message,
    code: wolfpackError.code
  };
}

// Validation utilities
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validateUUID(id: string, fieldName = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
}

export function validatePagination(page?: number, limit?: number): { page: number; limit: number } {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(Math.max(1, limit || 20), 100); // Max 100 items per page
  
  return { page: validatedPage, limit: validatedLimit };
}