# ISO Archive TODO 🚀

This list consolidates all pending research, decisions, and development tasks from the `docs/` and `brainstorming/` audit.

## 🔍 Research & Decide (Policy & Scope)

- [ ] **Mainstream vs. Niche**: Decide on the priority for actively supported distros (e.g., Ubuntu/Fedora) vs. purely niche/vintage archival.
- [ ] **Category Classification**:
    - [ ] Determine if "Mobile" and "Windows" should be top-level categories or classified under "Vintage".
    - [ ] Define the boundary for "Vintage" (e.g., pre-2010, discontinued status).
- [ ] **Metadata Requirements**: 
    - [ ] Handle "Rolling Releases" (e.g. Arch) without a primary version number.
    - [ ] Decide if "System Manager/Wrapper" metadata should be in the filename or just a searchable tag.
- [ ] **Curation Policy**:
    - [ ] Define what makes a "Trusted" curator for auto-promotion to LIVE.
    - [ ] Establish a policy for handling non-ISO installer formats (floppy, recovery archives).
- [ ] **Cold-Storage Strategy**: Establish a long-term backup plan for off-Google Drive storage (S3 or Archive.org fallback).
- [ ] **Naming Standardization**: 
    - [ ] Finalize token order: `<os>-<variant>-<release>-<arch>-<type>-<date>-<lang>.iso`? (See `call.md`).
    - [ ] Decide on capitalization and separators: `_` (proposed in `call.md`) vs `-`.
    - [ ] Define canonical list of supported languages and regions (ISO639-1 + IETF tags).
    - [ ] Establish a policy for including "non-official" checksums in the archive (See `google-doc.md`).
    - [ ] **Checksum Generation**: Decide if the system should provide its own generated checksums *in addition* to official ones.

## 🗺️ Map Out (Architecture & Design)

- [ ] **Metadata Schema**: Map out the full EAV (Entity-Attribute-Value) or JSONB schema for specialized fields (Kernel version, Init systems, Wrapper).
- [ ] **Synchronization State Machine**: Design the logic for polling Google Drive vs. Sheets vs. DB to prevent API thrashing.
- [ ] **Indexing Pipeline**: Blueprint the path from Postgres updates to the Search Index (Algolia/Elasticsearch).
- [ ] **The "Drone" Service**: Design the hashing/hashing worker strategy (VPS workflow vs. Cloudflare Workers limitations).
- [ ] **Architectural Patterns**:
    - [ ] Document the **Repository Pattern** implementation for data access.
    - [ ] Map out the **Service Layer** for business logic (Search, Sync, Curation).
    - [ ] Define **Strategy Patterns** for swappable search backends and auth providers.
- [ ] **SEO Strategy**: Design the static generation (SSG/ISR) layout for individual ISO pages to maximize search engine indexing.
- [ ] **Perceptual Hashing**: Investigate image/binary comparison algorithms for duplicate detection.

## 🛠️ Work On (Technical Implementation)

### 📥 Data Ingestion & Sync
- [ ] **Production Drive API**: Replace mock Drive service with real OAuth/Service Account integration.
- [ ] **Sync Engine**: Implement the bidirectional sync between Drive storage and the Postgres metadata warehouse.
- [ ] **Hashing Worker**: Build the actual "Drone" service for checksum calculation and verification.
- [ ] **Duplicate Detection**: Implement perceptual hashing and filename analysis for incoming files.
- [ ] **Quarantine Workflow**: Implement system for items that fail quality/security validation (See `requirements.md`).

### 🔍 Search & UI
- [ ] **Advanced Search**: Migrate from basic SQL ILIKE to a full-featured search engine (Algolia or Elasticsearch).
- [ ] **Faceted Filtering**: Build the UI for multi-select facets (Distro Family, Arch, Edition, Desktop Environment).
- [ ] **Detail Pages**: Implement rich metadata views for individual ISOs with deep links and related variants.
- [ ] **Search Excellence**: Implement fuzzy matching, typo tolerance, and autocomplete in the search bar.
- [ ] **Search Analytics**: Implement tracking for popular content, search patterns, and conversion funnels.

