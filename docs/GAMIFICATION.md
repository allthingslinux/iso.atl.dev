# Gamification & Contribution Incentives (Draft)

## Overview

Ideas for encouraging contributions, improving data quality, and making the archive feel alive.

---

## The Goal Effect (Near-Completion Psychology)

When something is 90% complete, people are more motivated to finish it than when it's 50% complete.

### Implementation Ideas

**Progress bars everywhere:**
- ISO detail page: "This ISO is 85% complete"
- Distro page: "Ubuntu is 92% complete (38/41 ISOs fully documented)"
- Archive dashboard: "Linux ISOs: 78% complete"

**"Almost there" callouts:**
- "This ISO needs just 2 more fields to reach 100%"
- "Add a checksum to complete this record"
- Highlight the specific missing fields

**Completion milestones:**
- 100% complete badge on ISO cards
- "Fully documented" status distinct from "verified"
- Distro badges: "All ISOs complete"

---

## Contribution Hooks

### Low-friction entry points

**"Quick fix" actions:**
- Single-field edit buttons: [Add release date] [Add checksum]
- Pre-filled edit forms for common missing fields
- "I have this ISO" → prompt for checksum contribution

**Contextual prompts:**
- Download page: "Help verify this ISO - submit the SHA256 after download"
- Search results: Show completeness %, "Help improve" link on incomplete items
- 404/empty states: "This distro isn't in our archive yet. [Add it]"

### Progressive engagement

```
Guest → Browse, download
  ↓ (sign up)
User → Submit edits
  ↓ (5 accepted edits)
Editor → Vote on edits
  ↓ (reputation threshold)
Trusted → Auto-approve simple edits
  ↓ (invite)
Moderator → Immediate accept/reject, status changes
```

---

## Reputation & Recognition

### Visible contributions

**User profiles:**
- Edits submitted / accepted / rejected
- "Contributed to X ISOs"
- "Improved archive completeness by Y%"
- Voting accuracy (% of votes that matched final outcome)

**Leaderboards:**
- Weekly/monthly top contributors
- "Most improved distros this month"
- Avoid pure volume metrics (quality > quantity)

---

## Badge System

Inspired by Redacted's badge system - badges reward actions, guide onboarding, and add discovery/mystery.

### Badge Types

| Type | Description | Display |
|------|-------------|---------|
| **Role** | Permission-based, assigned | Colored pill |
| **Tutorial** | Onboarding actions | Guides new users |
| **Achievement** | One-time unlocks | Icon + name |
| **Milestone** | Tiered progression | Shows next tier |
| **Conditional** | Active while condition met | Can be lost |
| **Secret** | Hidden criteria | Cryptic descriptions |
| **Special** | Limited/event-based | Rare |

### Badge Rewards

Badges award **reputation points**:
- Tutorial badges: 1-2 points
- Achievements: 2-5 points
- Milestones: 5-10 points per tier
- Special: 10+ points

### Tutorial Badges (Onboarding)

Guide new users through key actions.

| Badge | Description | Points |
|-------|-------------|--------|
| `First Edit` | Sharing is caring | 2 |
| `First Download` | Not that kind of download | 1 |
| `First Vote` | Democracy in action | 1 |
| `First Comment` | Make yourself known! | 1 |
| `Set Avatar` | Express yourself! | 1 |
| `Complete Profile` | Tell us about yourself | 2 |
| `First Bookmark` | Saving it for later | 1 |
| `Join Discord` | Come chat with us! | 2 |

### Role Badges

| Badge | Criteria | Color |
|-------|----------|-------|
| `Admin` | Assigned | Red |
| `Moderator` | Assigned | Purple |
| `Editor` | 5+ accepted edits | Blue |
| `Contributor` | 1+ accepted edit | Green |
| `Automation` | Bot account | Gray |

### Achievement Badges

| Badge | Icon | Description | Points |
|-------|------|-------------|--------|
| `Perfectionist` | ✨ | Brought an ISO to 100% completeness | 5 |
| `Completionist` | 🏁 | Completed all ISOs for a distro | 10 |
| `Adopter` | 🏠 | Adopted your first distro | 3 |
| `Archaeologist` | 🦴 | Added a vintage/legacy ISO | 3 |
| `Polyglot` | 🌍 | Contributed to 5+ OS types | 5 |
| `Family Reunion` | 👨‍👩‍👧 | Contributed to entire family | 10 |
| `Bug Hunter` | 🐛 | Flagged ISO with confirmed issue | 3 |
| `Tie Breaker` | ⚖️ | Cast the deciding vote | 2 |
| `Unanimous` | 🤝 | Edit accepted with no rejections | 2 |
| `Comeback` | 🔄 | Edit accepted after initial rejection | 3 |

