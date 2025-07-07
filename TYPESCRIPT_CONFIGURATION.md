# TypeScript Configuration for Next.js 15

This document explains the TypeScript configuration choices for our Next.js 15 application based on the official [Next.js TypeScript documentation](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/05-config/02-typescript.mdx).

## Overview

Our TypeScript configuration is optimized for:
- **Next.js 15 compatibility**
- **Type safety** with practical strictness
- **Developer experience** with helpful error messages
- **Performance** during development and builds

## Configuration Breakdown

### Language and Environment

```json
"target": "ES2022",
"lib": ["dom", "dom.iterable", "ES2022"],
"jsx": "preserve"
```

- **ES2022**: Modern JavaScript features for better performance
- **DOM libraries**: Required for browser APIs
- **JSX preserve**: Next.js handles JSX transformation

### Module System

```json
"module": "ESNext",
"moduleResolution": "bundler",
"resolveJsonModule": true,
"allowJs": true,
"checkJs": false
```

- **ESNext modules**: Latest module features
- **Bundler resolution**: Optimized for Next.js bundling
- **JSON imports**: Allows importing JSON files
- **JavaScript files**: Incremental migration support

### Emit Configuration

```json
"noEmit": true,
"incremental": true
```

- **No emit**: Next.js handles compilation
- **Incremental**: Faster subsequent builds

### Interop Constraints

```json
"esModuleInterop": true,
"allowSyntheticDefaultImports": true,
"forceConsistentCasingInFileNames": true,
"isolatedModules": true,
"moduleDetection": "force",
"verbatimModuleSyntax": false,
"allowImportingTsExtensions": false
```

- **ES module interop**: Better CommonJS compatibility
- **Isolated modules**: Required for Next.js compilation
- **Module detection**: Treats all files as modules
- **No TS extensions**: Prevents `.ts` in imports

### Type Checking

#### Strict Mode (Enabled)

```json
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true,
"strictFunctionTypes": true,
"strictBindCallApply": true,
"strictPropertyInitialization": true,
"noImplicitThis": true,
"alwaysStrict": true
```

All strict checks are enabled for maximum type safety.

#### Additional Checks

```json
"noUnusedLocals": false,
"noUnusedParameters": false,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
"noUncheckedIndexedAccess": false,
"noImplicitOverride": true,
"noPropertyAccessFromIndexSignature": false,
"exactOptionalPropertyTypes": false,
"allowUnusedLabels": false,
"allowUnreachableCode": false
```

- **Unused checks**: Disabled to avoid noise during development
- **Implicit returns**: Enforced for consistency
- **Fallthrough**: Prevents switch case bugs
- **Unchecked access**: Disabled for practicality with existing code

### Performance

```json
"skipLibCheck": true,
"skipDefaultLibCheck": true
```

Skips type checking of declaration files for faster builds.

### Next.js Integration

```json
"plugins": [{ "name": "next" }]
```

Enables Next.js TypeScript plugin for enhanced features:
- Route type checking
- Metadata validation
- Server/Client component validation

### Path Mapping

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"],
  "~/*": ["./public/*"]
}
```

- **@/**: Maps to src directory
- **~/**: Maps to public directory (new addition)

## Include/Exclude Patterns

### Include

```json
"include": [
  "next-env.d.ts",
  "**/*.ts",
  "**/*.tsx",
  ".next/types/**/*.ts",
  "*.config.js",
  "*.config.mjs",
  "*.config.ts"
]
```

- All TypeScript files
- Next.js generated types
- Configuration files

### Exclude

```json
"exclude": [
  "node_modules",
  ".next",
  "out",
  "build",
  "dist",
  "tmp",
  "temp"
]
```

Standard exclusions for build artifacts and dependencies.

## Best Practices

### 1. Type Imports

Always use type imports when importing only types:

```typescript
import type { User } from '@/types'
```

### 2. Strict Null Checks

With `strictNullChecks` enabled, handle null/undefined explicitly:

```typescript
// Bad
const user = users.find(u => u.id === id)
user.name // Error: Object is possibly 'undefined'

// Good
const user = users.find(u => u.id === id)
if (user) {
  user.name // Safe
}
```

### 3. Path Aliases

Use path aliases for cleaner imports:

```typescript
// Instead of
import { Button } from '../../../components/ui/button'

// Use
import { Button } from '@/components/ui/button'
```

### 4. Next.js Types

Leverage Next.js built-in types:

```typescript
import type { Metadata } from 'next'
import type { NextRequest } from 'next/server'
```

## Migration Tips

1. **Gradual strictness**: Start with current settings and gradually enable stricter checks
2. **Use `// @ts-expect-error`**: For temporary suppressions with explanation
3. **Avoid `any`**: Use `unknown` and type guards instead
4. **Type your API responses**: Create interfaces for all API data

## Common Issues and Solutions

### Issue: "Cannot find module '@/...'"

**Solution**: Restart TypeScript server in VS Code:
- CMD/Ctrl + Shift + P → "TypeScript: Restart TS Server"

### Issue: "Type error in third-party module"

**Solution**: `skipLibCheck` is already enabled, but if issues persist:
```typescript
declare module 'problematic-module'
```

### Issue: "Property does not exist on type"

**Solution**: Use type assertions or guards:
```typescript
// Type assertion
(obj as MyType).property

// Type guard
if ('property' in obj) {
  obj.property
}
```

## Future Enhancements

1. **Enable `noUncheckedIndexedAccess`** when codebase is ready
2. **Enable `exactOptionalPropertyTypes`** for stricter optional handling
3. **Add custom type declaration files** for untyped modules
4. **Implement project references** for monorepo structure

## Current Status

After enabling strict TypeScript mode, the compiler found 56 errors in 9 files. These errors indicate areas where the code needs improvement for better type safety. The main categories of errors are:

1. **Custom props on UI components** (e.g., `resetDisabled`, `disableBorder`)
2. **Missing variant types** (e.g., `outline-destructive`, `primary`)
3. **Type mismatches in react-hook-form**
4. **Missing properties on chart components**
5. **Implicit any types**

## Migration Strategy

To gradually fix these errors:

1. **Start with critical errors**: Fix type mismatches that could cause runtime errors
2. **Update component interfaces**: Add missing props to component type definitions
3. **Add missing variants**: Update variant types in UI components
4. **Fix implicit any**: Add proper types where TypeScript infers `any`
5. **Test thoroughly**: Ensure fixes don't break existing functionality

Consider temporarily relaxing some strict checks if needed:
```json
"noImplicitAny": false,  // Allow implicit any during migration
"strictNullChecks": false,  // Allow null/undefined during migration
```

## Resources

- [Next.js TypeScript Documentation](https://nextjs.org/docs/app/api-reference/config/typescript)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Config Reference](https://www.typescriptlang.org/tsconfig)
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)