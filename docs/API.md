# ISO Archive API Specification

**Version**: 1.0.0  
**Base URL**: `http://localhost:8787/api/v1` (development)

## Overview

The ISO Archive API provides a community-driven platform for cataloging, curating, and distributing operating system installation media. This specification defines the target architecture based on domain-driven design principles and proven patterns from similar platforms (StashDB).

### Interactive Documentation

- **[Scalar UI](http://localhost:8787/docs)** - Interactive API explorer
- **[OpenAPI Spec](http://localhost:8787/openapi.json)** - OpenAPI 3.1 specification

---

## Architecture

### Domain Structure

```
/api/v1/
├── catalog/          # Public Discovery (Cached)
├── library/          # ISO Details (Cached)
├── curation/         # Community Workflows (Auth Required)
├── downloads/        # File Delivery (CDN)
└── admin/            # Operations (Admin Only)
```

### Authentication

| Method | Use Case |
|--------|----------|
| Session (Cookie) | Web interface |
| API Key (`X-API-Key` header) | Programmatic access |
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
GET /api/v1/catalog/search
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Full-text search query |
| `distribution` | string[] | Filter by distro slug |
| `arch` | string[] | Filter by architecture |
| `category` | string[] | desktop, server, minimal, live |
| `sort` | string | relevance, date, downloads, name |
| `order` | string | asc, desc |
| `page` | number | Page number (1-based) |
| `limit` | number | Results per page (max 100) |

**Response:**
```json
{
  "results": [
    {
      "id": "123",
      "distribution": { "name": "Ubuntu", "slug": "ubuntu" },
      "version": "22.04",
      "arch": "x86_64",
      "filename": "ubuntu-22.04-desktop-amd64.iso",
      "size": 3774873600,
      "status": "verified",
      "confidence": 95
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1523,
    "pages": 77
  },
  "facets": {
    "distributions": [{ "value": "ubuntu", "count": 45 }],
    "architectures": [{ "value": "x86_64", "count": 1200 }]
  }
}
```

### Browse Directory

```http
GET /api/v1/catalog/browse
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Directory path (e.g., "/Linux/Ubuntu") |
| `sort` | string | name, date, size |

### List Distributions

```http
GET /api/v1/catalog/distributions
```

### List Collections

```http
GET /api/v1/catalog/collections
```

---

## Library Domain

Detailed ISO information and relationships.

### Get ISO Details

```http
GET /api/v1/library/isos/{id}
```

**Response:**
```json
{
  "id": "123",
  "metadata": {
    "distribution": {
      "name": "Ubuntu",
      "slug": "ubuntu",
      "family": "linux",
      "website": "https://ubuntu.com"
    },
    "release": {
      "version": "22.04",
      "codename": "Jammy Jellyfish",
      "releaseDate": "2022-04-21",
      "supportStatus": "lts",
      "supportUntil": "2027-04-21"
    },
    "technical": {
      "architecture": "x86_64",
      "category": "desktop",
      "desktopEnvironment": ["gnome"],
      "kernelVersion": "5.15",
      "initSystem": "systemd"
    },
    "file": {
      "filename": "ubuntu-22.04-desktop-amd64.iso",
      "size": 3774873600,
      "checksums": {
        "sha256": "abc123..."
      }
    }
  },
  "curation": {
    "status": "verified",
    "confidence": 95,
    "verifiedBy": "user123",
    "verifiedAt": "2024-01-15T10:30:00Z"
  },
  "statistics": {
    "downloads": 1523
  }
}
```

### Search by Fingerprint

```http
POST /api/v1/library/fingerprints/search
```

**Request:**
```json
{
  "fingerprints": [
    { "algorithm": "sha256", "value": "abc123..." }
  ]
}
```

---

## Curation Domain

Community-driven edit workflows with voting.

### Submit Edit

```http
POST /api/v1/curation/edits
```

**Request:**
```json
{
  "type": "update",
  "targetType": "iso",
  "targetId": "123",
  "changes": {
    "metadata.release.version": "22.04.1"
  },
  "evidence": {
    "references": ["https://releases.ubuntu.com/22.04.1/"]
  },
  "comment": "Updated to point release version"
}
```

### Get Pending Edits

```http
GET /api/v1/curation/edits?status=pending
```

### Vote on Edit

```http
POST /api/v1/curation/edits/{id}/votes
```

**Request:**
```json
{
  "vote": "yes",
  "comment": "Verified against official release notes"
}
```

### Voting Rules

| Edit Type | Auto-Approve | Auto-Reject | Min Period | Tie Result |
|-----------|--------------|-------------|------------|------------|
| Non-destructive | 3 unanimous YES | 3 unanimous NO | 3 days | Approve |
| Destructive (merge/delete) | 5 unanimous YES | 3 unanimous NO | 7 days | Reject |

### Add Comment

```http
POST /api/v1/curation/edits/{id}/comments
```

### Draft System

```http
POST   /api/v1/curation/drafts
GET    /api/v1/curation/drafts
PUT    /api/v1/curation/drafts/{id}
POST   /api/v1/curation/drafts/{id}/submit
DELETE /api/v1/curation/drafts/{id}
```

### User Reputation

```http
GET /api/v1/curation/users/{userId}/reputation
```

**Response:**
```json
{
  "score": 150,
  "rank": "Curator",
  "contributions": {
    "editsSubmitted": 42,
    "editsApproved": 38,
    "editsRejected": 4,
    "votesCast": 156,
    "accuracy": 90.5
  }
}
```

### Reputation Thresholds

| Rank | Score | Permissions |
|------|-------|-------------|
| Viewer | 0 | Browse, download |
| Contributor | 1+ | Submit edits |
| Curator | 100+ (10 approved) | Vote on edits |
| Trusted | 500+ (50 approved) | Auto-approve simple edits |

---

## Downloads Domain

File delivery with tracking.

### Get Download Link

```http
GET /api/v1/downloads/direct/{id}
```

**Response:**
```json
{
  "url": "https://storage.example.com/...",
  "filename": "ubuntu-22.04-desktop-amd64.iso",
  "size": 3774873600,
  "expiresAt": "2024-01-15T11:30:00Z",
  "resumable": true,
  "mirrors": [
    { "url": "https://mirror1.example.com/...", "location": "US", "priority": 1 }
  ]
}
```

### Get Torrent

```http
GET /api/v1/downloads/torrent/{id}
```

**Response:**
```json
{
  "magnetLink": "magnet:?xt=urn:btih:...",
  "torrentFile": "<base64>",
  "infoHash": "abc123...",
  "trackers": ["udp://tracker.example.com:6969"],
  "webSeeds": ["https://storage.example.com/..."],
  "peers": { "seeders": 42, "leechers": 5 }
}
```

### Get Magnet Link

```http
GET /api/v1/downloads/magnet/{id}
```

---

## Admin Domain

Administrative operations (requires admin role).

### Trigger Sync

```http
POST /api/v1/admin/sync
```

### Get Analytics

```http
GET /api/v1/admin/analytics/overview
GET /api/v1/admin/analytics/curation
GET /api/v1/admin/analytics/downloads
```

### Manage Users

```http
GET    /api/v1/admin/users
GET    /api/v1/admin/users/{id}
PATCH  /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}
```

---

## Notifications

```http
GET  /api/v1/notifications
POST /api/v1/notifications/{id}/read
POST /api/v1/notifications/read-all
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid architecture value",
    "details": { "field": "arch", "value": "invalid" },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Caching

| Endpoint | Cache-Control |
|----------|---------------|
| `catalog/*` | `public, max-age=300` (5 min) |
| `library/isos/{id}` | `public, max-age=1800` (30 min) |
| `curation/*` | `private, no-cache` |
| `downloads/*` | `private, max-age=60` (1 min) |

---

## Pagination

All list endpoints support:

| Parameter | Default | Max |
|-----------|---------|-----|
| `page` | 1 | - |
| `limit` | 20 | 100 |

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1523,
    "pages": 77,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Database Schema

```sql
-- Core tables
CREATE TABLE distros (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(256) UNIQUE NOT NULL,
  name VARCHAR(256) NOT NULL,
  family VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE isos (
  id SERIAL PRIMARY KEY,
  distro_id INTEGER REFERENCES distros(id),
  filename VARCHAR(512) NOT NULL,
  drive_id VARCHAR(256) UNIQUE NOT NULL,
  checksum VARCHAR(64),
  version VARCHAR(50),
  arch VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  confidence_score INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(256) UNIQUE NOT NULL,
  reputation INTEGER DEFAULT 10,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Edit workflow
CREATE TABLE edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(256) REFERENCES profiles(user_id),
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(256),
  operation VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  data JSONB NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE TABLE edit_votes (
  edit_id UUID REFERENCES edits(id) ON DELETE CASCADE,
  user_id VARCHAR(256) REFERENCES profiles(user_id),
  vote VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (edit_id, user_id)
);

CREATE TABLE edit_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edit_id UUID REFERENCES edits(id) ON DELETE CASCADE,
  user_id VARCHAR(256) REFERENCES profiles(user_id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supporting tables
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(256) REFERENCES profiles(user_id),
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_id INTEGER REFERENCES isos(id),
  user_id VARCHAR(256),
  download_type VARCHAR(50),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(256) REFERENCES profiles(user_id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  curator_id VARCHAR(256) REFERENCES profiles(user_id),
  public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collection_items (
  collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
  iso_id INTEGER REFERENCES isos(id) ON DELETE CASCADE,
  position INTEGER,
  PRIMARY KEY (collection_id, iso_id)
);

-- Indexes
CREATE INDEX idx_isos_status ON isos(status);
CREATE INDEX idx_isos_distro ON isos(distro_id);
CREATE INDEX idx_edits_status ON edits(status);
CREATE INDEX idx_edits_user ON edits(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
```

---

## Implementation Status

| Domain | Status | Notes |
|--------|--------|-------|
| Catalog/Search | 🟡 Basic | Needs facets, advanced filters |
| Library/ISOs | 🟡 Basic | Needs rich metadata |
| Curation/Edits | ❌ Missing | Core workflow needed |
| Downloads | ❌ Missing | Tracking, torrents needed |
| Admin | 🟡 Basic | Sync only |
| Notifications | ❌ Missing | - |

**Legend**: ✅ Complete | 🟡 Partial | ❌ Missing
