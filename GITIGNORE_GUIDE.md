# Git Ignore Files Guide

This guide explains the comprehensive ignore file structure for the Next.js project.

## Overview

We've implemented a coordinated ignore strategy across multiple tools:

1. **`.gitignore`** - Files not tracked by Git
2. **`.prettierignore`** - Files not formatted by Prettier
3. **`.eslintignore`** - Files not linted by ESLint (deprecated, now in eslint.config.mjs)
4. **`eslint.config.mjs`** - Contains ESLint ignore patterns
5. **`.env.example`** - Template for environment variables

## File Structure

### `.gitignore` - Comprehensive Git Ignore

Organized into clear sections:

- **Dependencies**: `node_modules/`, package manager files
- **Build Outputs & Caches**: `.next/`, `out/`, `build/`, `dist/`
- **Environment Variables**: All `.env` files except `.env.example`
- **Logs & Debug Files**: All log files and diagnostic reports
- **Testing & Coverage**: Test results and coverage reports
- **OS Generated Files**: OS-specific files (macOS, Windows, Linux)
- **Editor & IDE Files**: VS Code, IntelliJ, Sublime, Vim, Emacs
- **Package Managers**: npm, Yarn, pnpm specific files
- **Security & Certificates**: SSL certificates and keys
- **Temporary Files**: Temp directories and backup files
- **Miscellaneous**: Cache files, serverless, build analysis
- **Project Specific**: Legacy code, private docs, data files

### Key Features

#### Preserved VS Code Settings
```gitignore
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
!.vscode/tasks.json
```
This keeps shared VS Code configurations while ignoring personal settings.

#### Hidden Directory Handling
```gitignore
# Hidden directories (except specific ones)
/.*
!/.github
!/.husky
!/.vscode
!/.cursor
!/.env.example
```
Ignores all hidden directories except those needed for the project.

### `.prettierignore` - Formatting Exclusions

Excludes files that shouldn't be formatted:
- Dependencies and lock files
- Build outputs
- Generated files
- Documentation (Markdown files)
- Data files (CSV, SQL, databases)
- TypeScript declaration files

### `.eslintignore` & ESLint Config

The `.eslintignore` file exists for compatibility, but the actual ignore patterns are in `eslint.config.mjs` using the new flat config format. This includes:
- All patterns from `.gitignore`
- Configuration files
- Generated JavaScript/CSS files
- Package lock files

### `.env.example` - Environment Template

Provides a comprehensive template showing:
- Required environment variables
- Optional configurations
- Service integrations
- Feature flags
- Development tools

## Best Practices

### 1. Consistency Across Tools
All ignore files follow similar patterns to ensure consistent behavior across Git, Prettier, and ESLint.

### 2. Clear Organization
Files are grouped by category with clear section headers for easy maintenance.

### 3. Explicit Exceptions
Uses `!` patterns to explicitly include important files that would otherwise be ignored:
```gitignore
/.* # Ignore all hidden directories
!/.github # But keep GitHub workflows
!/.husky # And Git hooks
```

### 4. Pattern Specificity
- Use `**/` for recursive matching
- Use `/` prefix for root-level only
- Use specific file extensions when possible

### 5. Security First
Always ignore:
- Environment files (`.env*`)
- Certificates and keys (`*.pem`, `*.key`)
- Credentials and secrets

## Common Patterns

### Recursive vs Root-Only
```gitignore
# Matches foo anywhere in the tree
**/foo

# Matches foo only in root
/foo

# Matches all .log files anywhere
**/*.log

# Matches .log files only in root
/*.log
```

### Negation Patterns
```gitignore
# Ignore all .env files
.env*

# But keep the example
!.env.example
```

### Directory vs File
```gitignore
# Directory (with trailing slash)
build/

# File or directory (no trailing slash)
build

# All files in directory
build/*

# Directory and all contents
build/**
```

## Maintenance

### Adding New Patterns
1. Add to appropriate section in `.gitignore`
2. Consider if it should also be in `.prettierignore`
3. Update ESLint config if needed
4. Document in this guide if it's a project-specific pattern

### Testing Ignore Patterns
```bash
# Check if a file is ignored by Git
git check-ignore -v path/to/file

# List all ignored files
git ls-files --ignored --exclude-standard

# Check Prettier ignore
npx prettier --check path/to/file

# Check ESLint ignore
npx eslint path/to/file
```

### Common Issues

#### File Still Tracked After Adding to .gitignore
```bash
# Remove from Git cache
git rm --cached path/to/file

# For directories
git rm -r --cached path/to/directory
```

#### VS Code Still Showing Ignored Files
1. Reload VS Code window
2. Check VS Code's file exclude settings
3. Clear VS Code cache

## Project-Specific Patterns

### Legacy Code
```gitignore
/src/pages/api/legacy/
/**/*/_legacy/
/src/_app
/src/_page
/src/utils/_legacy
/src/components/_legacy
```
These patterns exclude old code that's being phased out.

### Data Files
```gitignore
/data
```
Excludes data directories that might contain sensitive or large files.

### Build Analysis
```gitignore
.next/analyze/
bundle-analyzer/
```
Excludes build analysis outputs that are generated during optimization.

---

This comprehensive ignore strategy ensures clean repositories, consistent tooling behavior, and protection of sensitive files.