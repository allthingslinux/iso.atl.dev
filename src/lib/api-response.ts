import { NextResponse } from "next/server";
import { CACHE_HEADERS, HTTP_STATUS, SECURITY_HEADERS } from "./constants";

// Standard API response types
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    duration?: number;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Response builder class for fluent API
export class ResponseBuilder<T = unknown> {
  private status: number = HTTP_STATUS.OK;
  private headers = new Headers();
  private data?: T;
  private error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  private meta: Record<string, any> = {};
  private startTime = Date.now();

  constructor() {
    // Add default security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      this.headers.set(key, value);
    });
  }

  // Success methods
  withData(data: T): this {
    this.data = data;
    return this;
  }

  withStatus(status: number): this {
    this.status = status;
    return this;
  }

  // Error methods
  withError(message: string, code?: string, details?: unknown): this {
    this.error = { message, code, details };
    this.status = this.status === HTTP_STATUS.OK ? HTTP_STATUS.BAD_REQUEST : this.status;
    return this;
  }

  // Header methods
  withHeader(key: string, value: string): this {
    this.headers.set(key, value);
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    Object.entries(headers).forEach(([key, value]) => {
      this.headers.set(key, value);
    });
    return this;
  }

  withCache(type: keyof typeof CACHE_HEADERS): this {
    this.headers.set("Cache-Control", CACHE_HEADERS[type]);
    return this;
  }

  // Meta methods
  withMeta(key: string, value: any): this {
    this.meta[key] = value;
    return this;
  }

  withPagination(page: number, limit: number, total: number): this {
    this.meta.pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
    return this;
  }

  // Build the response
  build(): NextResponse {
    const duration = Date.now() - this.startTime;
    const timestamp = new Date().toISOString();

    const meta = {
      timestamp,
      duration,
      ...this.meta,
    };

    if (this.error) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: this.error,
          meta,
        },
        {
          status: this.status,
          headers: this.headers,
        }
      );
    }

    return NextResponse.json<ApiSuccessResponse<T>>(
      {
        success: true,
        data: this.data as T,
        meta,
      },
      {
        status: this.status,
        headers: this.headers,
      }
    );
  }
}

// Helper functions for common responses
export const ApiResponses = {
  // Success responses
  success<T>(data: T, status = HTTP_STATUS.OK): NextResponse {
    return new ResponseBuilder<T>()
      .withData(data)
      .withStatus(status)
      .build();
  },

  created<T>(data: T): NextResponse {
    return new ResponseBuilder<T>()
      .withData(data)
      .withStatus(HTTP_STATUS.CREATED)
      .build();
  },

  noContent(): NextResponse {
    return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
  },

  // Error responses
  badRequest(message: string, details?: unknown): NextResponse {
    return new ResponseBuilder()
      .withError(message, "BAD_REQUEST", details)
      .withStatus(HTTP_STATUS.BAD_REQUEST)
      .build();
  },

  unauthorized(message = "Unauthorized"): NextResponse {
    return new ResponseBuilder()
      .withError(message, "UNAUTHORIZED")
      .withStatus(HTTP_STATUS.UNAUTHORIZED)
      .build();
  },

  forbidden(message = "Forbidden"): NextResponse {
    return new ResponseBuilder()
      .withError(message, "FORBIDDEN")
      .withStatus(HTTP_STATUS.FORBIDDEN)
      .build();
  },

  notFound(resource = "Resource"): NextResponse {
    return new ResponseBuilder()
      .withError(`${resource} not found`, "NOT_FOUND")
      .withStatus(HTTP_STATUS.NOT_FOUND)
      .build();
  },

  conflict(message: string): NextResponse {
    return new ResponseBuilder()
      .withError(message, "CONFLICT")
      .withStatus(HTTP_STATUS.CONFLICT)
      .build();
  },

  tooManyRequests(message = "Too many requests"): NextResponse {
    return new ResponseBuilder()
      .withError(message, "RATE_LIMIT_EXCEEDED")
      .withStatus(HTTP_STATUS.TOO_MANY_REQUESTS)
      .build();
  },

  serverError(message = "Internal server error", details?: unknown): NextResponse {
    return new ResponseBuilder()
      .withError(message, "INTERNAL_ERROR", details)
      .withStatus(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .build();
  },

  serviceUnavailable(message = "Service unavailable"): NextResponse {
    return new ResponseBuilder()
      .withError(message, "SERVICE_UNAVAILABLE")
      .withStatus(HTTP_STATUS.SERVICE_UNAVAILABLE)
      .build();
  },
};

// Type guards
export function isApiSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}