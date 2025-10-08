import { TRPCError } from "@trpc/server";
import { logger } from "@midday/logger";

export type ErrorCode = 
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN" 
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "METHOD_NOT_SUPPORTED"
  | "TOO_MANY_REQUESTS";

export interface ErrorDetails {
  field?: string;
  reason?: string;
  suggestion?: string;
  metadata?: Record<string, any>;
}

export class AppError extends TRPCError {
  public readonly details?: ErrorDetails;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: ErrorDetails,
    cause?: unknown
  ) {
    super({ code, message, cause });
    this.details = details;
    this.timestamp = new Date();
    this.requestId = process.env.REQUEST_ID;
  }
}

// Error handler wrapper for procedures
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Log the error
    logger.error(`Error in ${context || 'unknown context'}:`, error);

    // If it's already a TRPCError, rethrow it
    if (error instanceof TRPCError) {
      throw error;
    }

    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; detail?: string };
      
      switch (dbError.code) {
        case '23505': // Unique violation
          throw new AppError(
            'CONFLICT',
            'A record with this value already exists',
            { reason: dbError.detail }
          );
        case '23503': // Foreign key violation
          throw new AppError(
            'BAD_REQUEST',
            'Referenced record does not exist',
            { reason: dbError.detail }
          );
        case '23502': // Not null violation
          throw new AppError(
            'BAD_REQUEST',
            'Required field is missing',
            { reason: dbError.detail }
          );
        case '22P02': // Invalid text representation
          throw new AppError(
            'BAD_REQUEST',
            'Invalid data format',
            { reason: dbError.detail }
          );
        default:
          // Fall through to generic error
      }
    }

    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new AppError(
        'TIMEOUT',
        'The operation took too long to complete',
        { suggestion: 'Please try again or contact support if the issue persists' }
      );
    }

    // Generic error
    throw new AppError(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      { 
        suggestion: 'Please try again later or contact support',
        metadata: { originalError: error instanceof Error ? error.message : String(error) }
      }
    );
  }
}

// Validation error helper
export function validationError(field: string, message: string): never {
  throw new AppError(
    'BAD_REQUEST',
    `Validation failed: ${message}`,
    { field, reason: message }
  );
}

// Not found error helper
export function notFoundError(resource: string, id?: string): never {
  throw new AppError(
    'NOT_FOUND',
    `${resource} not found`,
    { metadata: { resource, id } }
  );
}

// Unauthorized error helper
export function unauthorizedError(reason?: string): never {
  throw new AppError(
    'UNAUTHORIZED',
    'Authentication required',
    { reason: reason || 'You must be logged in to perform this action' }
  );
}

// Forbidden error helper
export function forbiddenError(resource?: string): never {
  throw new AppError(
    'FORBIDDEN',
    'Access denied',
    { 
      reason: `You don't have permission to access ${resource || 'this resource'}`,
      suggestion: 'Contact your team admin for access'
    }
  );
}

// Rate limit error helper
export function rateLimitError(retryAfter?: number): never {
  throw new AppError(
    'TOO_MANY_REQUESTS',
    'Too many requests',
    { 
      reason: 'Rate limit exceeded',
      suggestion: `Please wait ${retryAfter || 60} seconds before trying again`,
      metadata: { retryAfter }
    }
  );
}

// Service unavailable error helper
export function serviceUnavailableError(service?: string): never {
  throw new AppError(
    'SERVICE_UNAVAILABLE',
    `${service || 'Service'} is temporarily unavailable`,
    { 
      suggestion: 'Please try again in a few moments',
      metadata: { service }
    }
  );
}