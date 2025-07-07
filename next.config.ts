import type { NextConfig } from "next";

/**
 * Production-ready Next.js configuration optimized for Google Drive Index applications
 *
 * Key optimizations:
 * - Google Drive API caching and rate limiting
 * - Large file streaming and thumbnail optimization
 * - Cloudflare Workers compatibility
 * - Security headers for file serving
 * - Bundle splitting for Google APIs
 * - Performance monitoring and analytics
 */
const nextConfig: NextConfig = {
  // Basic Configuration
  reactStrictMode: true,
  pageExtensions: ["tsx", "ts"],

  // Performance Optimizations
  poweredByHeader: false,
  generateEtags: true,

  // Cloudflare Workers Optimization
  output: "standalone",

  // Performance Monitoring
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "date-fns",
      "react-markdown",
      "framer-motion",
      "@tanstack/react-virtual",
    ],
    nodeMiddleware: true,
    // Server Actions optimization for Google Drive API
    serverActions: {
      allowedOrigins: ["localhost:3000", process.env.VERCEL_URL || ""],
      bodySizeLimit: "10mb", // Large file metadata
    },
    // Optimize for file serving
    optimizeServerReact: true,
    // Experimental performance features
    webVitalsAttribution: ["CLS", "FCP", "FID", "INP", "LCP", "TTFB"],
  },

  // Image Optimization (Google Drive + Cloudflare optimized)
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Google Drive thumbnails and external domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/thumbnail**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "docs.google.com",
        pathname: "**",
      },
    ],
    unoptimized: false,
  },

  // Bundle Optimization

  // Turbopack Configuration (Next.js 15+)
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },

  // Compiler Optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
    // React compiler optimization (if available)
    reactRemoveProperties:
      process.env.NODE_ENV === "production"
        ? {
            properties: ["^data-testid$"],
          }
        : false,
  },

  // Security Headers + Google Drive Optimization
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      // Google Drive API routes - Short cache with background refresh
      {
        source: "/api/(files|search|paths)/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=900", // 5min cache, 15min stale
          },
        ],
      },
      // File downloads - Long cache for immutable content
      {
        source: "/api/(download|raw)/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800", // 1hr, 1day, 1week
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      // Thumbnails - Very long cache
      {
        source: "/api/(thumb|og)/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, s-maxage=31536000, immutable", // 30days, 1year
          },
        ],
      },
      // Other API routes
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300", // 1min cache, 5min stale
          },
        ],
      },
      // Static assets
      {
        source:
          "/(_next/static/.*|favicon.ico|favicon.png|favicon.svg|logo.svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Webpack Configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            reuseExistingChunk: true,
          },
          // Google APIs and Drive-specific libraries
          googleapis: {
            test: /[\\/]node_modules[\\/](googleapis|@google-cloud)[\\/]/,
            name: "googleapis",
            priority: 15,
            reuseExistingChunk: true,
          },
          // Media handling libraries
          media: {
            test: /[\\/]node_modules[\\/](fflate|@vidstack)[\\/]/,
            name: "media",
            priority: 12,
            reuseExistingChunk: true,
          },
          // UI components
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: "ui",
            priority: 11,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Performance monitoring in development
    if (dev && !isServer) {
      config.optimization.concatenateModules = false; // Better for debugging
    }

    // Optimize for large file handling
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // TypeScript Configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint Configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Redirects for better SEO and UX
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      // Legacy Google Drive URLs redirect
      {
        source: "/drive/:path*",
        destination: "/:path*",
        permanent: true,
      },
      // File viewer redirect (common pattern)
      {
        source: "/file/:path*",
        destination: "/:path*",
        permanent: true,
      },
      // Directory listing redirect
      {
        source: "/folder/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },

  // Environment Variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || "",
    // Google Drive API optimization
    GOOGLE_DRIVE_API_TIMEOUT: process.env.GOOGLE_DRIVE_API_TIMEOUT || "30000",
    // Enable streaming for large files
    ENABLE_FILE_STREAMING: process.env.ENABLE_FILE_STREAMING || "true",
    // Performance monitoring
    ENABLE_PERFORMANCE_MONITORING:
      process.env.ENABLE_PERFORMANCE_MONITORING || "false",
  },

  // Server-side configuration for Google Drive
  serverRuntimeConfig: {
    // Google Drive API connection settings
    googleDriveTimeout: 30000,
    maxFileSize: 100 * 1024 * 1024, // 100MB default
    chunkSize: 1024 * 1024, // 1MB chunks for streaming
  },

  // Public runtime config
  publicRuntimeConfig: {
    // Cache settings for client-side
    thumbnailCacheTTL: 3600000, // 1 hour
    fileListCacheTTL: 300000, // 5 minutes
    // Performance monitoring
    performanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === "true",
  },

  // Development Configuration
  ...(process.env.NODE_ENV === "development" && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
};

export default nextConfig;
