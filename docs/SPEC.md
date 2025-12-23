# ISO Archive Specification

## Directory Structure

```
/{os_type}/{letter}/{distro}/{version}/
    └── {filename}.iso
    └── {filename}.iso.sha256
```

**Example:**
```
/linux/u/ubuntu/22.04/
    ├── ubuntu-22.04-amd64-desktop-live-20220421-en.iso
    └── ubuntu-22.04-amd64-desktop-live-20220421-en.iso.sha256
```

---

## OS Types

| Value | Description | Examples |
|-------|-------------|----------|
| `linux` | Linux distributions | Ubuntu, Fedora, Arch, Debian |
| `bsd` | BSD variants | FreeBSD, OpenBSD, NetBSD, GhostBSD |
| `unix` | Commercial/other Unix | Solaris, AIX, HP-UX, illumos |
| `vintage` | Legacy/historical systems | MS-DOS, OS/2, AmigaOS, NeXTSTEP |
| `other` | Experimental/alternative | Haiku, ReactOS, Plan 9, Redox |
| `mobile` | Mobile operating systems | Android, postmarketOS |
| `windows` | Windows releases | Windows XP, 7, 10 (TBD) |

---

## Filename Convention

```
{distro}-{version}-{arch}-[{edition}]-[{spin}]-[{libc}]-[{init_system}]-[{hardware_target}]-{iso_type}-{release_date}-{language}.iso
```

All components lowercase, separated by hyphens. Brackets indicate optional fields - omit if not applicable.

**Examples:**
```
ubuntu-22.04-amd64-desktop-live-20220421-en.iso
ubuntu-22.04-amd64-server-live-20220421-en.iso
fedora-40-amd64-workstation-live-20240416-en.iso
fedora-40-amd64-kde-live-20240416-en.iso
kubuntu-22.04-amd64-kde-live-20220421-en.iso
freebsd-14.1-amd64-full-20240604-en.iso
artix-rolling-amd64-base-openrc-live-20240823-en.iso
void-rolling-amd64-xfce-musl-live-20241201-en.iso
bazzite-40-amd64-deck-gnome-nvidia-live-20241201-en.iso
arch-rolling-amd64-live-20241215-en.iso
```

---

## Field Definitions

### Required Fields

| Field | DB Column | Description | Examples |
|-------|-----------|-------------|----------|
| **distro** | `distros.slug` | Distribution name (lowercase) | `ubuntu`, `fedora`, `freebsd` |
| **version** | `isos.version` | Release version or identifier | `22.04`, `40`, `14.1`, `rolling` |
| **arch** | `isos.arch` | CPU architecture | `amd64`, `arm64`, `i386`, `riscv64` |

### Optional Fields

| Field | DB Column | Description | Examples | Default |
|-------|-----------|-------------|----------|---------|
| **edition** | `isos.edition` | Target audience/variant | `desktop`, `server`, `cloud`, `gaming`, `education` | — |
| **spin** | `isos.spin` | Desktop environment/WM | `gnome`, `kde`, `xfce`, `mate`, `budgie` | — |
| **iso_type** | `isos.iso_type` | ISO purpose | `live`, `installer`, `minimal`, `netinst`, `full`, `rescue` | — |
| **release_date** | `isos.release_date` | Release date | `YYYYMMDD` format | — |
| **language** | `isos.language` | Language code | `en`, `en-us`, `de`, `zh-cn` | `en` |
| **libc** | `isos.libc` | C library implementation | `glibc`, `musl` | — |
| **init_system** | `isos.init_system` | Init system | `systemd`, `openrc`, `runit`, `s6`, `dinit`, `sysvinit` | — |
| **hardware_target** | `isos.hardware_target` | Hardware-specific build | `nvidia`, `steam-deck`, `surface`, `asus` | `generic` |
| **kernel_version** | `isos.kernel_version` | Kernel version | `6.6-lts`, `6.12` | — |
| **release_stage** | `isos.release_stage` | Release stage | `stable`, `lts`, `beta`, `rc`, `alpha`, `snapshot` | `stable` |

---

## Database Schema

### Enums

