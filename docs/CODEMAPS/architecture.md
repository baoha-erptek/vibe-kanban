<!-- Generated: 2026-03-02 | Files scanned: 300+ | Token estimate: ~900 -->

# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Vibe Kanban                       │
│   AI-powered workspace management & kanban board     │
├──────────────────┬──────────────────────────────────┤
│   LOCAL MODE     │        REMOTE/CLOUD MODE         │
│                  │                                  │
│  local-web (Vite)│  remote-web (Vite)               │
│       ↓          │       ↓                          │
│  server (Axum)   │  remote (Axum)                   │
│       ↓          │       ↓                          │
│  SQLite          │  PostgreSQL + ElectricSQL        │
│                  │       ↓                          │
│                  │  relay-tunnel (WebSocket)         │
└──────────────────┴──────────────────────────────────┘
```

## Monorepo Layout

```
vibe-kanban/
├── crates/                    # Rust workspace (17 crates + 2 excluded)
│   ├── server/                # Local Axum HTTP server (entry point)
│   ├── db/                    # SQLite models + 59 migrations (SQLx)
│   ├── api-types/             # Shared API types (→ TS via ts-rs)
│   ├── services/              # Business logic (38 service modules)
│   ├── executors/             # AI agent executors (Claude, Amp, Gemini, etc.)
│   ├── deployment/            # Abstract Deployment trait
│   ├── local-deployment/      # Local impl of Deployment
│   ├── git/                   # git2-rs wrapper (branch, merge, diff, worktree)
│   ├── git-host/              # GitHub/Azure DevOps provider abstraction
│   ├── relay-control/         # Tunnel lifecycle management
│   ├── relay-tunnel/          # WebSocket tunnel (excluded workspace)
│   ├── remote/                # Cloud server (excluded workspace, Postgres)
│   ├── review/                # CLI tool for PR review
│   ├── mcp/                   # Model Context Protocol server
│   ├── trusted-key-auth/      # SPAKE2 auth framework
│   ├── server-info/           # Runtime port/hostname
│   └── utils/                 # 23 shared utility modules
├── packages/
│   ├── local-web/             # Local React app (Vite + TanStack Router)
│   ├── remote-web/            # Remote React app (lighter, relay-based)
│   ├── web-core/              # Shared React library (85+ hooks, providers)
│   ├── ui/                    # UI component library (Radix, Lexical)
│   └── public/                # Static assets (logos, icons)
├── shared/                    # Generated TS types (types.ts, remote-types.ts)
├── scripts/                   # Dev helpers (ports, DB prep, i18n check)
├── npx-cli/                   # npm CLI package (cross-platform binary download)
└── docs/                      # Mintlify documentation
```

## Data Flow

```
User → Browser
  → local-web / remote-web (React + TanStack)
    → API client (shared/lib/api.ts)
      → /api/* routes (Axum)
        → Route handlers (State extraction)
          → Services layer (container, repo, git, events)
            → DB (SQLx → SQLite/Postgres)
            → Git (git2-rs)
            → Executors (Claude, Amp, Gemini, Codex...)
              → Agent subprocess → workspace changes
        → WebSocket streams (diffs, logs, events)
          → JSON Patch → React Query invalidation
```

## Key Architectural Patterns

| Pattern | Usage |
|---------|-------|
| Trait-based abstraction | `Deployment`, `ContainerService`, `GitHostProvider` |
| Service container | `LocalDeployment` aggregates all services |
| Async/await (Tokio) | All I/O, `RwLock` for shared state |
| WebSocket streaming | Diffs, logs, events via JSON Patch |
| Type generation | Rust → TypeScript via ts-rs (custom fork) |
| File-based routing | TanStack Router with `.gen` route tree |
| Layered state mgmt | TanStack Query + Zustand + React Context |

## Deployment Modes

| Mode | Server | Database | Sync | Distribution |
|------|--------|----------|------|-------------|
| Local | `crates/server` | SQLite | N/A | npx CLI binary |
| Remote | `crates/remote` | PostgreSQL | ElectricSQL | Docker (self-hosted or cloud) |
| Relay | `crates/relay-tunnel` | N/A | WebSocket tunnel | Docker |