### Milestone Badges (Tiered)

Shows current tier and progress to next.

| Badge | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|-------|--------|--------|--------|--------|--------|
| `Contributor` | 10 edits | 50 | 100 | 250 | 500 |
| `Curator` | 10 votes | 50 | 100 | 250 | 500 |
| `Archivist` | 10 ISOs | 50 | 100 | 250 | 500 |
| `Verifier` | 10 checksums | 50 | 100 | 250 | 500 |
| `Veteran` | 1 month | 6 mo | 1 year | 2 years | 5 years |

Points: Tier 1 = 2, Tier 2 = 3, Tier 3 = 5, Tier 4 = 7, Tier 5 = 10

### Conditional Badges

Active only while condition is met - can be lost!

| Badge | Condition | Points |
|-------|-----------|--------|
| `Hot Streak` | 5+ edits accepted in a row | 0 |
| `Perfect Record` | 100% edit acceptance rate (min 10) | 0 |
| `Active Maintainer` | Adopted distro updated in last 30 days | 0 |
| `Top 10` | Currently in top 10 contributors | 0 |

### Secret Badges

Hidden criteria, cryptic descriptions. Users discover these organically.

| Badge | Hint | Actual Criteria |
|-------|------|-----------------|
| `Night Owl` | 🦉 "Who?" | Submit edit between 2-5 AM |
| `Speed Demon` | ⚡ "Gotta go fast" | Edit accepted within 1 hour |
| `Necromancer` | 💀 "Back from the dead" | Edit an ISO untouched for 1+ year |
| `Minimalist` | 📦 "Less is more" | Add 10 minimal ISOs |
| `Heavyweight` | 🏋️ "Do you even lift?" | Add ISO over 10GB |
| `Time Traveler` | ⏰ "Back to the future" | Add ISO from before 2000 |
| `Penguin Whisperer` | 🐧 "They speak to me" | Contribute to 50 Linux distros |
| `BSD Believer` | 😈 "Beastie approved" | Contribute to all BSD variants |

### Special Badges

Limited availability.

| Badge | Icon | Criteria | Points |
|-------|------|----------|--------|
| `Founder` | 🏛️ | Original team | 50 |
| `Pioneer` | 🚀 | First 100 users | 20 |
| `Beta Tester` | 🧪 | Pre-launch contributor | 15 |
| `Archivathon 2025` | 🏆 | Event participant | 10 |
| `Top Contributor Q1` | 🥇 | Quarterly winner | 25 |

### Badge Display

**Profile page:**
```
┌─────────────────────────────────────────────────────────┐
│ @username                          [Moderator] [Editor] │
│ Reputation: 847 points                                  │
├─────────────────────────────────────────────────────────┤
│ Tutorial Progress: ████████░░ 8/10                      │
│ ✓ First Edit  ✓ First Vote  ✓ Set Avatar  ○ Join Discord│
├─────────────────────────────────────────────────────────┤
│ Achievements                                            │
│ ✨ Perfectionist  🏁 Completionist  🦴 Archaeologist    │
├─────────────────────────────────────────────────────────┤
│ Milestones                                              │
│ Contributor (Tier 3) ████████░░ 142/250 to Tier 4       │
│ Curator (Tier 2)     ██████░░░░ 67/100 to Tier 3        │
│ Veteran (Tier 4)     2 years on site                    │
├─────────────────────────────────────────────────────────┤
│ Active                                                  │
│ 🔥 Hot Streak (7 in a row)  📊 Top 10 (#4 this month)   │
├─────────────────────────────────────────────────────────┤
│ Secret: 3 discovered  [🦉] [⚡] [💀]                    │
└─────────────────────────────────────────────────────────┘
```

**Unearned badges page:**
Shows grayed-out badges you haven't earned yet (except secrets).

**Badge log:**
```
Dec 23, 2024 - Advanced to Contributor (Tier 3)
Dec 20, 2024 - Earned "Perfectionist"
Dec 15, 2024 - Earned "First Vote"
```

