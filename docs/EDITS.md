# Edit System (Draft)

## Overview

A community-driven edit/voting system for collaborative curation of ISO metadata. Inspired by stash-box and Wikipedia-style moderation.

---

## Goals

1. **Collaborative curation** - Anyone can propose changes, community validates
2. **Audit trail** - Full history of what changed, when, and by whom
3. **Quality control** - Voting prevents vandalism and errors
4. **Moderator efficiency** - Trusted users can fast-track obvious changes

---

## Edit Lifecycle

```
┌─────────┐     vote      ┌──────────┐     apply     ┌─────────┐
│ PENDING │──────────────▶│ ACCEPTED │──────────────▶│ APPLIED │
└─────────┘               └──────────┘               └─────────┘
     │                          │
     │ vote                     │ fail
     ▼                          ▼
┌──────────┐              ┌────────┐
│ REJECTED │              │ FAILED │
└──────────┘              └────────┘
     │
     │ mod action
     ▼
┌─────────────────────┐
│ IMMEDIATE_REJECTED  │
└─────────────────────┘

Creator can CANCEL pending edits
Mods can IMMEDIATE_ACCEPT or IMMEDIATE_REJECT
```

---

## Operations

| Operation | Description | Destructive? |
|-----------|-------------|--------------|
| `CREATE` | Add new entity (ISO, distro, family) | No |
| `MODIFY` | Update existing entity fields | Depends on fields |
| `DESTROY` | Delete entity | Yes |
| `MERGE` | Combine duplicate entities (future) | Yes |

### Destructive Field Changes

Beyond DESTROY/MERGE, these MODIFY changes are considered destructive:

| Entity | Destructive Fields |
|--------|-------------------|
| ISO | `distro_id`, `drive_id`, `filename`, `checksum_*` |
| Distro | `slug`, `name`, `family_id`, `parent_id` |
| Family | `slug`, `name` |

---

## Statuses

| Status | Description |
|--------|-------------|
| `pending` | Awaiting votes |
| `accepted` | Passed voting, ready to apply |
| `rejected` | Failed voting |
| `immediate_accepted` | Moderator approved, bypassed voting |
| `immediate_rejected` | Moderator rejected, bypassed voting |
| `failed` | Application error (constraint violation, etc.) |
| `canceled` | Creator withdrew the edit |

---

## Voting Rules

### Thresholds

| Edit Type | Accept Threshold | Reject Threshold | Min Voting Period |
|-----------|------------------|------------------|-------------------|
| Non-destructive | 2 unanimous YES | 2 unanimous NO | None |
| Destructive | 3 unanimous YES | 3 unanimous NO | 3 days |

**Unanimous** = no opposing votes. If any NO vote exists, cannot auto-accept (and vice versa).

### Vote Types