```sql
-- OS type classification
CREATE TYPE os_type AS ENUM (
  'linux', 'bsd', 'unix', 'vintage', 'other', 'mobile', 'windows'
);

-- Release stability/stage
CREATE TYPE release_stage AS ENUM (
  'stable', 'lts', 'beta', 'alpha', 'rc', 'snapshot', 'nightly'
);

-- ISO purpose/type
CREATE TYPE iso_type AS ENUM (
  'live', 'installer', 'minimal', 'netinst', 'full', 'server', 'rescue', 'cloud'
);

-- ISO curation status
CREATE TYPE iso_status AS ENUM (
  'pending', 'staging', 'verified', 'flagged', 'archived'
);
```

### Families Table

Families represent the base lineage/package ecosystem of distributions.

```sql
CREATE TABLE families (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(50) NOT NULL UNIQUE,   -- url-safe identifier
  name          VARCHAR(100) NOT NULL,         -- display name
  description   TEXT,
  website       VARCHAR(512),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_families_slug ON families(slug);
```

**Seed data:**

| slug | name | description |
|------|------|-------------|
| `debian` | Debian | APT/dpkg-based, .deb packages |
| `rhel` | Red Hat | RPM/dnf-based, .rpm packages |
| `arch` | Arch Linux | Pacman-based, rolling release |
| `suse` | SUSE | Zypper/RPM-based |
| `gentoo` | Gentoo | Portage-based, source compilation |
| `slackware` | Slackware | One of the oldest, .tgz packages |
| `void` | Void Linux | XBPS-based, independent |
| `nixos` | NixOS | Nix package manager, declarative |
| `alpine` | Alpine | APK-based, musl libc |
| `bsd` | BSD | BSD-derived systems |
| `independent` | Independent | No parent lineage |

### Distros Table

```sql
CREATE TABLE distros (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(256) NOT NULL UNIQUE,  -- url-safe identifier (e.g., "ubuntu", "kubuntu")
  name          VARCHAR(256) NOT NULL,         -- display name (e.g., "Ubuntu", "Kubuntu")
  os_type       os_type NOT NULL,              -- linux, bsd, unix, etc.
  family_id     INTEGER REFERENCES families(id),
  parent_id     INTEGER REFERENCES distros(id),-- for flavors (Kubuntu → Ubuntu)
  description   TEXT,
  website       VARCHAR(512),
  logo_url      VARCHAR(512),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_distros_slug ON distros(slug);
CREATE INDEX idx_distros_family ON distros(family_id);
CREATE INDEX idx_distros_parent ON distros(parent_id);
CREATE INDEX idx_distros_os_type ON distros(os_type);
```

### ISOs Table

```sql
CREATE TABLE isos (
  id              SERIAL PRIMARY KEY,
  distro_id       INTEGER NOT NULL REFERENCES distros(id),
  
  -- Core identification
  filename        VARCHAR(512) NOT NULL,
  drive_id        VARCHAR(256) NOT NULL UNIQUE,
  version         VARCHAR(50),
  arch            VARCHAR(50),
  
  -- Classification
  edition         VARCHAR(50),                  -- desktop, server, cloud, gaming
  spin            VARCHAR(50),                  -- gnome, kde, xfce, mate
  iso_type        iso_type,                     -- live, installer, minimal, netinst
  release_stage   release_stage DEFAULT 'stable',
  
  -- Optional metadata
  libc            VARCHAR(50),                  -- glibc, musl
  init_system     VARCHAR(50),                  -- systemd, openrc, runit, s6, dinit
  hardware_target VARCHAR(50) DEFAULT 'generic',-- nvidia, steam-deck, surface
  language        VARCHAR(10) DEFAULT 'en',
  kernel_version  VARCHAR(50),
  release_date    DATE,                         -- actual release date (YYYY-MM-DD)
  
  -- File info
  size            BIGINT,
  checksum_md5    VARCHAR(32),
  checksum_sha1   VARCHAR(40),
  checksum_sha256 VARCHAR(64),
  
  -- Curation status
  status          iso_status DEFAULT 'pending',
  confidence_score INTEGER DEFAULT 0,
  metadata        JSONB,                        -- overflow/custom fields
  
  -- Timestamps
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_isos_distro ON isos(distro_id);
CREATE INDEX idx_isos_version ON isos(version);
CREATE INDEX idx_isos_arch ON isos(arch);
CREATE INDEX idx_isos_edition ON isos(edition);
CREATE INDEX idx_isos_spin ON isos(spin);
CREATE INDEX idx_isos_iso_type ON isos(iso_type);
CREATE INDEX idx_isos_release_stage ON isos(release_stage);
CREATE INDEX idx_isos_release_date ON isos(release_date);
CREATE INDEX idx_isos_status ON isos(status);
```