### Data Model

```sql
CREATE TABLE badges (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  hint        TEXT,                    -- for secret badges
  icon        VARCHAR(10),
  type        VARCHAR(20) NOT NULL,    -- tutorial, achievement, milestone, conditional, secret, special
  tier        INTEGER,                 -- for milestone badges
  points      INTEGER DEFAULT 0,
  criteria    JSONB,                   -- machine-readable conditions
  secret      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
  user_id     TEXT NOT NULL REFERENCES auth_users(id),
  badge_id    VARCHAR(50) NOT NULL REFERENCES badges(id),
  tier        INTEGER,                 -- current tier for milestone badges
  earned_at   TIMESTAMP DEFAULT NOW(),
  lost_at     TIMESTAMP,               -- for conditional badges
  metadata    JSONB,
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_active ON user_badges(user_id) WHERE lost_at IS NULL;
```

---

## Attribution

- Edit history shows who contributed what
- "Last edited by @username"
- Contributor list on distro pages

---

## Social Proof & Activity

### Activity feed

**Public feed:**
- "ubuntu-22.04 was verified by @mod"
- "@user added 3 new Fedora ISOs"
- "Arch Linux reached 100% completeness"

**Personal feed:**
- "Your edit was accepted"
- "Someone voted on your edit"
- "An ISO you contributed to was downloaded 50 times"

### Community stats

**Dashboard widgets:**
- "X edits this week"
- "Y new ISOs added"
- "Z% average completeness (up from W%)"
- Active contributors count

---

## Streaks & Cadence

### Daily/weekly engagement

**Contribution streaks:**
- "5 day contribution streak"
- Small bonus reputation for consistent activity
- Don't make it punishing (no "streak lost" shame)

**Weekly digest:**
- Email/notification: "This week in the archive"
- Your contributions, community highlights
- "ISOs needing attention" suggestions

---

## Quality Incentives

### Accuracy rewards

- Edits that get accepted quickly (unanimous votes) = bonus reputation
- Edits that get rejected = small reputation penalty (prevents spam)
- Voting with the majority = shows good judgment

### Review incentives

- "X edits awaiting review" badge
- "Help clear the queue" prompts
- Recognition for thorough reviewers (comments, catches errors)

---

## Distro Adoption

### "Adopt a distro" program

- Users can claim responsibility for a distro
- Get notified of new uploads, edits, issues
- Badge: "Maintainer of X"
- Leaderboard of best-maintained distros

### Distro completeness challenges

- "Help us complete all Debian-family ISOs this month"
- Community goal with progress bar
- Celebration when achieved

---

## Anti-Gaming Measures

### Prevent abuse

