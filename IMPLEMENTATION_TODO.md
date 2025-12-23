# Implementation TODO

Based on SPEC.md and API.md specifications.

---

## Completed ✅

### API Structure
- [x] Created v1 route structure: catalog, library, curation, downloads, uploads, admin
- [x] Created service classes: CatalogService, LibraryService, CurationService, DownloadService, DriveService
- [x] Created validators in `packages/validators/src/v1.ts`
- [x] Standardized error handling in `apps/api/src/lib/errors.ts`
- [x] Google Drive service with JWT auth and resumable uploads
- [x] Curation workflow with edits, votes, comments, auto-approval

### Documentation
- [x] SPEC.md - Complete schema specification
- [x] API.md - API documentation aligned with SPEC.md
- [x] GOOGLE_DRIVE_UPLOAD.md - Upload flow documentation

**Note:** Routes and services use the OLD schema. Phase 1 (Schema Migration) must complete before updating them.

---

## Phase 1: Schema Migration ✅ COMPLETE

### New Tables

- [x] Create `families` table
- [x] Create seed script with initial data
- [x] Seed 11 families to database

### Update `distros` Table

- [x] Add `os_type` enum and column (required)
- [x] Add `family_id` foreign key to `families`
- [x] Add `parent_id` self-reference for flavors
- [x] Add `logo_url` column
- [x] Removed old `family` VARCHAR column

### Update `isos` Table

- [x] Add new enums: `os_type`, `release_stage`, `iso_type`
- [x] Add columns: `edition`, `spin`, `iso_type`, `release_stage`, `wrapper`, `hardware_target`, `language`, `kernel_version`, `release_date`
- [x] Remove `category` column
- [x] Add new indexes

### Generate Migration

- [x] Run `pnpm db:generate` - created `0000_big_pepper_potts.sql`
- [x] Run `pnpm db:push` - schema applied to database

---

## Phase 2: API Updates ✅ COMPLETE

### Catalog Domain

- [x] Implement `GET /catalog/families` endpoint
- [x] Update `GET /catalog/search` with new filter params
- [x] Update `GET /catalog/distributions` response to include `os_type`, `family`, `parent`

### Library Domain

- [x] Implement `GET /library/distros/{slug}` endpoint
- [x] Update `GET /library/isos/{id}` response with all new fields

### Update Services

- [x] Update `CatalogService.search()` with new filters
- [x] Update `CatalogService.getDistributions()` to join families
- [x] Add `CatalogService.getFamilies()`
- [x] Add `LibraryService.getDistro(slug)`
- [x] Update `LibraryService.getIso()` to return all new fields

### Update Validators

- [x] Add new filter schemas for search endpoint
- [x] Add `os_type`, `release_stage`, `iso_type` enum schemas
- [x] Update response schemas

---

## Phase 3: Data Migration ✅ COMPLETE

### Filename Parser

- [x] Update `parseFilename()` to extract new fields
- [x] Handle various filename formats
- [x] Set `confidence_score` based on parsing success

### Existing Data

- [ ] Parse existing ISO filenames to populate new columns
- [ ] Map existing distros to families
- [ ] Identify parent/child distro relationships
- [ ] Set `os_type` for all distros

---

## Phase 4: Missing Endpoints ✅ MOSTLY COMPLETE

### Notifications ✅

- [x] `GET /notifications` - list user notifications
- [x] `POST /notifications/{id}/read` - mark as read
- [x] `POST /notifications/read-all` - mark all as read
- [x] Add `NotificationService`

### Torrent Generation (Deferred)

- [ ] Implement actual `.torrent` file generation
- [ ] Add WebSeeds pointing to Google Drive
- [ ] Calculate info hash for magnet links

### Drafts (Deferred)

Drafts feature deferred to future iteration. Not in current API.md scope.

---

## Phase 5: Frontend Updates ✅ COMPLETE

### Search Page

- [x] Add filter buttons for families
- [x] Update search results display with new fields
- [x] Show edition, spin, isoType badges
- [x] Link results to ISO detail page

