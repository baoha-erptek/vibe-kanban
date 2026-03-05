<!-- Generated: 2026-03-02 | Files scanned: 120+ | Token estimate: ~950 -->

# Backend Architecture

## Server Startup (crates/server/src/main.rs)

```
1. Install rustls crypto provider
2. Init Sentry error tracking
3. Setup tracing (env-based filters)
4. Create asset dir (~/.vibe-kanban/assets/)
5. Init DB + run SQLx migrations
6. Create LocalDeployment (all services)
7. Cleanup orphan executions
8. Prewarm executor cache (async)
9. Build Axum router
10. Bind port (auto-assign or BACKEND_PORT)
11. Spawn relay tunnel
12. Start main + preview proxy servers
13. Graceful shutdown (Ctrl+C / SIGTERM)
```

## API Routes (crates/server/src/routes/)

```
/ (GET)                    → serve_frontend_root (SPA)
/{*path} (GET)             → serve_frontend (SPA fallback)
/api/
├── relay_auth::router()   → relay authentication
├── health (GET)           → health_check
├── config/*               → app configuration CRUD
├── containers/*           → container/workspace info
│   ├── info (GET)         → get container info
│   └── attempt-context    → full workspace context
├── task-attempts/*        → workspace CRUD + execution (50+ endpoints)
│   ├── / (GET)            → list workspaces
│   ├── /{id} (GET/PUT/DELETE) → workspace CRUD
│   ├── /{id}/run-agent-setup  → setup executor
│   ├── /{id}/start-dev-server → start dev server
│   ├── /{id}/merge        → merge branch
│   ├── /{id}/push[/force] → push branch
│   ├── /{id}/rebase[/continue] → rebase ops
│   ├── /{id}/pr           → create/attach PR
│   ├── /{id}/diff/ws      → WebSocket diff stream
│   ├── /{id}/stop         → stop execution
│   ├── create-and-start   → create workspace + run
│   └── stream/ws          → WebSocket workspace stream
├── execution-processes/*  → execution tracking
├── sessions/*             → executor session management
│   ├── / (GET/POST)       → list/create sessions
│   ├── /{id}/queue/*      → session queue ops
│   └── /{id}/review/*     → code review ops
├── repo/*                 → repository management
│   ├── / (GET)            → list repos
│   ├── recent (GET)       → recently used
│   ├── register (POST)    → register repo path
│   ├── init (POST)        → init new repo
│   ├── /{id}/branches     → list branches
│   ├── /{id}/remotes      → list remotes
│   ├── /{id}/search       → file search
│   └── /{id}/prs          → open pull requests
├── tags/*                 → tag CRUD
├── oauth/*                → OAuth handoff/completion
├── organizations/*        → org management
├── filesystem/*           → file read/write
├── events/*               → event streaming
├── approvals/*            → approval workflows
├── scratch/*              → scratch pad notes
├── search/*               → cross-repo search
├── migration/*            → data migration ops
├── terminal/*             → terminal WebSocket
├── images/*               → container images
└── remote/*               → cloud sync routes
    ├── issue-assignees, issues, projects
    ├── project-statuses, pull-requests
    ├── tags, workspaces
    └── issue-relationships, issue-tags
```

## Service Layer (crates/services/src/services/)

| Service | File | Responsibility |
|---------|------|---------------|
| ContainerService | container.rs | Workspace execution, diffs, git ops (trait) |
| WorkspaceManager | workspace_manager.rs | Workspace lifecycle |
| WorktreeManager | worktree_manager.rs | Git worktree creation/deletion |
| ExecutionProcess | execution_process.rs | Execution tracking |
| DiffStream | diff_stream.rs | Streaming file diffs via WS |
| EventService | events.rs | Real-time event streaming (MsgStore) |
| FilesystemService | filesystem.rs | File read/write |
| FilesystemWatcher | filesystem_watcher.rs | Directory change watching |
| FileSearchService | file_search.rs | Full-text search + caching |
| ImageService | image.rs | Docker/container images |
| RepoService | repo.rs | Repository discovery/registration |
| ConfigService | config.rs | App config (v1→v8 migrations) |
| AuthContext | auth.rs | Authentication context |
| Approvals | approvals.rs | User approval workflows |
| PRMonitor | pr_monitor.rs | Pull request status monitoring |
| RemoteClient | remote_client.rs | HTTP client to cloud server |
| RemoteSync | remote_sync.rs | Remote workspace sync |
| Analytics | analytics.rs | Telemetry |
| Notification | notification.rs | WebSocket notifications |
| QueuedMessage | queued_message.rs | Message queueing |

## Executors (crates/executors/src/)

**Supported agents:** ClaudeCode, Amp, Gemini, Codex, Opencode, CursorAgent, QwenCode, Copilot, Droid

**Key modules:** profile (config), actions (commands), logs (normalization), approvals, env, command, mcp_config, model_selector, executor_discovery

## Crate Dependency Graph

```
server
├── local-deployment (impl Deployment trait)
│   ├── services (business logic)
│   │   ├── db (SQLite models)
│   │   ├── git (git2 wrapper)
│   │   ├── git-host (GitHub/Azure)
│   │   ├── executors (agent interface)
│   │   └── utils
│   ├── relay-control + relay-tunnel
│   ├── trusted-key-auth (SPAKE2)
│   └── server-info
├── deployment (abstract trait)
├── api-types (shared types → TS)
└── utils

remote (separate workspace)
├── api-types
└── custom modules (shapes, mutations, billing, auth)
```

## Handler Pattern

```rust
pub async fn handler(
    State(deployment): State<DeploymentImpl>,
    Path(id): Path<Uuid>,
    Json(body): Json<RequestStruct>,
) -> Result<ResponseJson<ApiResponse<T>>, ApiError>
```