- Rate limits on edit submissions
- Reputation penalties for rejected edits
- No reputation for self-votes (can't vote on own edits)
- Moderator oversight for suspicious patterns

### Quality over quantity

- Weight reputation by edit complexity (adding checksum > fixing typo)
- Bonus for edits on neglected ISOs vs. popular ones
- Diminishing returns on same-distro edits

---

## Notifications That Drive Action

### Timely prompts

| Trigger | Notification |
|---------|--------------|
| Edit pending 5+ days | "Your edit needs votes - share it?" |
| ISO you edited downloaded | "Your contribution helped someone!" |
| Distro you maintain has new upload | "New ISO added to [distro]" |
| Near completion | "[Distro] is 95% complete - help finish it?" |
| Edit queue low | "Only 3 edits need review" |

### Digest options

- Real-time (for power users)
- Daily digest
- Weekly summary
- Off (just show in-app)

---

## UI/UX Patterns

### Progress visualization

```
ISO Completeness: ████████░░ 82%
Missing: release_date, kernel_version

[Add release date] [Add kernel version]
```

### Contribution prompts

```
┌─────────────────────────────────────┐
│ 🎯 Quick contribution opportunity   │
│                                     │
│ ubuntu-24.04-server needs a SHA256  │
│ checksum. Do you have this ISO?     │
│                                     │
│ [I can help] [Not now]              │
└─────────────────────────────────────┘
```

### Achievement unlocked

```
┌─────────────────────────────────────┐
│ 🏆 Achievement Unlocked!            │
│                                     │
│ "Completionist"                     │
│ Filled all fields on an ISO         │
│                                     │
│ [Share] [View profile]              │
└─────────────────────────────────────┘
```

---

## Metrics to Track

### Contribution health

- Edits submitted per week
- Edit acceptance rate
- Average time to edit resolution
- Active contributors (submitted in last 30 days)

### Data quality

- Archive-wide completeness %
- Completeness trend over time
- ISOs at 100% vs < 50%
- Verified vs staging ratio

### Engagement

- Return visitor rate
- Edits per user distribution
- Time from signup to first edit
- Voting participation rate

---

## Implementation Priority

### Phase 1 (MVP)
- [ ] Completeness scores displayed on ISO/distro pages
- [ ] Basic user profiles with edit counts
- [ ] "Add missing field" quick actions
- [ ] Activity log (already exists)

### Phase 2
- [ ] Badges/achievements system
- [ ] Leaderboards
- [ ] Contribution streaks
- [ ] Email digests

### Phase 3
- [ ] Adopt-a-distro program
- [ ] Community challenges
- [ ] Advanced reputation weighting
- [ ] Social sharing

---

## "Better" Page (Inspired by Redacted)

A dedicated contribution hub showing exactly what needs improvement, updated regularly.

### Core Concept

> "Here at the ISO Archive, we believe there's always room for improvement. These lists help you contribute and help us improve overall quality."

### Contribution Lists

| List | Description | Query |
|------|-------------|-------|
| **Missing Checksums** | ISOs without SHA256 verification | `checksum_sha256 IS NULL` |
| **Missing Release Dates** | ISOs without release date | `release_date IS NULL` |
| **Missing Kernel Version** | Linux ISOs without kernel info | `os_type = 'linux' AND kernel_version IS NULL` |
| **Incomplete Metadata** | ISOs below 50% completeness | `completeness_score < 50` |
| **Almost Complete** | ISOs at 80-99% (easy wins) | `completeness_score BETWEEN 80 AND 99` |
| **Staging ISOs** | Newly imported, need review | `status = 'staging'` |
| **Flagged ISOs** | Have problems, need fixes | `status = 'flagged'` |
| **Orphan Distros** | Distros with no maintainer | No adopter assigned |
| **Single-version Distros** | Distros with only 1 ISO | `iso_count = 1` |
| **Stale Distros** | No new ISOs in 2+ years | Last ISO old |
| **Missing Descriptions** | Distros without description | `description IS NULL` |
| **Missing Logos** | Distros without logo | `logo_url IS NULL` |
| **Missing Website** | Distros without website link | `website IS NULL` |

### Personalized Lists

| List | Description |
|------|-------------|
| **Your Downloads** | ISOs you downloaded that need checksums (you can verify!) |
| **Your Uploads** | ISOs you submitted that could be improved |
| **Your Distros** | Distros you've adopted that need attention |
| **Your Edits** | Your pending edits awaiting votes |

### List Features

- Show 50-100 items per list
- Update every 15 minutes (or on-demand)
- Sort by: completeness, age, popularity
- Filter by: OS type, family, architecture
- One-click "I'll fix this" to start edit

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Better - Contribution Hub                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Missing Checksums (127 ISOs)                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ubuntu-24.04-desktop-amd64.iso          [Add SHA256]│ │
│ │ fedora-41-workstation-x86_64.iso        [Add SHA256]│ │
│ │ debian-12.8-amd64-netinst.iso           [Add SHA256]│ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Almost Complete (43 ISOs at 80-99%)                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ arch-2024.12.01-x86_64.iso    95% [+kernel_version] │ │
│ │ mint-22-cinnamon-64bit.iso    90% [+release_date]   │ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Your Downloads Needing Verification (3)                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ You downloaded these - can you verify the checksum? │ │
│ │ manjaro-kde-24.1-x86_64.iso             [Verify]    │ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Gamification Tie-ins

- "You've cleared 5 items from Missing Checksums this week!"
- Progress bars: "Missing Checksums: 127 remaining (was 150 last week)"
- Leaderboard: "Top contributors to Better lists this month"
- Badge: "Perfectionist" - cleared 50 items from Better lists

---



- Integration with Discord (role rewards for contributors?)
- "ISO of the day" spotlight for incomplete items
- Seasonal events ("Archivathon" - community push to hit completeness goal)
- Referral program (invite contributors)
- API access tiers based on contribution level