### Detail Pages

- [x] ISO detail page (`/iso/[id]`) - all metadata, checksums, download buttons
- [x] Distro detail page (`/distro/[slug]`) - family, parent/children, ISOs list

### API Client

- [x] Update to use /api/v1 base path
- [x] Add hooks for families, distributions, search
- [x] Add curation hooks (reputation, pending, update)
- [x] Add typed hooks for ISO and Distro details

---

## Torrent Generation ✅ COMPLETE

- [x] Implement bencode encoding
- [x] Generate `.torrent` files with WebSeed URLs
- [x] Add public tracker announce URLs
- [x] `GET /downloads/torrent/:id` endpoint

---

## Schema Reference

See SPEC.md for complete details.

### New Enums

```typescript
osTypeEnum: ["linux", "bsd", "unix", "vintage", "other", "mobile", "windows"]
releaseStageEnum: ["stable", "lts", "beta", "alpha", "rc", "snapshot", "nightly"]
isoTypeEnum: ["live", "installer", "minimal", "netinst", "full", "server", "rescue", "cloud"]
```

### Families Table

```typescript
families = pgTable("families", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Updated Distros Table

```typescript
distros = pgTable("distros", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  osType: osTypeEnum("os_type").notNull(),
  familyId: integer("family_id").references(() => families.id),
  parentId: integer("parent_id").references(() => distros.id),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  logoUrl: varchar("logo_url", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Updated ISOs Table (new columns only)

```typescript
// Add to existing isos table:
edition: varchar("edition", { length: 50 }),
spin: varchar("spin", { length: 50 }),
isoType: isoTypeEnum("iso_type"),
releaseStage: releaseStageEnum("release_stage").default("stable"),
wrapper: varchar("wrapper", { length: 50 }),
hardwareTarget: varchar("hardware_target", { length: 50 }),
language: varchar("language", { length: 10 }).default("en"),
kernelVersion: varchar("kernel_version", { length: 50 }),
releaseDate: date("release_date"),

// Remove:
// category: varchar("category", { length: 50 }),
```

---

## Files to Modify

### Database (Phase 1)

- `packages/db/src/schema.ts` - Add tables, enums, columns

### API Routes (Phase 2)

- `apps/api/src/routes/v1/catalog/index.ts` - Add families, update search
- `apps/api/src/routes/v1/library/index.ts` - Add distros endpoint

### Services (Phase 2)

- `apps/api/src/services/catalog.ts` - Update queries
- `apps/api/src/services/library.ts` - Add getDistro

### Validators (Phase 2)

- `packages/validators/src/v1.ts` - Add new schemas

---

## API Implementation Status

| Domain | Endpoint | Status |
|--------|----------|--------|
| Catalog | `GET /catalog/search` | ✅ |
| Catalog | `GET /catalog/distributions` | ✅ |
| Catalog | `GET /catalog/families` | ✅ |
| Library | `GET /library/isos/{id}` | ✅ |
| Library | `GET /library/isos/{id}/fingerprint` | ✅ |
| Library | `GET /library/distros/{slug}` | ✅ |
| Curation | All endpoints | ✅ |
| Downloads | `GET /downloads/direct/{id}` | ✅ |
| Downloads | `GET /downloads/magnet/{id}` | ✅ |
| Downloads | `GET /downloads/torrent/{id}` | 🟡 |
| Uploads | All endpoints | ✅ |
| Notifications | All endpoints | ✅ |
| Admin | All endpoints | ✅ |

**Legend:** ✅ Implemented | 🟡 Partial/Deferred

---

## Testing Checklist

- [ ] Schema migration runs without errors
- [ ] All existing data preserved
- [ ] New endpoints return correct data
- [ ] Search filters work correctly
- [ ] Family/distro hierarchy displays correctly
- [ ] Filename parser extracts new fields
- [ ] TypeScript compiles without errors
- [ ] Lint passes
