<!-- Generated: 2026-03-02 | Files scanned: 75+ | Token estimate: ~700 -->

# Data Architecture

## Local Database: SQLite (crates/db/)

**Path:** `~/.vibe-kanban/db.v2.sqlite`
**Pool:** max_connections=64, journal_mode=DELETE

### Core Tables

```
workspaces (primary entity)
├── id: UUID PK
├── task_id: UUID FK → tasks (nullable)
├── container_ref: TEXT (worktree/container path)
├── branch: TEXT (nullable)
├── agent_working_dir: TEXT (nullable)
├── setup_completed_at, created_at, updated_at
├── archived: BOOL, pinned: BOOL
└── name: TEXT (nullable)

workspace_repos (many-to-many)
├── id: UUID PK
├── workspace_id: UUID FK → workspaces
├── repo_id: UUID FK → repos
└── target_branch: TEXT

repos (git repositories)
├── id: UUID PK
├── path: TEXT UNIQUE (filesystem path)
└── name: TEXT

execution_processes (AI agent runs)
├── id: UUID PK
├── workspace_id: UUID FK → workspaces
├── executor_type: TEXT (CLAUDE_CODE, AMP, GEMINI...)
├── status: TEXT (RUNNING, COMPLETED, FAILED)
└── executor_action: TEXT (JSON)

execution_process_logs (streaming output)
├── id: UUID PK
├── execution_process_id: UUID FK
├── log_sequence: INTEGER
├── raw_log_line: TEXT
└── parsed_line: TEXT (normalized)

execution_process_repo_state (git snapshots)
├── execution_process_id: UUID FK
├── repo_id: UUID FK → repos
├── branch_before/after: TEXT
└── commit_before/after: TEXT

coding_agent_turns (conversation)
├── execution_process_id: UUID FK
├── turn_sequence: INTEGER
├── user_message: TEXT
└── assistant_message: TEXT

sessions (executor sessions)
├── id: UUID PK
├── workspace_id: UUID FK
└── executor: TEXT

tags             → id, name, color
images           → id, workspace_id, image_data (BLOB)
merges           → id, workspace_id, pr_number, pr_url, status
tasks            → parent task definitions
scratch          → scratch pad notes
migration_state  → data migration tracking
```

### Entity Relationships

```
tasks 1──N workspaces 1──N workspace_repos N──1 repos
                      1──N execution_processes 1──N execution_process_logs
                                              1──N execution_process_repo_state
                                              1──N coding_agent_turns
                      1──N sessions
                      1──N images
                      1──N merges
                      N──M tags (via workspace_tags)
```

## Remote Database: PostgreSQL (crates/remote/)

**Engine:** PostgreSQL 16 + ElectricSQL sync
**Tables:** projects, workspaces, issues, issue_assignees, issue_comments, issue_comment_reactions, issue_followers, issue_relationships, issue_tags, pull_requests, tags, users, organizations, organization_members, notifications, relay_hosts, relay_sessions, attachments, blobs, oauth_accounts

## Migrations

**Local:** 59 migrations (crates/db/migrations/)
- `20250617_init.sql` → Initial schema
- `20250620_execution_processes.sql` → Execution tracking
- `20250729_create_execution_process_logs.sql` → Log streaming
- `20251201_rename_tasks_to_workspaces.sql` → Task→Workspace refactor
- `20251209_electric_migration.sql` → ElectricSQL support
- Latest: `20260220_*` (Feb 2026)

**Remote:** Separate PostgreSQL migrations in crates/remote/

## Type Generation Pipeline

```
Rust structs (#[derive(TS)])
  → ts-rs (custom fork)
    → shared/types.ts (local, ~40KB)
    → shared/remote-types.ts (remote, ~16KB)
```

**Commands:** `pnpm run generate-types` | `pnpm run remote:generate-types`

## SQLx Query Pattern

```rust
sqlx::query_as!(
    Workspace,
    "SELECT id, task_id, ... FROM workspaces WHERE id = ?"
).bind(workspace_id).fetch_optional(pool).await?
```

Compile-time checked via `pnpm run prepare-db` (offline mode).