---

## Entity Relationships

```
families (1) ←───────── (many) distros (1) ←───────── (many) isos
                               │
                               └── parent_id (self-reference for flavors)
```

### Hierarchy Example: Debian Family

```
families:
  └── debian (id: 1)

distros:
  ├── Debian     (id: 1, family_id: 1, parent_id: null)
  │
  └── Ubuntu     (id: 2, family_id: 1, parent_id: null)
        ├── Kubuntu     (id: 3, family_id: 1, parent_id: 2)
        ├── Xubuntu     (id: 4, family_id: 1, parent_id: 2)
        ├── Lubuntu     (id: 5, family_id: 1, parent_id: 2)
        ├── Edubuntu    (id: 6, family_id: 1, parent_id: 2)
        ├── Ubuntu MATE (id: 7, family_id: 1, parent_id: 2)
        │
        └── Linux Mint  (id: 8, family_id: 1, parent_id: 2)
              └── LMDE  (id: 9, family_id: 1, parent_id: 1)  -- based on Debian directly

isos:
  ├── ubuntu-22.04-amd64-desktop-live-...    (distro_id: 2, edition: desktop)
  ├── ubuntu-22.04-amd64-server-live-...     (distro_id: 2, edition: server)
  ├── kubuntu-22.04-amd64-desktop-live-...   (distro_id: 3, spin: kde)
  └── edubuntu-22.04-amd64-desktop-live-...  (distro_id: 6, edition: education)
```

### Key Distinctions

| Scenario | Solution | Example |
|----------|----------|---------|
| Separate project with own branding/team | New distro with `parent_id` | Kubuntu, Linux Mint, Pop!_OS |
| Same project, different target audience | Same distro, different `edition` | Ubuntu Desktop vs Ubuntu Server |
| Same project, different desktop environment | Same distro, different `spin` | Fedora Workstation (GNOME) vs Fedora KDE Spin |
| Hardware-specific variant | Same distro, different `hardware_target` | Bazzite generic vs Bazzite Steam Deck |

**Note:** `iso_type` and `edition` may overlap for some distros (e.g., Ubuntu Server has `iso_type: installer` + `edition: server`). This is acceptable — `edition` describes the target audience/variant, while `iso_type` describes the ISO's technical purpose.

---

## UI Filter Dimensions

| Filter | Source | Example Values |
|--------|--------|----------------|
| OS Type | `distros.os_type` | Linux, BSD, Unix, Vintage |
| Family | `families.name` | Debian, Arch, RHEL, Independent |
| Distribution | `distros.name` | Ubuntu, Fedora, Arch |
| Architecture | `isos.arch` | amd64, arm64, i386 |
| Desktop | `isos.spin` | GNOME, KDE, XFCE, None |
| Edition | `isos.edition` | Desktop, Server, Cloud |
| ISO Type | `isos.iso_type` | Live, Installer, Minimal |
| Release Stage | `isos.release_stage` | Stable, LTS, Beta, Nightly |
| Libc | `isos.libc` | glibc, musl |
| Init System | `isos.init_system` | systemd, openrc, runit |
| Hardware | `isos.hardware_target` | Generic, NVIDIA, Steam Deck |

---

## Canonical Values

### Architecture Normalization

| Canonical | Aliases |
|-----------|---------|
| `amd64` | x86_64, x64, 64-bit |
| `i386` | x86, i686, 32-bit |
| `arm64` | aarch64 |
| `armhf` | armv7, arm32 |
| `riscv64` | riscv |
| `ppc64le` | ppc64el |

