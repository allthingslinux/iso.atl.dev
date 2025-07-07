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
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/.vercel/**",
      "**/*.tsbuildinfo",
      "**/public/sw.js",
      "**/public/workbox-*.js",
      "**/.DS_Store",
      "**/*.pem",
      "**/npm-debug.log*",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",
      "**/.env*.local",
      "**/coverage/**",
      "**/.nyc_output/**",
      "**/tmp/**",
      "**/temp/**",
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
