# ESLint Configuration for Next.js 15

This document explains our ESLint setup following [Next.js ESLint configuration best practices](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/05-config/03-eslint.mdx).

## 📋 Overview

Our ESLint configuration uses the new flat config format with Next.js 15 recommended presets.

### Configuration Files
- `eslint.config.mjs` - Main ESLint configuration using flat config format with built-in ignores

## 🔧 Configuration Details

### Base Configuration
We extend the following Next.js configurations:

1. **`next/core-web-vitals`** - Includes:
   - Next.js specific rules
   - React rules
   - React Hooks rules
   - Web Vitals rules
   - Accessibility (jsx-a11y) rules

2. **`next/typescript`** - TypeScript specific rules optimized for Next.js

3. **`prettier`** - Disables ESLint rules that conflict with Prettier

### Custom Rules

#### TypeScript Rules (Warnings for Gradual Adoption)
```javascript
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
```

#### React Best Practices
```javascript
// Allow both arrow functions and function declarations
"react/function-component-definition": "off",
```

#### Next.js Specific
```javascript
"@next/next/no-html-link-for-pages": "error",
"@next/next/no-img-element": "warn", // Warn for gradual migration to next/image
```

#### General Code Quality
```javascript
"no-console": ["warn", { 
  allow: ["warn", "error", "info", "debug"] // Allow useful console methods
}],
"prefer-const": "error",
"no-var": "error",
"object-shorthand": "warn",
"prefer-arrow-callback": "off", // Allow function expressions
"prefer-template": "warn",
```

## 📜 Available Scripts

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Run all validation (TypeScript, ESLint, Prettier)
npm run validate
```

## 🚀 Best Practices Applied

1. **Flat Config Format**: Using the new ESLint flat config format as recommended for modern projects

2. **Next.js Presets**: Leveraging Next.js maintained configurations for optimal compatibility

3. **Gradual Adoption**: TypeScript rules set to `warn` instead of `error` for easier migration

4. **Performance**: Using `ignores` property instead of deprecated `.eslintignore`

5. **Integration**: Works seamlessly with `next lint` command

6. **Flexible Component Syntax**: Allowing both arrow functions and function declarations for components

7. **Modern Ignores Pattern**: Using glob patterns in the config file for better control

## 📦 Dependencies

The following ESLint packages are installed:
- `eslint` - Core ESLint
- `eslint-config-next` - Next.js ESLint configuration
- `eslint-config-prettier` - Prettier integration
- `@typescript-eslint/eslint-plugin` - TypeScript support
- `@typescript-eslint/parser` - TypeScript parser
- `eslint-plugin-react` - React specific rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-jsx-a11y` - Accessibility rules
- `eslint-plugin-import` - Import/export rules

## 🎯 What Gets Linted

By default, Next.js will run ESLint for all files in:
- `pages/`
- `app/`
- `components/`
- `lib/`
- `src/`

## 🔍 Ignored Files

The `ignores` property in `eslint.config.mjs` excludes:
- `**/node_modules/**` - Dependencies
- `**/.next/**` - Next.js build output
- `**/out/**` - Static export directory
- `**/*.tsbuildinfo` - TypeScript cache
- `**/.env*.local` - Environment files
- `**/coverage/**` - Test coverage reports
- Build artifacts and temporary files

Note: The `.eslintignore` file is deprecated in flat config. Use the `ignores` property instead.

## 💡 Tips

1. **VS Code Integration**: Install the ESLint extension for real-time linting
2. **Pre-commit Hook**: Consider using husky + lint-staged for automatic linting
3. **CI/CD**: Add `npm run lint` to your CI pipeline

## � Migration Notes

If you're upgrading from an older ESLint configuration:

1. **Remove `.eslintignore`**: The ignores are now in the config file
2. **Update scripts**: `next lint` works with flat config automatically
3. **Review warnings**: We've set many rules to `warn` for gradual adoption
4. **Component syntax**: Both arrow functions and regular functions are now allowed

## �🔗 References

- [Next.js ESLint Documentation](https://nextjs.org/docs/app/api-reference/config/eslint)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Next.js ESLint Configuration Guide](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/05-config/03-eslint.mdx)