| Vote | Description |
|------|-------------|
| `accept` | Approve the edit |
| `reject` | Oppose the edit |
| `abstain` | Acknowledge review, no opinion (doesn't affect vote_count) |
| `immediate_accept` | Moderator approval (requires `canModerate`) |
| `immediate_reject` | Moderator rejection (requires `canModerate`) |

### Voting Restrictions

- Cannot vote on your own edits
- One vote per user per edit (can change vote)
- Only `pending` edits can receive votes

---

## Edit Expiration

Pending edits auto-close after **7 days**:
- If `vote_count >= 1`: ACCEPTED and applied
- If `vote_count <= 0`: REJECTED

This prevents edits from lingering indefinitely.

---

## Edit Updates

Creators can update their pending edits:
- Maximum **3 updates** per edit
- Each update **clears all existing votes** (content changed, voters should re-review)
- Each update resets the expiration timer
- Update adds a system comment noting the revision

---

## Data Model

### Edit Table

```sql
CREATE TABLE edits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES auth_users(id),
  
  -- Target
  target_type   VARCHAR(50) NOT NULL,  -- 'iso', 'distro', 'family'
  target_id     VARCHAR(256),          -- NULL for CREATE operations
  
  -- Operation
  operation     operation_type NOT NULL,
  status        edit_status DEFAULT 'pending',
  
  -- Data (JSON)
  new_data      JSONB NOT NULL,        -- Proposed changes
  old_data      JSONB,                 -- Previous state (NULL for CREATE)
  
  -- Voting
  vote_count    INTEGER DEFAULT 0,     -- net: accepts - rejects
  destructive   BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  automation        BOOLEAN DEFAULT FALSE,
  automation_source VARCHAR(100),        -- 'distrowatch-scraper', 'system-migration', etc.
  update_count      INTEGER DEFAULT 0,
  comment           TEXT,                -- Initial submission comment
  
  -- Timestamps
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP,
  closed_at     TIMESTAMP,
  expires_at    TIMESTAMP              -- Auto-close deadline
);

CREATE INDEX idx_edits_status ON edits(status);
CREATE INDEX idx_edits_user ON edits(user_id);
CREATE INDEX idx_edits_target ON edits(target_type, target_id);
CREATE INDEX idx_edits_expires ON edits(expires_at) WHERE status = 'pending';
```

### Enums

```sql
CREATE TYPE operation_type AS ENUM ('create', 'modify', 'destroy');
-- 'merge' added later

CREATE TYPE edit_status AS ENUM (
  'pending',
  'accepted',
  'rejected', 
  'immediate_accepted',
  'immediate_rejected',
  'failed',
  'canceled'
);

CREATE TYPE vote_type AS ENUM (
  'accept',
  'reject',
  'abstain',
  'immediate_accept',
  'immediate_reject'
);
```

### Edit Votes Table

```sql
CREATE TABLE edit_votes (
  edit_id     UUID NOT NULL REFERENCES edits(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES auth_users(id),
  vote        vote_type NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP,
  PRIMARY KEY (edit_id, user_id)
);

-- Trigger to update edits.vote_count on vote insert/update/delete
```

### Edit Comments Table

```sql
CREATE TABLE edit_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edit_id     UUID NOT NULL REFERENCES edits(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES auth_users(id),
  text        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edit_comments_edit ON edit_comments(edit_id);
```

---

## Status Changes

ISO status changes (`staging` → `verified` → `flagged`) are **separate from the edit system**:
- Requires `canModerate` permission
- Direct action, no voting required
- Logged in activity_log for audit trail

---

## Permissions

| Role | Can Submit | Can Vote | Can Immediate | Can Cancel Own |
|------|------------|----------|---------------|----------------|
| Guest | ❌ | ❌ | ❌ | ❌ |
| User | ✅ | ❌ | ❌ | ✅ |
| Editor | ✅ | ✅ | ❌ | ✅ |
| Moderator | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |

### Auto-Promotion

Users automatically gain Editor role (voting rights) after **5 accepted edits**.

---

## API Endpoints

### Submit Edit

```http
POST /curation/edits
```

```json
{
  "target_type": "iso",
  "target_id": "123",
  "operation": "modify",
  "data": {
    "version": "22.04.1",
    "release_date": "2022-08-11"
  },
  "comment": "Updated to point release version"
}
```

### Update Pending Edit

```http
PATCH /curation/edits/{id}
```

```json
{
  "data": {
    "version": "22.04.2",
    "release_date": "2022-08-11"
  },
  "comment": "Corrected version number"
}
```

### Vote on Edit

```http
POST /curation/edits/{id}/votes
```

```json
{
  "vote": "accept"
}
```

### Cancel Edit

```http
POST /curation/edits/{id}/cancel
```

### Get Edit with Diff

```http
GET /curation/edits/{id}
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user": { "id": "...", "username": "contributor" },
  "target_type": "iso",
  "target_id": "123",
  "operation": "modify",
  "status": "pending",
  "new_data": { "version": "22.04.1" },
  "old_data": { "version": "22.04" },
  "vote_count": 2,
  "destructive": false,
  "votes": [
    { "user": { "id": "...", "username": "editor1" }, "vote": "accept" },
    { "user": { "id": "...", "username": "editor2" }, "vote": "accept" }
  ],
  "comments": [...],
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-29T10:30:00Z"
}
```

---

## UI Components

### Edit Queue Page

- Filter by: status, target_type, operation, destructive
- Sort by: created_at, expires_at, vote_count
- Show: target preview, vote count, time remaining

### Edit Detail Page

- Side-by-side diff view (old vs new)
- Vote buttons (accept/reject/abstain)
- Comment thread
- Edit history (if updated)
- "Apply" button for mods (immediate_accept)

### Entity Pages

- "Edit History" tab showing all edits for that entity
- "Pending Edits" badge if any exist
- "Propose Edit" button

### User Profile

- Edit statistics (submitted, accepted, rejected)
- Recent edits list
- Voting history

---

## Notifications

Users receive notifications for:

| Event | Recipients |
|-------|------------|
| Edit accepted | Edit creator |
| Edit rejected | Edit creator |
| Edit commented | Edit creator, previous commenters |
| Vote on your edit | Edit creator |
| Edit on entity you edited | Previous editors of that entity |
| Edit expires soon (24h) | Edit creator |

---

## Automated Edits

For automated submissions (scrapers, system jobs, importers):

| Source Type | Example | Description |
|-------------|---------|-------------|
| `system-sync` | Drive folder sync | Internal system automation |
| `system-migration` | Schema migrations | Data migrations |
| `scraper-distrowatch` | DistroWatch scraper | External data source |
| `user-bot` | User's custom script | User-submitted automation |

Submission:
```json
{
  "automation": true,
  "automation_source": "scraper-distrowatch",
  ...
}
```

- Automated edits clearly marked in UI
- Same voting rules apply (no auto-accept)
- Requires user with appropriate permissions

---

## Edge Cases

### Conflicting Edits

If two pending edits target the same entity:
- Both can be voted on independently
- First to reach threshold is applied
- Second edit's `old_data` becomes stale → marked as `failed` with conflict message

### Entity Deleted While Edit Pending

If target entity is deleted (via another edit):
- Pending edits for that entity → `failed` with "target deleted" message

### Edit Application Failure

If applying an accepted edit fails (constraint violation, etc.):
- Status → `failed`
- System comment added with error details
- Creator notified

---

## Migration from Current Schema

### Changes to `edits` table

| Current | New |
|---------|-----|
| `data JSONB` | Split into `new_data` and `old_data` |
| `edit_type` | Rename to `operation` |
| `votes_yes`, `votes_no` | Replace with `vote_count` (net) |
| — | Add `destructive`, `bot`, `update_count`, `expires_at` |

### New enum values

- `edit_status`: Add `immediate_accepted`, `immediate_rejected`, `failed`, `canceled`
- `vote_type`: Add `immediate_accept`, `immediate_reject`

---

## Implementation Steps

1. [ ] Update schema with new fields and enums
2. [ ] Create vote_count trigger
3. [ ] Implement edit submission with old_data capture
4. [ ] Implement voting logic with threshold checks
5. [ ] Implement edit expiration cron job
6. [ ] Implement edit application (apply changes to target)
7. [ ] Add immediate accept/reject for moderators
8. [ ] Add edit update functionality
9. [ ] Add conflict detection
10. [ ] Build UI components
11. [ ] Add notifications

---

## Open Questions

None - ready for implementation.
