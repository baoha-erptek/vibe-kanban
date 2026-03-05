<!-- Generated: 2026-03-02 | Files scanned: 30+ | Token estimate: ~800 -->

# Dependencies & External Services

## External Services

| Service | Purpose | Config Vars |
|---------|---------|-------------|
| GitHub | OAuth, App integration, PRs | GITHUB_OAUTH_*, GITHUB_APP_* |
| Google | OAuth login (remote) | GOOGLE_OAUTH_* |
| PostHog | Product analytics | POSTHOG_API_KEY, POSTHOG_API_ENDPOINT |
| Sentry | Error tracking | SENTRY_DSN, SENTRY_DSN_REMOTE |
| Stripe | Billing/subscriptions | STRIPE_SECRET_KEY, STRIPE_*_PRICE_ID |
| Loops | Email delivery | LOOPS_EMAIL_API_KEY |
| Azure Storage | File attachments (dev: Azurite) | AZURE_STORAGE_* |
| AWS S3/R2 | PR review artifacts | R2_ACCESS_KEY, R2_BUCKET |
| ElectricSQL | Real-time data sync | ELECTRIC_URL |
| PostgreSQL | Remote database | DATABASE_URL |

## Rust Workspace Dependencies

| Crate | Version | Purpose |
|-------|---------|---------|
| tokio | 1.0 (full) | Async runtime |
| axum | 0.8.4 | HTTP framework |
| sqlx | 0.8.6 | Type-safe SQL (SQLite+Postgres) |
| serde / serde_json | 1.0 | Serialization |
| tracing | 0.3 | Structured logging |
| git2 | 0.20.3 | Git operations (libgit2) |
| reqwest | 0.12 | HTTP client |
| ts-rs | custom fork | Rust→TypeScript type generation |
| ed25519-dalek | - | Cryptographic signatures |
| tower-http | - | HTTP middleware (CORS, etc.) |
| rust-embed | - | Static asset embedding |
| tokio-tungstenite | custom fork | WebSocket (proxy support) |

## Frontend Dependencies

**Build:**
| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 7.3.1 | Build tool |
| React | 18.2.0 | UI framework |
| TypeScript | 5.9.2 | Type system |
| TailwindCSS | 3.4.0 | Utility CSS |
| ESLint + Prettier | - | Linting/formatting |

**Core:**
| Package | Purpose |
|---------|---------|
| @tanstack/react-query | Server state management |
| @tanstack/react-router | File-based routing |
| @tanstack/react-form | Form management |
| zustand | Client state stores |
| zod | Schema validation |
| i18next | Internationalization |

**UI Components:**
| Package | Purpose |
|---------|---------|
| Radix UI | Primitives (dialog, dropdown, popover, tooltip, etc.) |
| cmdk | Command palette |
| framer-motion | Animations |
| @hello-pangea/dnd, @dnd-kit | Drag & drop |
| react-resizable-panels | Resizable layouts |
| Lexical | Rich text editor |
| @uiw/react-codemirror | Code editor |
| @git-diff-view/react | Diff viewer |
| react-virtuoso | Virtualized lists |
| @xterm/xterm | Terminal emulation |

**Utilities:**
| Package | Purpose |
|---------|---------|
| posthog-js | Analytics |
| @sentry/react | Error tracking |
| jwt-decode | JWT parsing |
| nice-modal-react | Modal management |
| react-hotkeys-hook | Keyboard shortcuts |
| react-dropzone | File upload |
| react-use-websocket | WebSocket hooks |
| rfc6902 | JSON Patch |

## Infrastructure

**Build:** Rust nightly-2025-12-04, Node 22, pnpm 10.13.1
**Runtime:** Alpine Linux (local Docker), Debian Bookworm (remote Docker)
**CI:** GitHub Actions (blacksmith-16vcpu runner, sccache)

**Docker services (remote dev):**
| Service | Image | Port |
|---------|-------|------|
| remote-db | postgres:16-alpine | 5433 |
| azurite | azure-storage/azurite | 10000 |
| electric | electricsql/electric:1.3.3 | 65432 |
| remote-server | custom | 8081 |
| relay-server | custom | 8082 |

## Distribution

**Local:** npx CLI with cross-platform binary download
- Platforms: linux-x64/arm64, windows-x64/arm64, macos-x64/arm64
- Cache: ~/.vibe-kanban/
- Auto-update with version cleanup

**Remote:** Docker multi-stage builds
- Frontend builder → Backend builder → Minimal runtime
- Health checks on /v1/health and /health

## Key Environment Variables

```
# Local
BACKEND_PORT, FRONTEND_PORT, HOST, PREVIEW_PROXY_PORT
RUST_LOG (default: info)

# Remote
SERVER_DATABASE_URL, VIBEKANBAN_REMOTE_JWT_SECRET
PUBLIC_BASE_URL, SERVER_LISTEN_ADDR (0.0.0.0:8081)
RELAY_LISTEN_ADDR (0.0.0.0:8082)
VK_ALLOWED_ORIGINS (CORS)

# Frontend (Vite)
VITE_RELAY_API_BASE_URL, VITE_PUBLIC_REACT_VIRTUOSO_LICENSE_KEY
```

## CI/CD Workflows (.github/workflows/)

| Workflow | Purpose |
|----------|---------|
| test.yml | Lint, format, types, clippy, tests (PR/push) |
| publish.yml | npm publish (release) |
| remote-deploy-dev/prod.yml | Remote server deploys |
| relay-deploy-dev/prod.yml | Relay server deploys |
| remote-release.yml | Remote version bump |
| pre-release.yml | Pre-release creation |
