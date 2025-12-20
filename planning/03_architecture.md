# System Architecture

## High Level Data Flow

```mermaid
graph TD
    User[User / Seeker] -->|Search & Browse| CDN[Cloudflare Pages (Next.js)]
    User -->|Download| GDrive[Google Drive (Via Proxy)]
    
    CDN -->|API Calls (tRPC)| API[Hono Worker / Backend]
    
    API -->|Read/Write| DB[(PostgreSQL)]
    API -->|Search Query| Algolia[Algolia Search Index]
    
    subgraph "Ingestion & Sync Pipeline"
        DriveSync[Sync Worker/Cron] -->|Poll Changes| GDrive
        DriveSync -->|Update Metadata| DB
        DriveSync -->|Push Index| Algolia
    end
    
    subgraph "Contribution Flow"
        Contributor -->|Auth (Keycloak)| API
        Contributor -->|Edit Metadata| API
        API -->|Update| DB
        DB -->|Trigger Re-index| Algolia
    end
```

## Component Breakdown

### 1. Ingestion & Hashing Pipeline
*   **The "Drone" (Hetzner VPS)**:
    *   Since Cloudflare Workers cannot process 30TB of hashing, we use a dedicated VPS.
    *   **Task**: Mounts Google Drive (Rclone), streams files, calculates SHA256, and extracts metadata.
    *   **Output**: Pushes metadata + Hash to the `Staging` table in Postgres.

### 2. The Sync Engine
*   **Role**: Keeps the Database in sync using the "Decoupled" Linkage strategy.
*   **Logic**:
    1.  **Poll**: Recursive scan of Drive folders.
    2.  **Match**: Link `drive_id` to DB records.
    3.  **New File**: Trigger the "Drone" to process/hash it.

### 3. The Search Indexer
*   **Role**: Ensures Algolia reflects the "Live" database state.
*   **Trigger**: Database Events or API hooks.
*   **Payload**: Syncs only searchable fields (Name, Distro, Version, Tags) to Algolia to keep record size low.

### 4. The ISO Proxy & Public Torrent Swarm
*   **Proxy Worker**: Streams response from Drive.
*   **Public Tracker**:
    *   System generates standard `.torrent` files with WebSeed support (pointing to the Proxy).
    *   **Type**: Public (Open Trackers + DHT). No private passkeys needed for MVP.
    *   **Goal**: Offload bandwidth from Drive to the swarm.

## Data Model (Simplified)

### `Distros`
*   `id`: UUID
*   `slug`: "ubuntu", "arch"
*   `name`: "Ubuntu"
*   `family`: "Linux" (Enum)
*   `type`: "STANDARD" | "EXPERIMENTAL"

### `Isos`
*   `id`: UUID
*   `distro_id`: FK -> Distros
*   `filename`: String (Original filename on Drive)
*   `drive_id`: String (Google Drive File ID)
*   `checksum`: String (SHA256)
*   `version`: String ("22.04")
*   `arch`: String ("amd64")
*   `status`: Enum ("STAGING", "LIVE", "REJECTED")
*   `confidence_score`: Int (0-100)
*   `metadata`: JSONB (Flexible fields: kernel_ver, package_lists, experimental_tags)

### `Profiles` (ATL Curator Identity)
*   `id`: Int (Primary Key)
*   `userId`: String (Unique, Keycloak ID)
*   `reputation`: Int (Trust score, default 10)
*   `updatedAt`: Timestamp
