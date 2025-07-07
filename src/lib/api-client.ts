import { API_CONFIG } from "./constants";
import {
  AppError,
  ExternalServiceError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
  getErrorMessage,
} from "./errors";

// Request configuration interface
export interface ApiRequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retry?: boolean | number;
  retryDelay?: number;
}

// Response interceptor type
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

// Request interceptor type
type RequestInterceptor = (
  config: ApiRequestConfig
) => ApiRequestConfig | Promise<ApiRequestConfig>;

// API client class
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL = "", defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...defaultHeaders,
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // Build URL with params
  private buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  // Apply request interceptors
  private async applyRequestInterceptors(
    config: ApiRequestConfig
  ): Promise<ApiRequestConfig> {
    let currentConfig = config;

    for (const interceptor of this.requestInterceptors) {
      currentConfig = await interceptor(currentConfig);
    }

    return currentConfig;
  }

  // Apply response interceptors
  private async applyResponseInterceptors(
    response: Response
  ): Promise<Response> {
    let currentResponse = response;

    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor(currentResponse);
    }

    return currentResponse;
  }

  // Handle response errors
  private async handleResponseError(response: Response): Promise<never> {
    const contentType = response.headers.get("content-type");
    let errorBody: any = {};

    if (contentType?.includes("application/json")) {
      try {
        errorBody = await response.json();
      } catch {
        // Failed to parse JSON
      }
    }

    const message = errorBody.message || errorBody.error || response.statusText;

    switch (response.status) {
      case 400:
        throw new ValidationError(message, errorBody.details);
      case 401:
        throw new UnauthorizedError(message);
      case 429:
        throw new RateLimitError(message);
      case 502:
      case 503:
      case 504:
        throw new ExternalServiceError("API", errorBody);
      default:
        throw new AppError(message, response.status, undefined, errorBody);
    }
  }

  // Execute request with retry logic
  private async executeWithRetry(
    url: string,
    config: ApiRequestConfig
  ): Promise<Response> {
    const {
      retry = API_CONFIG.MAX_RETRIES,
      retryDelay = API_CONFIG.RETRY_DELAY,
      timeout = API_CONFIG.TIMEOUT,
      ...fetchConfig
    } = config;

    const maxRetries =
      typeof retry === "boolean" ? (retry ? API_CONFIG.MAX_RETRIES : 0) : retry;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleResponseError(response);
        }

        return response;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(getErrorMessage(error));

        // Don't retry on client errors
        if (
          lastError instanceof ValidationError ||
          lastError instanceof UnauthorizedError
        ) {
          throw lastError;
        }

        // Don't retry if it's the last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (attempt + 1))
        );
      }
    }

    throw lastError || new Error("Request failed");
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { params, headers = {}, ...restConfig } = config;

    // Build full URL
    const url = this.buildURL(endpoint, params);

    // Merge headers
    const mergedConfig: ApiRequestConfig = {
      ...restConfig,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
    };

    // Apply request interceptors
    const finalConfig = await this.applyRequestInterceptors(mergedConfig);

    // Execute request with retry
    let response = await this.executeWithRetry(url, finalConfig);

    // Apply response interceptors
    response = await this.applyResponseInterceptors(response);

    // Parse response
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }

    return response.text() as T;
  }

  // HTTP methods
  async get<T>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, "body" | "method">
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: Omit<ApiRequestConfig, "body" | "method">
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: Omit<ApiRequestConfig, "body" | "method">
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: Omit<ApiRequestConfig, "body" | "method">
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, "body" | "method">
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}

// Create default API client instance
export const apiClient = new ApiClient("/api");

// Add default interceptors
apiClient.addRequestInterceptor((config) => {
  // Add timestamp to prevent caching
  if (config.method === "GET") {
    const headers = config.headers;
    const hasCacheControl =
      headers instanceof Headers
        ? headers.has("Cache-Control")
        : headers && typeof headers === "object" && "Cache-Control" in headers;

    if (!hasCacheControl) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
  }
  return config;
});

apiClient.addResponseInterceptor(async (response) => {
  // Log slow requests in development
  if (process.env.NODE_ENV === "development") {
    const duration = response.headers.get("X-Response-Time");
    if (duration && parseInt(duration) > 1000) {
      console.warn(`Slow API response: ${response.url} took ${duration}ms`);
    }
  }
  return response;
});