### Edition Values

| Value | Description |
|-------|-------------|
| `desktop` | General desktop use |
| `server` | Server/headless deployment |
| `cloud` | Cloud/VM images |
| `workstation` | Professional workstation |
| `gaming` | Gaming-focused |
| `education` | Educational use |
| `iot` | Internet of Things |
| `minimal` | Minimal/base install |

### Spin/DE Values

| Value | Description |
|-------|-------------|
| `gnome` | GNOME desktop |
| `kde` | KDE Plasma |
| `xfce` | XFCE |
| `mate` | MATE |
| `cinnamon` | Cinnamon |
| `budgie` | Budgie |
| `lxqt` | LXQt |
| `lxde` | LXDE |
| `i3` | i3 window manager |
| `sway` | Sway (Wayland) |
| `hyprland` | Hyprland (Wayland) |
| `openbox` | Openbox |
| `fluxbox` | Fluxbox |

### ISO Type Values

| Value | Description |
|-------|-------------|
| `live` | Bootable live environment |
| `installer` | Installation-only media |
| `minimal` | Minimal/base system |
| `netinst` | Network installer |
| `full` | Full/DVD image |
| `server` | Server installation |
| `rescue` | Recovery/rescue media |
| `cloud` | Cloud image |

### Release Stage Values

| Value | Description |
|-------|-------------|
| `stable` | Stable release |
| `lts` | Long-term support |
| `beta` | Beta release |
| `alpha` | Alpha release |
| `rc` | Release candidate |
| `snapshot` | Rolling/snapshot build |
| `nightly` | Nightly/development build |

### Libc Values

| Value | Description |
|-------|-------------|
| `glibc` | GNU C Library (most common) |
| `musl` | musl libc (lightweight, static-friendly) |

### Init System Values

| Value | Description |
|-------|-------------|
| `systemd` | systemd init (most common) |
| `openrc` | OpenRC init |
| `runit` | runit init |
| `s6` | s6 init |
| `dinit` | dinit init |
| `sysvinit` | SysV init |

### Hardware Target Values

| Value | Description |
|-------|-------------|
| `generic` | Generic/standard hardware |
| `nvidia` | NVIDIA GPU optimized |
| `nvidia-open` | NVIDIA open drivers |
| `amd` | AMD GPU optimized |
| `intel` | Intel optimized |
| `steam-deck` | Steam Deck |
| `surface` | Microsoft Surface |
| `asus` | ASUS hardware |
| `raspberry-pi` | Raspberry Pi |
| `pinebook` | Pinebook/Pine64 |

---

## Special Cases

### Rolling Releases
- **version**: `rolling` or date-based (`2024.12.01`)
- **release_stage**: `snapshot` or `stable`
- Example: `arch-rolling-amd64-base-live-20241215-en.iso`

### Non-Linux Systems
- **kernel_version**: NULL (illumos, BSD handle versions differently)
- **wrapper**: May not apply
- **family_id**: Use `bsd` or `independent` family
- Example: `freebsd-14.1-amd64-release-full-20240604-en.iso`

### Multi-variant Builds (e.g., Bazzite)
Combine multiple optional fields:
```
distro: bazzite
spin: gnome
hardware_target: nvidia
edition: deck
```
Filename: `bazzite-40-amd64-deck-gnome-nvidia-live-20241201-en.iso`

### Flavors with Different DEs
When a flavor IS the DE (like Kubuntu = Ubuntu + KDE):
- Create separate distro with `parent_id`
- Set `spin` on the ISO for clarity
```
distro: kubuntu (parent_id → ubuntu)
spin: kde
```

### Language Variants
- **Primary**: `en` (English, no region)
- **Regional**: `en-us`, `en-gb`, `zh-cn`, `zh-tw`
- **Non-English**: `de`, `fr`, `ja`, `es`

---

## Checksum Files

