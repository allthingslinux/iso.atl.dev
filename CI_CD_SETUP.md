# CI/CD Setup Documentation

This document describes the comprehensive CI/CD pipeline, linting, and code quality tools configured for this Next.js project.

## Table of Contents

- [Overview](#overview)
- [Local Development Setup](#local-development-setup)
- [Git Hooks (Husky)](#git-hooks-husky)
- [Code Formatting (Prettier)](#code-formatting-prettier)
- [Linting (ESLint)](#linting-eslint)
- [Type Checking (TypeScript)](#type-checking-typescript)
- [Commit Standards (Commitlint)](#commit-standards-commitlint)
- [GitHub Actions Workflows](#github-actions-workflows)
- [VS Code Integration](#vs-code-integration)

## Overview

Our CI/CD pipeline ensures code quality through:

- **Pre-commit hooks**: Lint and format code before commits
- **Commit message validation**: Enforce conventional commit standards
- **Pre-push validation**: Run full validation before pushing
- **Automated CI**: Run tests, linting, and builds on every PR
- **Security scanning**: Automated vulnerability detection
- **Code quality analysis**: CodeQL and dependency reviews

## Local Development Setup

### Initial Setup

After cloning the repository:

```bash
# Install dependencies (this also sets up Husky)
npm install

# Verify setup
npm run validate
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:turbo    # Start with Turbopack

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check Prettier formatting
npm run type-check   # TypeScript type checking
npm run validate     # Run all checks (type-check + lint + format)

# Building
npm run build        # Production build
npm run start        # Start production server
```

## Git Hooks (Husky)

### Pre-commit Hook

Runs automatically before each commit:

1. **lint-staged**: Runs on staged files only
   - ESLint with auto-fix
   - Prettier formatting

> **Note**: TypeScript type checking is disabled in pre-commit hooks until existing type errors are resolved. Run `npm run type-check` manually or rely on CI/CD pipeline for type validation.

### Commit-msg Hook

Validates commit messages against conventional commit standards.

### Pre-push Hook

Runs full validation (`npm run validate`) before pushing to remote.

### Manual Hook Execution

```bash
# Run pre-commit checks manually
npm run pre-commit

# Skip hooks (use sparingly!)
git commit --no-verify -m "message"
```

## Code Formatting (Prettier)

### Configuration

`.prettierrc` defines our formatting rules:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true,
  "endOfLine": "lf"
}
```

### Import Sorting

Prettier is configured with `@trivago/prettier-plugin-sort-imports` to automatically sort imports in this order:

1. React imports
2. Next.js imports
3. Third-party modules
4. Type imports
5. Library imports (`@/lib/*`)
6. Hook imports (`@/hooks/*`)
7. Component imports (`@/components/*`)
8. App imports (`@/app/*`)
9. Relative imports

### Usage

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check

# Format specific files
npx prettier --write "src/**/*.{ts,tsx}"
```

## Linting (ESLint)

### Configuration

ESLint uses the new flat config format (`eslint.config.mjs`) with:

- Next.js recommended rules
- TypeScript strict rules
- React hooks rules
- Import order rules
- Accessibility rules

### Usage

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint:fix

# Lint specific files
npx eslint src/components/**/*.tsx
```

## Type Checking (TypeScript)

### Strict Configuration

TypeScript is configured with strict mode enabled for maximum type safety.

### Usage

```bash
# Type check
npm run type-check

# Watch mode
npm run type-check:watch
```

## Commit Standards (Commitlint)

### Conventional Commits

All commits must follow the conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Allowed Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or corrections
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes (maintenance)
- `revert`: Reverting previous commits

### Examples

```bash
# Good commits
git commit -m "feat: add user authentication"
git commit -m "fix: resolve navigation bug on mobile"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor: simplify API client logic"

# Bad commits (will be rejected)
git commit -m "Update code"  # No type
git commit -m "FEAT: Add feature"  # Wrong case
git commit -m "feat: This subject is way too long and will be rejected by commitlint"  # Too long
```

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:

1. **Lint Job**
   - Runs ESLint
   - Checks Prettier formatting

2. **Type Check Job**
   - Runs TypeScript compiler

3. **Build Job**
   - Builds the Next.js application
   - Uploads build artifacts

4. **Test Job**
   - Placeholder for unit/integration tests
   - Ready for test implementation

5. **Security Job**
   - Runs npm audit
   - Snyk vulnerability scanning (requires `SNYK_TOKEN` secret)

6. **Lighthouse Job**
   - Performance testing
   - Accessibility checks
   - SEO validation

### Dependency Review (`.github/workflows/dependency-review.yml`)

Runs on pull requests:
- Reviews dependency changes
- Blocks PRs with vulnerable dependencies

### CodeQL Analysis (`.github/workflows/codeql.yml`)

Runs on:
- Push to main/develop
- Pull requests
- Weekly schedule

Performs:
- Static code analysis
- Security vulnerability detection
- Code quality checks

## VS Code Integration

### Settings (`.vscode/settings.json`)

Automatic configuration for:
- Format on save with Prettier
- ESLint auto-fix on save
- TypeScript workspace version
- TailwindCSS IntelliSense

### Recommended Extensions (`.vscode/extensions.json`)

Essential extensions:
- ESLint
- Prettier
- TailwindCSS IntelliSense
- GitLens
- Error Lens
- Pretty TypeScript Errors

### Usage

1. Install recommended extensions when prompted
2. Code will automatically format on save
3. ESLint errors appear inline
4. Git blame information available inline

## Troubleshooting

### Common Issues

#### Husky hooks not running

```bash
# Reinstall Husky
npm run prepare
```

#### ESLint/Prettier conflicts

```bash
# Ensure Prettier runs last
npm run lint:fix && npm run format
```

#### TypeScript errors in CI but not locally

```bash
# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo
npm run type-check
```

### Bypassing Checks (Emergency Only!)

```bash
# Skip pre-commit hooks
git commit --no-verify -m "emergency: fix critical bug"

# Skip pre-push validation
git push --no-verify
```

⚠️ **Warning**: Only bypass checks in genuine emergencies. Always create a follow-up task to fix any issues.

## Best Practices

1. **Run validation before pushing**
   ```bash
   npm run validate
   ```

2. **Fix issues immediately**
   - Don't commit with ESLint errors
   - Keep TypeScript errors at zero
   - Maintain consistent formatting

3. **Write meaningful commits**
   - Use conventional commit format
   - Be descriptive but concise
   - Reference issue numbers when applicable

4. **Keep dependencies updated**
   - Review dependency updates weekly
   - Test thoroughly after updates
   - Check for security advisories

5. **Monitor CI status**
   - Fix failing builds immediately
   - Review security alerts
   - Address performance regressions

## Future Enhancements

- [ ] Add unit testing with Jest
- [ ] Add E2E testing with Playwright
- [ ] Implement code coverage requirements
- [ ] Add bundle size monitoring
- [ ] Set up automated dependency updates
- [ ] Implement semantic versioning automation

---

For questions or issues with the CI/CD setup, please create an issue in the repository.