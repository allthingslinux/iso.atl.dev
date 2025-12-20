# Project Overview: ISO Archive "The Great Library"

## Executive Summary
The **ISO Archive** is a monumental effort by the **AllThingsLinux (ATL)** community to build a comprehensive, searchable, and community-maintained repository of operating system installation media. 

Unlike a simple file directory or a static mirror, this platform aims to be "The Great Library" of software history: preserving 100TB+ of ISOs (from mainstream Linux distros to abandoned, obscure, and vintage OSs) with rich metadata, verification, and deep search capabilities.

## Vision & Core Value Proposition
-   **Preservation**: Prevent "link rot" and data loss for thousands of Linux distributions and other operating systems.
-   **Discovery**: Replace flat file listings with a powerful, faceted search engine (OS Family, Arch, Desktop, Version, Date).
-   **Trust**: Provide automated checksum calculation, virus scanning (future), and community verification for every file.
-   **Community**: Enable a Wikipedia-style curation model where users can contribute metadata, tag releases, and improve the archive's quality. This is powered by a **Curator Reputation System**.

## Scope

### Primary Target Audience
1.  **Seekers**: Users trying to find specific, often rare or old ISOs for testing, virtualization, or nostalgia.
2.  **Contributors**: Data archivists and community members who identify missing files, upload new ones, and enrich metadata.
3.  **Maintainers**: The core ATL team managing the storage (Google Drive/S3) and ensuring platform health.

### Key Features
12.  **Dashboard Experience**:
    *   **Modern Workspace**: A persistent sidebar-driven interface for efficient navigation.
    *   **Search**: High-performance search (currently Postgres-fallback) with granular filters.
    *   **Browsing**: Directory-style grid navigation for the Great Library.
    *   **Staging Area**: Dedicated review flow for community curation.
    *   **Downloads**: Direct download links (potentially proxied) and torrent/magnet generation.

2.  **Data & Metadata**:
    *   **Automated Ingestion**: Parsers to extract OS, Version, Arch from filenames.
    *   **Manual Curation**: UI for contributors to edit title, description, release date, and tags.
    *   **Bi-directional Sync**: State synchronization between the physical storage (Google Drive) and the metadata database (Postgres).

3.  **Community & Identity**:
    *   **Authentication**: Login via ATL SSO (Keycloak) or Discord.
    *   **Reputation**: Tracking user contributions (edits, uploads).

## Success Metrics
*   **Scale**: Capable of indexing and serving 100,000+ ISO files (~100TB).
*   **Performance**: Search results returned in <100ms.
*   **Accuracy**: 99% automated match rate for well-named files; robust tools for fixing the remaining 1%.
*   **Availability**: High uptime for the search interface, independent of the underlying storage provider's browsing limits.
