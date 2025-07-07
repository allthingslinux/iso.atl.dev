// Application-wide constants with proper typing

// Environment
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const IS_TEST = process.env.NODE_ENV === "test";

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
} as const;

// File handling
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  CHUNK_SIZE: 1024 * 1024, // 1MB
  SUPPORTED_PREVIEW_EXTENSIONS: [
    "txt",
    "md",
    "json",
    "js",
    "ts",
    "jsx",
    "tsx",
    "css",
    "html",
    "xml",
    "yaml",
    "yml",
    "toml",
  ],
  SUPPORTED_IMAGE_EXTENSIONS: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp",
    "ico",
  ],
  SUPPORTED_VIDEO_EXTENSIONS: ["mp4", "webm", "ogg", "mov", "avi", "mkv"],
  SUPPORTED_AUDIO_EXTENSIONS: ["mp3", "wav", "ogg", "m4a", "flac"],
} as const;

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  DEBOUNCE_DELAY: {
    SEARCH: 300,
    INPUT: 500,
    SCROLL: 100,
  },
  ITEMS_PER_PAGE: {
    DEFAULT: 50,
    MOBILE: 25,
    MAX: 100,
  },
  TOASTER: {
    DURATION: 5000,
    MAX_VISIBLE: 3,
  },
} as const;

// Route patterns
export const ROUTES = {
  HOME: "/",
  API: {
    FILES: "/api/files",
    SEARCH: "/api/search",
    DOWNLOAD: "/api/download",
    RAW: "/api/raw",
    THUMB: "/api/thumb",
    OG: "/api/og",
  },
  INTERNAL: {
    BASE: "/ngdi-internal",
    CONFIGURATOR: "/ngdi-internal/configurator",
    EMBED: "/ngdi-internal/embed",
  },
} as const;

// HTTP Status codes with descriptions
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Cache headers
export const CACHE_HEADERS = {
  NO_CACHE: "no-cache, no-store, must-revalidate",
  SHORT: `public, s-maxage=${API_CONFIG.CACHE_TTL.SHORT}, stale-while-revalidate=${API_CONFIG.CACHE_TTL.MEDIUM}`,
  MEDIUM: `public, s-maxage=${API_CONFIG.CACHE_TTL.MEDIUM}, stale-while-revalidate=${API_CONFIG.CACHE_TTL.LONG}`,
  LONG: `public, s-maxage=${API_CONFIG.CACHE_TTL.LONG}, stale-while-revalidate=${API_CONFIG.CACHE_TTL.VERY_LONG}`,
  IMMUTABLE: "public, max-age=31536000, immutable",
} as const;

// Security headers
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
} as const;

// Type exports for better type safety
export type RouteKey = keyof typeof ROUTES;
export type ApiRouteKey = keyof typeof ROUTES.API;
export type InternalRouteKey = keyof typeof ROUTES.INTERNAL;
export type HttpStatusKey = keyof typeof HTTP_STATUS;
export type CacheHeaderKey = keyof typeof CACHE_HEADERS;
