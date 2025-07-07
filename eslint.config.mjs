import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  // Use Next.js recommended configuration as base
  ...compat.config({
    extends: [
      "next/core-web-vitals", // Includes Next.js specific rules + React rules
      "next/typescript",      // TypeScript specific rules for Next.js
      "prettier",            // Disable ESLint rules that conflict with Prettier
    ],
  }),
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      // Dependencies
      "**/node_modules/**",
      "**/.pnp",
      "**/.pnp.js",
      "**/.yarn/**",
      
      // Build outputs
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/.vercel/**",
      "**/storybook-static/**",
      
      // Testing & Coverage
      "**/coverage/**",
      "**/.nyc_output/**",
      "**/test-results/**",
      "**/playwright-report/**",
      "**/playwright/.cache/**",
      
      // Configuration files
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      "**/commitlint.config.js",
      
      // Generated files
      "**/*.min.js",
      "**/*.min.css",
      "**/public/sw.js",
      "**/public/workbox-*.js",
      "**/public/worker-*.js",
      "**/public/fallback-*.js",
      "**/public/precache.*.js",
      
      // TypeScript
      "**/*.d.ts",
      "**/next-env.d.ts",
      "**/*.tsbuildinfo",
      
      // Logs
      "**/logs/**",
      "**/*.log",
      "**/npm-debug.log*",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",
      "**/pnpm-debug.log*",
      "**/lerna-debug.log*",
      
      // OS files
      "**/.DS_Store",
      "**/Thumbs.db",
      
      // Security
      "**/*.pem",
      "**/*.key",
      "**/*.crt",
      
      // Environment
      "**/.env*",
      
      // Temporary & cache
      "**/.cache/**",
      "**/.parcel-cache/**",
      "**/tmp/**",
      "**/temp/**",
      "**/*.tmp",
      "**/*.temp",
      
      // Package files
      "**/package-lock.json",
      "**/yarn.lock",
      "**/pnpm-lock.yaml",
      
      // Documentation
      "**/*.md",
      "**/LICENSE",
      
      // Misc
      "**/.eslintcache",
      "**/.prettierignore",
      "**/.gitignore",
    ],
  },
  // Add custom rules as a separate configuration object
  {
    rules: {
      // TypeScript rules (warnings for gradual adoption)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      }],
      
      // React best practices
      // Allow both arrow functions and function declarations
      "react/function-component-definition": "off",
      
      // Next.js specific rules
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "warn", // Warn instead of error for gradual migration
      
      // General code quality
      "no-console": ["warn", { 
        allow: ["warn", "error", "info", "debug"] // Allow more console methods in development
      }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "warn",
      "prefer-arrow-callback": "off", // Turn off to allow function expressions
      "prefer-template": "warn",
      
      // Import rules (when import plugin is available)
      "import/first": "off",
      "import/newline-after-import": "off",
      "import/no-duplicates": "off",
    },
  },
];

export default eslintConfig;
