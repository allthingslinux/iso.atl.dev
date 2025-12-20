# Requirements: ISO Archive

## User Stories

### Seekers (End Users)
*   **Search**: As a seeker, I want to filter ISOs by Distribution, Version, Architecture, and Desktop Environment (Spin) so I can find exactly the file I need.
*   **Browse**: As a seeker, I want to explore a **Visual**, Grid-based interface (not just text lists) to discover ISOs. (Status: **IMPLEMENTED** - Dashboard Grid View)
*   **Verify**: As a seeker, I want to see the SHA256 checksum of detailed ISOs and verify if it matches the official vendor release.
*   **Download**: As a seeker, I want high-speed direct download links (via Drive Proxy) or **Public BitTorrent** magnets (DHT/WebSeed).
*   **Context**: As a seeker, I want to see related ISOs (e.g., seeing all "Gaming" editions when viewing a standard Ubuntu ISO).

### Contributors
*   **Enrich**: As a contributor, I want to edit the metadata.
*   **Upload**: As a contributor, I want to upload new ISOs to a "Staging" area.
*   **Reputation**: As a regular contributor, I want to earn "Trusted" status. (Status: **IMPLEMENTED** - Foundation for Reputation System)

### Maintainers (System/Admin)
*   **Dev Env**: As a maintainer, I want a local **Dockerized Keycloak** instance to simulate SSO during development.
*   **Sync**: As a maintainer, I want the system to automatically detect files.
*   **Parse**: As a maintainer, I want the system to auto-parse filenames. (Status: **IMPLEMENTED** - Regex-based parser)
*   **Quality Control**: As a maintainer, I want to approve/reject changes in the Staging area. (Status: **IMPLEMENTED** - Staging Area UI)

## Functional Requirements

### 1. Metadata Engine
*   **Schema**: Must support the defined token structure:
    *   `Distribution` (Ubuntu, Fedora)
    *   `Version` (22.04, Rolling)
    *   `Architecture` (amd64, arm64)
    *   `Edition` (Server, Desktop, KDE)
    *   `Date` (YYYYMMDD)
*   **Flexibility**: Must allow for new fields (e.g., "Kernel Version", "Boot Loaders") without major schema migrations (JSONB or strict EAV).

### 2. Search (Algolia)
*   **Indexing**: Changes in the database must propagate to the Algolia index within <1 minute (Real-time or Frequent Batch).
*   **Facets**: Search UI must support multi-select facets (e.g., "Show me all *Arch Linux* ISOs with *KDE* from *2023*").
*   **Typo Tolerance**: Search must handle minor spelling errors in distro names.

### 3. Storage & Sync
*   **Google Drive**: Primary storage backend (100TB).
*   **Decoupled Sync Strategy**:
    *   Database is the "Source of Truth" for metadata.
    *   Drive Files are "Objects". Rnaming a file on Drive is *not* required when fixing a typo in the DB (prevents API thrashing).
    *   System links `drive_id` to `iso_record_id`.
*   **BitTorrent / Tracker**:
    *   System should generate `.torrent` files for ISOs.
    *   Trackers: Plan to integrate or host a private tracker (Gazelle/Unit3D or custom implementation) to offload bandwidth.

### 4. Naming Convention & Automation
*   **Standard format**: `<distro>-<version>-<arch>-<type>-<date>-<lang>.iso`
*   **Confidence Scoring**:
    *   Parser assigns a Score (0-100).
    *   Low Score (<80): Needs Manual Review.
    *   High Score (>90) + Trusted User: Auto-promote to Live (Optional/Configurable).

## Non-Functional Requirements
*   **Performance**: Search results load in <200ms.
*   **Scalability**: Capable of indexing 100,000+ records.
*   **SEO**: Individual ISO pages should be statically generated (SSG/ISR) or Server-Rendered (SSR) for search engine indexing.
