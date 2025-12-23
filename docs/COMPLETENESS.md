# Completeness Score System (Draft)

## Overview

A gamification system to measure and incentivize "archival purity" - how complete and verified our ISO metadata is across the entire archive.

---

## Goals

1. **Measure data quality** - How complete is each ISO's metadata?
2. **Incentivize contributions** - Gamify filling in missing data
3. **Surface gaps** - Show which distros/ISOs need attention
4. **Track progress** - Archive-wide completeness over time

---

## Hierarchy

```
Archive Total (e.g., 78%)
├── OS Type: linux (85%), bsd (72%), vintage (45%)
│   ├── Family: debian (90%), arch (80%), rhel (75%)
│   │   ├── Distro: ubuntu (95%), debian (85%), mint (70%)
│   │   │   └── ISO: file.iso (100%), file2.iso (60%), file3.iso (30%)
```

Each level = weighted average of children (by ISO count).

---

## Field Weights

### Option A: Equal Weights (Simple)

Every applicable field = 1 point. Score = filled / total × 100.

| Field | Points | Required? |
|-------|--------|-----------|
| version | 1 | ✅ |
| arch | 1 | ✅ |
| edition | 1 | |
| spin | 1 | |
| iso_type | 1 | |
| release_stage | 1 | |
| release_date | 1 | |
| language | 1 | |
| libc | 1 | |
| init_system | 1 | |
| hardware_target | 1 | |
| kernel_version | 1 | |
| size | 1 | |
| checksum_md5 | 1 | |
| checksum_sha1 | 1 | |
| checksum_sha256 | 1 | |
| **Total** | **16** | |

**Score = filled_count / 16 × 100**

### Option B: Weighted by Importance

Critical fields worth more than nice-to-haves.

| Category | Fields | Points | Max |
|----------|--------|--------|-----|
| **Identity** | version, arch | 5 each | 10 |
| **Classification** | edition, spin, iso_type, release_stage | 3 each | 12 |
| **Technical** | libc, init_system, hardware_target, kernel_version, release_date, language | 2 each | 12 |
| **File Info** | size | 3 | 3 |
| **Verification** | checksum_sha256 | 8 | 8 |
| **Verification** | checksum_sha1, checksum_md5 | 2 each | 4 |
| **Trust** | status = verified | 10 | 10 |
| | | **Total** | **59** |

**Score = earned_points / 59 × 100**

### Option C: Tiered Percentage

Each tier contributes a fixed percentage.

| Tier | Contribution | Fields |
|------|--------------|--------|
| Core Identity | 25% | version, arch (both required for full 25%) |
| Classification | 25% | edition, spin, iso_type, release_stage (6.25% each) |
| Technical | 20% | libc, init_system, hardware_target, kernel_version, release_date, language (~3.3% each) |
| File Integrity | 15% | size (5%), checksum_sha256 (10%) |
| Verification | 15% | status = verified (15%) |

---

## Open Questions

### 1. N/A Fields

Some fields don't apply to all ISOs:
- `init_system` - N/A for BSD, Windows
- `libc` - N/A for non-Linux
- `spin` - N/A if distro doesn't have DE variants
- `kernel_version` - N/A for BSD (different versioning)

**Options:**
- A) Exclude N/A fields from calculation (score = filled / applicable)
- B) Mark as "N/A" which counts as filled
- C) Ignore - all fields always count

**Recommendation:** Option A - exclude N/A fields. Define applicability rules per OS type.

### 2. Flagged Status Penalty

If `status = flagged`, should the score drop?

**Options:**
- A) No penalty - completeness is separate from trust
- B) Fixed penalty (e.g., -20%)
- C) Zero out verification tier only
- D) Cap at 50% until resolved

**Recommendation:** Option C - zero out verification tier (lose 15-25% depending on model).

### 3. Pending vs Verified

Should `status = pending` affect score?

**Options:**
- A) No - pending just means not yet reviewed
- B) Small penalty (e.g., -10%)
- C) Verification tier = 0 until verified

**Recommendation:** Option A - pending is neutral, verified is a bonus.

### 4. Default Values

Fields with defaults (e.g., `hardware_target = 'generic'`, `language = 'en'`):

