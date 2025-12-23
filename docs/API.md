# ISO Archive API Specification

**Version**: 1.0.0  
**Base URL**: `/api/v1`

## Overview

The ISO Archive API provides a community-driven platform for cataloging, curating, and distributing operating system installation media.

### Interactive Documentation

- **Scalar UI**: `/docs`
- **OpenAPI Spec**: `/openapi.json`

---

## Architecture

### Domain Structure

```
/api/v1/
├── catalog/      # Public discovery (cached)
├── library/      # ISO/distro details (cached)
├── curation/     # Community workflows (auth required)
├── downloads/    # File delivery
├── uploads/      # Direct-to-Drive uploads
└── admin/        # Operations (admin only)
```

### Authentication

| Method | Use Case |
|--------|----------|
| Session (Cookie) | Web interface |
| API Key (`X-API-Key`) | Programmatic access |
| OAuth (Discord/GitHub) | Community users |

### Rate Limits

| User Type | Limit |
|-----------|-------|
| Anonymous | 100/min |
| Authenticated | 1000/min |
| Curator | 5000/min |

---

## Catalog Domain

Public discovery endpoints with aggressive caching.

### Search ISOs

```http
GET /catalog/search
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Full-text search query |
| `distro` | string | Filter by distro slug |
| `family` | string | Filter by family slug (debian, arch, rhel) |
| `os_type` | string | Filter by OS type (linux, bsd, unix, vintage, other) |
| `arch` | string | Filter by architecture (amd64, arm64, i386) |
| `edition` | string | Filter by edition (desktop, server, cloud) |
| `spin` | string | Filter by DE/WM (gnome, kde, xfce) |
| `iso_type` | string | Filter by ISO type (live, installer, minimal, netinst) |
| `release_stage` | string | Filter by stage (stable, lts, beta, rc, snapshot) |
| `hardware_target` | string | Filter by hardware (nvidia, steam-deck, surface) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 50, max: 100) |

**Response:**
```json
{
  "results": [
    {
      "id": 123,
      "distro": {
        "slug": "ubuntu",
        "name": "Ubuntu",
        "os_type": "linux",
        "family": { "slug": "debian", "name": "Debian" }
      },
      "version": "22.04",
      "arch": "amd64",
      "edition": "desktop",
      "spin": "gnome",
      "iso_type": "live",
      "release_stage": "lts",
      "language": "en",
      "filename": "ubuntu-22.04-amd64-desktop-gnome-live-20220421-en.iso",
      "size": 3774873600,
      "status": "verified"
    }
  ],
  "total": 1523,
  "page": 1,
  "limit": 50
}
```

### List Distributions

```http
GET /catalog/distributions
```

**Response:**
```json
[
  {
    "id": 1,
    "slug": "ubuntu",
    "name": "Ubuntu",
    "os_type": "linux",
    "family": { "slug": "debian", "name": "Debian" },
    "parent": null,
    "iso_count": 45
  },
  {
    "id": 2,
    "slug": "kubuntu",
    "name": "Kubuntu",
    "os_type": "linux",
    "family": { "slug": "debian", "name": "Debian" },
    "parent": { "slug": "ubuntu", "name": "Ubuntu" },
    "iso_count": 12
  }
]
```

### List Families

```http
GET /catalog/families
```

**Response:**
```json
[
  {
    "id": 1,
    "slug": "debian",
    "name": "Debian",
    "description": "APT/dpkg-based, .deb packages",
    "distro_count": 156
  },
  {
    "id": 2,
    "slug": "arch",
    "name": "Arch Linux",
    "description": "Pacman-based, rolling release",
    "distro_count": 42
  }
]
```

---

## Library Domain

Detailed ISO and distribution information.

### Get ISO Details

```http
GET /library/isos/{id}
```

**Response:**
```json
{
  "id": 123,
  "distro": {
    "id": 1,
    "slug": "ubuntu",
    "name": "Ubuntu",
    "os_type": "linux",
    "family": { "slug": "debian", "name": "Debian" },
    "website": "https://ubuntu.com"
  },
  "version": "22.04",
  "arch": "amd64",
  "edition": "desktop",
  "spin": "gnome",
  "iso_type": "live",
  "release_stage": "lts",
  "release_date": "2022-04-21",
  "wrapper": "glibc",
  "hardware_target": null,
  "kernel_version": "5.15",
  "language": "en",
  "filename": "ubuntu-22.04-amd64-desktop-gnome-live-20220421-en.iso",
  "drive_id": "abc123",
  "size": 3774873600,
  "checksum_md5": "...",
  "checksum_sha1": "...",
  "checksum_sha256": "...",
  "status": "verified",
  "confidence_score": 95,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Get ISO Fingerprint

```http
GET /library/isos/{id}/fingerprint
```

**Response:**
```json
{
  "md5": "d41d8cd98f00b204e9800998ecf8427e",
  "sha1": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### Get Distribution Details

```http
GET /library/distros/{slug}
```

**Response:**
```json
{
  "id": 1,
  "slug": "ubuntu",
  "name": "Ubuntu",
  "os_type": "linux",
  "family": {
    "id": 1,
    "slug": "debian",
    "name": "Debian"
  },
  "parent": null,
  "children": [
    { "slug": "kubuntu", "name": "Kubuntu" },
    { "slug": "xubuntu", "name": "Xubuntu" },
    { "slug": "edubuntu", "name": "Edubuntu" }
  ],
  "description": "Ubuntu is a Linux distribution...",
  "website": "https://ubuntu.com",
  "logo_url": "https://...",
  "iso_count": 45
}
```

---

## Curation Domain

Community-driven edit workflows with voting.

### Submit Edit

```http
POST /curation/edits
```

**Request:**
```json
{
  "target_type": "iso",
  "target_id": 123,
  "edit_type": "update",
  "data": {
    "version": "22.04.1",
    "release_date": "2022-08-11"
  },
  "comment": "Updated to point release version"
}
```

**Notes:**
- `target_type`: `iso`, `distro`, or `family`
- `edit_type`: `create`, `update`, `merge`, `delete`

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### List Edits

```http
GET /curation/edits
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | pending, approved, rejected, applied |
| `page` | number | Page number |
| `limit` | number | Results per page |

### Get Edit Details

```http
GET /curation/edits/{id}
```

### Vote on Edit

```http
POST /curation/edits/{id}/votes
```

**Request:**
```json
{
  "vote": "yes"
}
```

**Response:**
```json
{
  "yes": 3,
  "no": 0
}
```

### Voting Rules

| Edit Type | Auto-Approve | Auto-Reject | Min Period |
|-----------|--------------|-------------|------------|
| Non-destructive (create, update) | 3 unanimous YES | 3 unanimous NO | — |
| Destructive (merge, delete) | 5 unanimous YES | 3 unanimous NO | 7 days |

### Add Comment

```http
POST /curation/edits/{id}/comments
```

**Request:**
```json
{
  "text": "Verified against official release notes"
}
```

### List Comments

```http
GET /curation/edits/{id}/comments
```

### Get User Reputation

```http
GET /curation/users/{userId}/reputation
```

**Response:**
```json
{
  "reputation": 150,
  "rank": "curator",
  "edits_submitted": 42,
  "edits_approved": 38
}
```

### Reputation Ranks

| Rank | Threshold | Permissions |
|------|-----------|-------------|
| `viewer` | 0 | Browse, download |
| `contributor` | 1+ edit | Submit edits |
| `curator` | 10 approved | Vote on edits |
| `trusted` | 50 approved | Auto-approve simple edits |

---

## Downloads Domain

File delivery with tracking.

### Get Direct Download Link

```http
GET /downloads/direct/{id}
```

**Response:**
```json
{
  "url": "https://drive.google.com/uc?id=...",
  "filename": "ubuntu-22.04-amd64-desktop-gnome-live-20220421-en.iso",
  "expires_at": "2024-01-15T11:30:00Z"
}
```

### Get Magnet Link

```http
GET /downloads/magnet/{id}
```

**Response:**
```json
{
  "magnet": "magnet:?xt=urn:btih:..."
}
```

### Get Torrent File

```http
GET /downloads/torrent/{id}
```

Returns `.torrent` file with `Content-Type: application/x-bittorrent`

---

## Uploads Domain

Direct-to-Google-Drive uploads with quota enforcement.

### Initiate Upload

```http
POST /uploads/initiate
```

**Request:**
```json
{
  "filename": "custom-distro-1.0-amd64-live.iso",
  "size": 2147483648
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "upload_uri": "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&...",
  "expires_at": "2024-01-16T10:30:00Z"
}
```

### Get Upload Status

```http
GET /uploads/{sessionId}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "initiated",
  "filename": "custom-distro-1.0-amd64-live.iso",
  "size": 2147483648,
  "drive_file_id": null,
  "completed_at": null
}
```

### Complete Upload

```http
POST /uploads/{sessionId}/complete
```

**Request:**
```json
{
  "drive_file_id": "1abc123..."
}
```

### Get Quota

```http
GET /uploads/quota
```

**Response:**
```json
{
  "used_bytes": 5368709120,
  "limit_bytes": 805306368000,
  "remaining_bytes": 799937658880
}
```

**Note:** 750GB daily upload limit per user.

---

## Admin Domain

Administrative operations (requires admin role).

### Trigger Sync

```http
POST /admin/sync
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

### Get Analytics Overview

```http
GET /admin/analytics/overview
```

**Response:**
```json
{
  "total_isos": 5234,
  "total_distros": 342,
  "total_downloads": 152300,
  "pending_edits": 23
}
```

---

## Notifications

```http
GET  /notifications
POST /notifications/{id}/read
POST /notifications/read-all
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "404",
    "message": "ISO not found"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `400` | 400 | Bad request / validation error |
| `401` | 401 | Authentication required |
| `403` | 403 | Insufficient permissions |
| `404` | 404 | Resource not found |
| `409` | 409 | Conflict / duplicate |
| `429` | 429 | Rate limit exceeded |
| `500` | 500 | Internal server error |

---

## Pagination

All list endpoints support:

| Parameter | Default | Max |
|-----------|---------|-----|
| `page` | 1 | — |
| `limit` | 20 | 100 |

Response includes:
```json
{
  "items": [...],
  "total": 1523,
  "page": 1,
  "limit": 20
}
```

---

## Caching

| Endpoint Pattern | Cache-Control |
|------------------|---------------|
| `catalog/*` | `public, max-age=300` (5 min) |
| `library/*` | `public, max-age=1800` (30 min) |
| `curation/*` | `private, no-cache` |
| `downloads/*` | `private, max-age=60` (1 min) |
| `uploads/*` | `private, no-cache` |

---

## Field Reference

See [SPEC.md](./SPEC.md) for complete field definitions, canonical values, and database schema.

### Key Enums

**os_type:** `linux`, `bsd`, `unix`, `vintage`, `other`, `mobile`, `windows`

**release_stage:** `stable`, `lts`, `beta`, `alpha`, `rc`, `snapshot`, `nightly`

**iso_type:** `live`, `installer`, `minimal`, `netinst`, `full`, `server`, `rescue`, `cloud`

**iso_status:** `pending`, `staging`, `verified`, `flagged`, `archived`

**edit_type:** `create`, `update`, `merge`, `delete`

**edit_status:** `pending`, `approved`, `rejected`, `applied`

**vote_type:** `yes`, `no`, `abstain`

---

## Implementation Status

| Domain | Endpoint | Status |
|--------|----------|--------|
| Catalog | `GET /catalog/search` | ✅ |
| Catalog | `GET /catalog/distributions` | ✅ |
| Catalog | `GET /catalog/families` | ✅ |
| Library | `GET /library/isos/{id}` | ✅ |
| Library | `GET /library/isos/{id}/fingerprint` | ✅ |
| Library | `GET /library/distros/{slug}` | ✅ |
| Curation | `POST /curation/edits` | ✅ |
| Curation | `GET /curation/edits` | ✅ |
| Curation | `GET /curation/edits/{id}` | ✅ |
| Curation | `POST /curation/edits/{id}/votes` | ✅ |
| Curation | `POST /curation/edits/{id}/comments` | ✅ |
| Curation | `GET /curation/edits/{id}/comments` | ✅ |
| Curation | `GET /curation/users/{id}/reputation` | ✅ |
| Downloads | `GET /downloads/direct/{id}` | ✅ |
| Downloads | `GET /downloads/magnet/{id}` | ✅ |
| Downloads | `GET /downloads/torrent/{id}` | 🟡 |
| Uploads | `POST /uploads/initiate` | ✅ |
| Uploads | `GET /uploads/{id}` | ✅ |
| Uploads | `POST /uploads/{id}/complete` | ✅ |
| Uploads | `GET /uploads/quota` | ✅ |
| Admin | `POST /admin/sync` | ✅ |
| Admin | `GET /admin/analytics/overview` | ✅ |
| Notifications | `GET /notifications` | ✅ |
| Notifications | `POST /notifications/{id}/read` | ✅ |
| Notifications | `POST /notifications/read-all` | ✅ |

**Legend:** ✅ Implemented | 🟡 Partial
