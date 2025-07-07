import { NextResponse } from "next/server";

// Custom error types for better error handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: unknown) {
    super(
      `External service error: ${service}`,
      503,
      "EXTERNAL_SERVICE_ERROR",
      originalError
    );
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    details?: unknown;
  };
}

// Centralized error handler for API routes
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Log error for monitoring
  logError(error);

  // Handle known errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
          details:
            process.env.NODE_ENV === "development" ? error.details : undefined,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle Next.js errors
  if (error instanceof Error) {
    const errWithStatus = error as Error & { statusCode?: number };
    const statusCode = errWithStatus.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          message:
            process.env.NODE_ENV === "production"
              ? "Internal server error"
              : error.message,
          code: "INTERNAL_ERROR",
          statusCode,
          timestamp: new Date().toISOString(),
          details:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      },
      { status: statusCode }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: {
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

// Error logging function
function logError(error: unknown): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    environment: process.env.NODE_ENV,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error instanceof AppError && {
              code: error.code,
              statusCode: error.statusCode,
              details: error.details,
            }),
          }
        : error,
  };

  // In production, send to monitoring service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to monitoring service (e.g., Sentry, LogRocket)
    if (error instanceof Error) {
      console.error(JSON.stringify(errorInfo));
    } else {
      console.error("Unknown error", error);
    }
  } else {
    if (error instanceof Error) {
      console.error("Error:", errorInfo);
    } else {
      console.error("Unknown error", error);
    }
  }
}

// Async error wrapper for route handlers
export function withErrorHandler<
  T extends (...args: unknown[]) => Promise<unknown>,
>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

// Type guard for checking if error has statusCode
export function hasStatusCode(
  error: unknown
): error is Error & { statusCode: number } {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof (error as Error & { statusCode?: unknown }).statusCode === "number"
  );
}

// Safe error message extraction
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

// Create standardized API response
export function createApiResponse<T>(
  data: T,
  status = 200,
  headers?: HeadersInit
): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status, headers });
}

// Create standardized error response
export function createErrorResponse(
  message: string,
  statusCode = 500,
  code?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return handleApiError(new AppError(message, statusCode, code, details));
}