Store alongside ISO with same base name:
```
ubuntu-22.04-amd64-desktop-live-20220421-en.iso
ubuntu-22.04-amd64-desktop-live-20220421-en.iso.sha256
ubuntu-22.04-amd64-desktop-live-20220421-en.iso.sha1
ubuntu-22.04-amd64-desktop-live-20220421-en.iso.md5
```

**Rules:**
- Only include checksums officially provided by the distribution
- Do not generate unofficial checksums
- Prefer SHA256 when available

---

## Migration from Current Schema

### New Tables
- `families` — distribution lineage/package ecosystem

### Changes to `distros`
| Before | After |
|--------|-------|
| `family VARCHAR(50)` | `family_id INTEGER REFERENCES families(id)` |
| — | `os_type os_type NOT NULL` |
| — | `parent_id INTEGER REFERENCES distros(id)` |
| — | `logo_url VARCHAR(512)` |

### Changes to `isos`
| Before | After |
|--------|-------|
| `category VARCHAR(50)` | REMOVED |
| — | `edition VARCHAR(50)` |
| — | `spin VARCHAR(50)` |
| — | `iso_type iso_type` |
| — | `release_stage release_stage` |
| — | `libc VARCHAR(50)` |
| — | `init_system VARCHAR(50)` |
| — | `hardware_target VARCHAR(50) DEFAULT 'generic'` |
| — | `language VARCHAR(10)` |
| — | `kernel_version VARCHAR(50)` |
| — | `release_date DATE` |

**Note:** `release_date` in the database uses standard `DATE` type (YYYY-MM-DD), while filenames use compact `YYYYMMDD` format.

### Migration Steps
1. Create `families` table and seed with common families
2. Add new columns to `distros` and `isos`
3. Create mapping from old `family` VARCHAR to new `family_id`
4. Parse existing filenames to populate new ISO fields
5. Set `confidence_score` based on parsing accuracy
6. Drop deprecated `category` column
7. Add new indexes


---

## Additional Tables (Curation System)

These tables support the community curation workflow, not ISO metadata.

### Profiles Table

User profiles for reputation and contribution tracking.

```sql
CREATE TABLE profiles (
  id              SERIAL PRIMARY KEY,
  user_id         VARCHAR(256) NOT NULL UNIQUE,  -- external auth ID
  username        VARCHAR(256),
  reputation      INTEGER DEFAULT 10 NOT NULL,
  edits_submitted INTEGER DEFAULT 0 NOT NULL,
  edits_approved  INTEGER DEFAULT 0 NOT NULL,
  edits_rejected  INTEGER DEFAULT 0 NOT NULL,
  votes_cast      INTEGER DEFAULT 0 NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

### Edits Table

Edit proposals for ISO/distro metadata changes.

```sql
CREATE TABLE edits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     VARCHAR(256) NOT NULL REFERENCES profiles(user_id),
  target_type VARCHAR(50) NOT NULL,           -- 'iso', 'distro', 'family'
  target_id   VARCHAR(256),                   -- ID of target entity
  edit_type   edit_type NOT NULL,             -- create, update, merge, delete
  status      edit_status DEFAULT 'pending',  -- pending, approved, rejected, applied
  data        JSONB NOT NULL,                 -- proposed changes
  votes_yes   INTEGER DEFAULT 0 NOT NULL,
  votes_no    INTEGER DEFAULT 0 NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP,
  closed_at   TIMESTAMP
);

CREATE INDEX idx_edits_status ON edits(status);
CREATE INDEX idx_edits_user ON edits(user_id);
CREATE INDEX idx_edits_target ON edits(target_type, target_id);
```

### Edit Votes Table

```sql
CREATE TABLE edit_votes (
  edit_id    UUID NOT NULL REFERENCES edits(id) ON DELETE CASCADE,
  user_id    VARCHAR(256) NOT NULL REFERENCES profiles(user_id),
  vote       vote_type NOT NULL,  -- yes, no, abstain
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (edit_id, user_id)
);
```

### Edit Comments Table

```sql
CREATE TABLE edit_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edit_id    UUID NOT NULL REFERENCES edits(id) ON DELETE CASCADE,
  user_id    VARCHAR(256) NOT NULL REFERENCES profiles(user_id),
  text       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edit_comments_edit ON edit_comments(edit_id);
