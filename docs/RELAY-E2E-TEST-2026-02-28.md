# Vibe Kanban Relay E2E Test Report — 2026-02-28

## Test Objective

Verify the complete relay infrastructure works end-to-end: browser at vibenwf.erptek.net can create and manage workspaces on a local VK client through the relay tunnel.

## Test Result: PASS

All 5 relay layers verified operational. Workspace creation, issue linking, and real-time data sync confirmed working.

---

## Architecture Verified

```
Browser (vibenwf.erptek.net)
  ↓ Ed25519 signed HTTPS requests
Nginx (192.168.1.242, SSL termination, WebSocket proxy)
  ↓
relay-server (Docker remote-relay-server-1, port 8082)
  ↓ yamux multiplexed tunnel
VK Client (headless binary v0.1.20, auto-assigned port)
  ↓
Local filesystem (hr_project worktrees)
```

Data sync path (separate from relay):
```
VK Client → POST /v1/workspaces/sync → Remote Server → PostgreSQL
  ↓ Electric SQL publication
Browser (local SQLite via Electric)
```

---

## Fixes and Changes Made During Testing

### 1. Signing Session Persistence (Feature)

**Problem**: After VK client restart, the browser needed to re-pair because the signing session ID was lost.

**Changes**:
- `crates/trusted-key-auth/src/trusted_keys.rs`: Added `signing_session_id: Option<String>` to `TrustedRelayClient` struct
- `crates/server/src/routes/relay_auth.rs`: Persist signing session ID when saving trusted client records
- `crates/relay-control/src/signing.rs`: Refactored signing session creation to support custom session IDs; extended TTL from 1 hour to 7 days
- `crates/local-deployment/src/lib.rs`: Implemented automatic signing session restoration on VK client startup — reads `signing_session_id` from trusted keys file and calls `restore_or_create_session()`

**Result**: VK client restarts no longer require browser re-pairing.

### 2. Timestamp Drift Tolerance (Fix)

**Problem**: Relay signature verification failed intermittently due to clock drift between browser and server.

**Change**: `crates/relay-control/src/signing.rs` — Increased allowed timestamp drift from 30 seconds to 5 minutes.

**Result**: Eliminated intermittent relay authentication failures.

### 3. JWT Secret Base64 Encoding Discovery (Critical Finding)

**Problem**: Manually generated JWT tokens were rejected by the remote server with `invalid_token`.

**Root Cause**: The Rust `jsonwebtoken` crate uses `DecodingKey::from_base64_secret()` which base64-decodes the secret before using it as the HMAC key. PyJWT was using the raw base64 string directly as the key, producing a different HMAC signature.

**Source**: `crates/remote/src/auth/jwt.rs:223`
```rust
let decoding_key = DecodingKey::from_base64_secret(self.secret.expose_secret())?;
```

**Fix**: When generating tokens with PyJWT:
```python
import base64, jwt
secret_bytes = base64.b64decode(secret_b64)  # Decode FIRST
token = jwt.encode(payload, secret_bytes, algorithm="HS256")
```

### 4. Token Refresh Endpoint Discovery

**Problem**: Multiple endpoints attempted for token refresh, all failing.

| Endpoint | Result |
|----------|--------|
| `POST /api/auth/refresh` (remote server) | 404 "only available on local VK client" |
| `POST /api/auth/refresh` (VK client) | 405 Method Not Allowed |
| `POST /v1/tokens/refresh` (remote server) | **SUCCESS** |

**Source**: `crates/services/src/services/remote_client.rs:234-257`

### 5. VK Client Credential Behavior (Discovery)

**Behavior documented**:
- On startup, VK client reads `~/.local/share/vibe-kanban/credentials.json`
- Calls `POST /v1/tokens/refresh` on the remote server
- **On auth failure: DELETES credentials.json** and stays logged out
- On success: saves the rotated refresh token, initiates relay tunnel
- Service uses port 0 (auto-assigned) — port changes every restart

### 6. Docker Compose Debug Logging (Change)

**Change**: `crates/remote/docker-compose.yml` — Set `RUST_LOG=debug` for relay-server container to aid WebSocket tunnel debugging.

---

## Browser Storage Architecture

| Storage | Location | Data |
|---------|----------|------|
| Auth tokens | IndexedDB `rf-auth` → `tokens` store | `access_token`, `refresh_token` keys |
| Relay pairing | IndexedDB `vk-relay-pairing` → `paired_hosts` store | Ed25519 keypair, host info, signing session ID (keyed by `host_id`) |
| Active host | localStorage `vk-active-relay-host-id` | UUID of currently active relay host |

Source: `packages/web-core/src/shared/lib/relayPairingStorage.ts`

## Relay Request Routing

The React app intercepts API calls via `requestLocalApiViaRelay()` in `packages/remote-web/src/shared/lib/relayHostApi.ts`.

**Routing rules**:
- Paths starting with `/api/` → relayed (EXCEPT `/api/remote/`)
- Relay only active when `vk-active-relay-host-id` is set in localStorage
- On workspace pages, host ID can also come from URL search params
- Raw `fetch()` / `XMLHttpRequest` from console BYPASS the relay

**Relay URL pattern**:
```
https://vibenwf.erptek.net/relay/h/{host_id}/s/{signing_session_id}/api/{path}
```

## Data Sync

Workspace data flows through Electric SQL (PostgreSQL → browser), NOT through the relay REST API:
- Remote DB `workspaces` table is part of `electric_publication_default`
- Electric SQL container: `remote-electric-1` (ElectricSQL v1.3.3)
- Fallback REST endpoint: `GET /v1/fallback/project_workspaces?project_id=...`

---

## Test Artifacts

| File | Description |
|------|-------------|
| `artifacts/25-workspace-created.png` | First workspace creation confirmation |
| `artifacts/26-issue-workspaces-check.png` | Both workspaces visible in issue panel |
| `artifacts/27-workspace-detail.png` | Workspace detail view with branch info |
| `artifacts/28-relay-e2e-complete.png` | Final E2E verification — full workspace UI |

## Infrastructure State (Post-Test)

| Component | Status | Details |
|-----------|--------|---------|
| VK Client | Running | v0.1.20, systemd service, relay connected |
| Remote Server | Running | Docker `remote-remote-server-1`, port 3000 |
| Relay Server | Running | Docker `remote-relay-server-1`, port 8082 |
| Electric SQL | Running | Docker `remote-electric-1`, healthy |
| Remote DB | Running | Docker `remote-remote-db-1`, port 5433 |
| Test workspaces | Archived | All 7 test workspaces archived, worktrees removed |
| Test branches | Deleted | `vk/75ec-*`, `vk/7984-*`, `vk/6264-*` removed |

## Key IDs (for reference)

| Entity | ID |
|--------|----|
| User | `1fd1f111-6c8a-4d40-a059-4088e1d24d2d` (baoha-erptek) |
| Host | `924d7827-06e2-4bc4-bb65-4678d7b213ee` |
| Project | `dbad9b37-a4a6-47dd-b68a-59f1fb992dfb` |
| Issue (VIBE-16) | `32070083-1429-4b90-b56a-dd079c4cc8a8` |
| Auth Session | `4b5f5987-9e71-4138-86d8-a9b68efe05ce` |