### 🛡️ Curator Experience
- [ ] **Metadata Editor**: Build the UI for curators to manually refine parsed metadata.
- [ ] **Curation Workflows**: Implement revision history, diff tracking, and peer review status.
- [ ] **Audit Trail**: Implement immutable audit logging for all administrative and moderation actions.
- [ ] **Reputation Visualization**: Add profile pages or badges to display curator milestones and contributions.

### 📦 Infrastructure & Performance
- [ ] **Edge Optimization**: Implement multi-tier caching (Edge -> Redis -> DB) for read-heavy routes.
- [ ] **Storage Proxy**: Build a worker to proxy Drive downloads and bypass per-file rate limits.
- [ ] **Observability**: Set up Prometheus monitoring and Grafana dashboards for system health.
- [ ] **Deployment**: Automate infrastructure management with Terraform and GitHub Actions.

### 📦 File Delivery & Verification
- [ ] **Torrent Pipeline**: Implement automated `.torrent` and magnet generation with WebSeed support.
- [ ] **Security Scanning**: Integrate VirusTotal or ClamAV API for automated malware detection in the staging area.
- [ ] **GPG Logic**: Implement automated GPG signature verification for official distro releases.
- [ ] **Resumable Downloads**: Add support for range requests and resumable download sessions for large binaries.

## 🚀 Wish List / Future Horizon (Backlog)

- [ ] **ISO Deep-Dive**:
    - [ ] Advanced metadata extraction (auto-detect OS, kernel version, init system from within the image).
    - [ ] Automated screenshot generation of boot screens/desktops.
    - [ ] Integration with package repositories to display internal contents (e.g., LibreOffice version) per ISO.
- [ ] **Community & Social**:
    - [ ] User-contributed tags, descriptions, and ratings/reviews.
    - [ ] Contributor leaderboards (top uploaders, top reviewers).
    - [ ] User "wish list" for missing ISOs to be fulfilled by the community.
- [ ] **Advanced Delivery**:
    - [ ] Delta/Incremental ISO patching (download only changes between versions).
    - [ ] Browser-based virtualized previews (boot ISO in-browser via QEMU/v86).
    - [ ] Automated changelog generation between version releases.
- [ ] **Architecture & Ops**:
    - [ ] ISO-to-cloud deployment tools (launch VM directly to AWS/GCP/Azure).
    - [ ] **GraphQL API**: Build a developer portal with documentation for third-party developer integrations.
- [ ] **Webhook System**: Implement an outbound webhook system for external status notifications.
- [ ] **Automated license detection** for compliance auditing.

## 📈 Success Metrics & Operational Goals (from Blueprint)

- [ ] **Performance Audit**: Ensure 95% of search queries return in <200ms.
- [ ] **Availability Audit**: Target 99.9% system uptime and 99.5% API success rate.
- [ ] **Mobile Experience**: Optimize for the goal of 30% mobile traffic within 6 months.
- [ ] **Community Velocity**: Aim for a 48-hour average turnaround for curation reviews.
- [ ] **Cost Efficiency**: Monitor infrastructure to keep costs <$500/month for first 100K ISOs.
- [ ] **Contributor Onboarding**: Implement mentorship matching and guided workflows for new curators.
- [ ] **Consensus Tools**: Build discussion pages and consensus-building mechanisms for metadata conflicts.

## 📏 Code Style & Standards (from nextjs.mdc)

- [ ] **Naming Conventions**:
    - [ ] Enforce **kebab-case** for directories and files.
    - [ ] Use **PascalCase** for React components and types.
    - [ ] Use **camelCase** for variables, functions, and hooks.
- [ ] **Architecture Standards**:
    - [ ] Prefer `interface` over `type` for extension.
    - [ ] Avoid `any`; use `unknown` or generics for type safety.
    - [ ] Avoid `enums`; use `const` maps for better tree-shaking.
    - [ ] Maintain **Early return** pattern and keep functions ≤20 LOC.
- [ ] **Validation & Errors**:
    - [ ] Implement **Zod** for all runtime schema validation (API & Forms).
    - [ ] Integrate **Sentry** for comprehensive error logging (Server & Client).
- [ ] **UI Performance**:
    - [ ] Use `next/image` with WebP/AVIF and explicit sizes.
    - [ ] Implement `next/dynamic` + `Suspense` for heavy client components.