**Options:**
- A) Default counts as filled
- B) Default counts as empty (must be explicitly set)
- C) Default = 50% credit

**Recommendation:** Option A - if it has a value, it's filled.

### 5. Naming

What to call this score?

| Option | Pros | Cons |
|--------|------|------|
| `completeness_score` | Clear, descriptive | Boring |
| `purity_score` | Fits "archival purity" theme | Sounds judgmental |
| `enrichment_score` | Positive framing | Vague |
| `data_quality_score` | Technical, accurate | Long |
| `archive_score` | Simple | Too generic |

**Recommendation:** `completeness_score` for DB, display as "Archive Purity" or "Data Completeness" in UI.

---

## Applicability Rules

Define which fields apply based on OS type:

| Field | Linux | BSD | Unix | Vintage | Other | Mobile | Windows |
|-------|-------|-----|------|---------|-------|--------|---------|
| version | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| arch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| edition | ✅ | ✅ | ✅ | ⚪ | ✅ | ✅ | ✅ |
| spin | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| iso_type | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| release_stage | ✅ | ✅ | ✅ | ⚪ | ✅ | ✅ | ✅ |
| release_date | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| language | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| libc | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| init_system | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| hardware_target | ✅ | ✅ | ⚪ | ⚪ | ✅ | ✅ | ✅ |
| kernel_version | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| size | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| checksums | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

✅ = Applicable, ⚪ = N/A (excluded from calculation)

---

## Database Changes

### Option 1: Computed Column

Store and update on every ISO change:

```sql
ALTER TABLE isos ADD COLUMN completeness_score INTEGER DEFAULT 0;

-- Trigger to recalculate on INSERT/UPDATE
CREATE OR REPLACE FUNCTION calculate_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completeness_score := (
    -- calculation logic here
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Option 2: Materialized View

Compute on demand, refresh periodically:

```sql
CREATE MATERIALIZED VIEW iso_completeness AS
SELECT 
  id,
  -- calculation logic
FROM isos;

-- Refresh every hour or on-demand
REFRESH MATERIALIZED VIEW iso_completeness;
```

### Option 3: Application-Level

Calculate in API, cache in Redis/memory.

**Recommendation:** Option 1 (computed column) for ISOs, aggregate views for distro/family/os_type levels.

---

## API Endpoints

### Get Archive Stats

```http
GET /catalog/stats
```

```json
{
  "total_isos": 5234,
  "completeness": {
    "average": 78,
    "by_os_type": {
      "linux": 85,
      "bsd": 72,
      "vintage": 45
    }
  }
}
```

### Get Distro Completeness

```http
GET /library/distros/{slug}/completeness
```

```json
{
  "distro": "ubuntu",
  "completeness": 95,
  "iso_count": 45,
  "breakdown": {
    "complete": 38,
    "partial": 5,
    "minimal": 2
  }
}
```

### Get Incomplete ISOs (for contributors)

```http
GET /catalog/incomplete
```

```json
{
  "results": [
    {
      "id": 123,
      "filename": "...",
      "completeness": 45,
      "missing_fields": ["checksum_sha256", "release_date", "edition"]
    }
  ]
}
```

---

## UI Components

### Archive Dashboard

- Overall completeness gauge (0-100%)
- Breakdown by OS type (bar chart)
- "Most needed" - ISOs with lowest scores
- Leaderboard - top contributors this week

### Distro Page

- Completeness badge/progress bar
- List of ISOs sorted by completeness
- "Help improve" CTA for low-score ISOs

### ISO Detail Page

- Completeness score with breakdown
- Missing fields highlighted
- "Add missing data" quick action

---

## Implementation Steps

1. [ ] Finalize field weights and applicability rules
2. [ ] Add `completeness_score` column to `isos` table
3. [ ] Create calculation function (SQL or application)
4. [ ] Add trigger to recalculate on ISO changes
5. [ ] Create aggregate views for distro/family/os_type
6. [ ] Add API endpoints for stats
7. [ ] Update UI with completeness indicators
8. [ ] Add "incomplete ISOs" discovery feature

---

## Notes

- Current `confidence_score` was for parser accuracy - rename or repurpose?
- Consider separate "verification_score" vs "completeness_score"?
- Gamification: badges for "100% complete distro", "filled 100 fields", etc.?