```

### Drafts Table

Temporary storage for in-progress edits.

```sql
CREATE TABLE drafts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    VARCHAR(256) NOT NULL REFERENCES profiles(user_id),
  type       VARCHAR(50) NOT NULL,
  data       JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drafts_user ON drafts(user_id);
```

### Upload Sessions Table

Tracks direct-to-Drive upload sessions.

```sql
CREATE TABLE upload_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(256) NOT NULL REFERENCES profiles(user_id),
  filename      VARCHAR(512) NOT NULL,
  size          BIGINT NOT NULL,
  upload_uri    TEXT NOT NULL,
  drive_file_id VARCHAR(256),
  status        VARCHAR(50) DEFAULT 'initiated',
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  completed_at  TIMESTAMP
);

CREATE INDEX idx_upload_sessions_user ON upload_sessions(user_id);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
```

### Downloads Table

Tracks download events for analytics.

```sql
CREATE TABLE downloads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_id        INTEGER REFERENCES isos(id),
  user_id       VARCHAR(256),                 -- nullable for anonymous
  download_type VARCHAR(50),                  -- direct, torrent, magnet
  started_at    TIMESTAMP DEFAULT NOW(),
  completed_at  TIMESTAMP
);

CREATE INDEX idx_downloads_iso ON downloads(iso_id);
CREATE INDEX idx_downloads_started ON downloads(started_at);
```

### Notifications Table

```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    VARCHAR(256) NOT NULL REFERENCES profiles(user_id),
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT,
  data       JSONB,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);
```

### Additional Enums (Curation)

```sql
CREATE TYPE edit_status AS ENUM ('pending', 'approved', 'rejected', 'applied');
CREATE TYPE edit_type AS ENUM ('create', 'update', 'merge', 'delete');
CREATE TYPE vote_type AS ENUM ('yes', 'no', 'abstain');
```

---

## Full Entity Relationship Diagram

```
                                    ┌─────────────┐
                                    │  families   │
                                    └──────┬──────┘
                                           │ 1
                                           │
                                           ▼ many
┌─────────────┐                     ┌─────────────┐
│  profiles   │                     │   distros   │◄──┐
└──────┬──────┘                     └──────┬──────┘   │ parent_id
       │ 1                                 │ 1        │ (self-ref)
       │                                   │          │
       ├────────────────┬──────────────────┼──────────┘
       │                │                  │
       ▼ many           │                  ▼ many
┌─────────────┐         │           ┌─────────────┐
│    edits    │         │           │    isos     │
└──────┬──────┘         │           └──────┬──────┘
       │ 1              │                  │ 1
       │                │                  │
       ├────────┐       │                  ├────────────┐
       ▼ many   ▼ many  │                  ▼ many       ▼ many
┌────────────┐ ┌────────────────┐   ┌─────────────┐ ┌──────────────────┐
│ edit_votes │ │ edit_comments  │   │  downloads  │ │ collection_items │
└────────────┘ └────────────────┘   └─────────────┘ └────────┬─────────┘
                                                             │
       ┌─────────────────────────────────────────────────────┘
       │
       ▼ many
┌─────────────┐
│ collections │ (curator_id → profiles)
└─────────────┘

Other profile relations:
  profiles (1) → drafts (many)
  profiles (1) → upload_sessions (many)
  profiles (1) → notifications (many)
  profiles (1) → collections (many, as curator)
```

---

## Future Considerations

### Collections (Someday/Maybe)

Curated lists of ISOs for discovery and organization.

```sql
CREATE TABLE collections (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  curator_id  VARCHAR(256) REFERENCES profiles(user_id),
  public      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collection_items (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  iso_id        INTEGER NOT NULL REFERENCES isos(id) ON DELETE CASCADE,
  position      INTEGER,
  added_at      TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (collection_id, iso_id)
);
```

**Use cases:**
- "Best Lightweight Distros 2024"
- "Gaming-Ready ISOs"
- "Beginner Friendly"
- "Privacy Focused"
- "ARM64 Collection"
