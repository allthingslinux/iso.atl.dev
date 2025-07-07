/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Node environment
      NODE_ENV: "development" | "production" | "test";

      // Next.js public environment variables
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_API_URL?: string;
      NEXT_PUBLIC_SITE_NAME?: string;

      // Server-side environment variables
      DATABASE_URL?: string;
      SECRET_KEY?: string;

      // Add more environment variables as needed
      [key: string]: string | undefined;
    }
  }
}

// This file needs to be a module
export {};
