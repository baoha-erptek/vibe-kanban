<!-- Generated: 2026-03-02 | Files scanned: 200+ | Token estimate: ~950 -->

# Frontend Architecture

## Package Relationships

```
local-web ──┐
            ├──→ web-core (shared hooks, providers, pages)
remote-web ─┘         ↓
                      ui (component library)
                      ↓
                   shared/ (generated TS types from Rust)
```

## Provider Tree (local-web)

```
Bootstrap.tsx
  QueryClientProvider (TanStack)
    PostHogProvider (analytics)
      Sentry.ErrorBoundary
        App.tsx
          AppRuntimeProvider (runtime="local")
            UserSystemProvider (config/profiles)
              LocalAuthProvider
                ClickedElementsProvider
                  HotkeysProvider
                    RouterProvider (TanStack Router)
                      __root.tsx
                        I18nextProvider
                          ThemeProvider
                            WorkspaceProvider
                              ExecutionProcessesProvider
                                LogsPanelProvider
                                  ActionsProvider
                                    NiceModalProvider
                                      <Outlet /> (pages)
```

## Provider Tree (remote-web)

```
Bootstrap.tsx
  QueryClientProvider
    PostHogProvider
      RemoteAuthProvider (token-based, relay API)
        App.tsx
          AppRuntimeProvider (runtime="remote")
            RouterProvider
              __root.tsx
                UserProvider → RemoteWorkspaceProvider
                  → RemoteActionsProvider
                    → RemoteUserSystemProvider
                      → NiceModalProvider
                        → RemoteAppShell / <Outlet />
```

## Routes (local-web, file-based TanStack Router)

```
/                                    → redirect
/_app/
├── projects/$projectId              → ProjectKanban
│   └── issues/$issueId              → Issue detail panel
├── workspaces                       → WorkspacesLanding
│   └── $workspaceId                 → Workspace detail
│       └── vscode                   → VSCode integration
/onboarding                          → Onboarding flow
  └── sign-in                        → Sign-in page
```

## Routes (remote-web)

```
/                                    → redirect
/login                               → Login flow
  └── complete                       → OAuth completion
/account                             → Account settings
  └── organizations/$orgId           → Org management
/workspaces                          → Workspace list
  └── $workspaceId                   → Workspace detail
      └── vscode                     → VSCode integration
/projects/$projectId/issues/$issueId → Issue detail
/invitations/$token/accept           → Invitation accept
/upgrade                             → Billing upgrade
  └── complete                       → Upgrade completion
```

## State Management Stack

| Layer | Tool | Scope |
|-------|------|-------|
| Server state | TanStack React Query | API data, mutations |
| Route state | TanStack Router | URL params, search |
| Client state | Zustand | UI prefs, org, diff view, expandables |
| Feature state | React Context | Workspace, execution, git ops, process selection, review, changes, approval, tabs |
| Form state | TanStack Form + Zod | Validated forms |
| Real-time sync | ElectricSQL + wa-sqlite | Local DB sync |

## Key Pages (web-core/src/pages/)

```
kanban/
├── ProjectKanban.tsx             → Kanban board view
├── LocalProjectKanban.tsx        → Local-specific kanban
├── KanbanIssuePanelContainer.tsx → Issue detail panel
├── ProjectRightSidebarContainer  → Right sidebar
├── IssueCommentsSectionContainer → Comments
├── IssueWorkspacesSectionContainer → Linked workspaces
├── IssueRelationshipsSectionContainer → Related issues
└── IssueSubIssuesSectionContainer → Sub-issues

workspaces/
├── Workspaces.tsx / Layout / Landing → Workspace views
├── WorkspacesMainContainer       → Main content
├── WorkspacesSidebarContainer    → Sidebar
├── FileTreeContainer             → File browser
├── ChangesPanelContainer         → Git changes
├── PreviewBrowserContainer       → Live preview
├── ProcessListContainer          → Agent processes
├── WorkspaceNotesContainer       → Scratch notes
├── GitPanelContainer             → Git operations
├── LogsContentContainer          → Agent logs
├── ContextBarContainer           → Context bar
└── VSCodeWorkspacePage           → VSCode mode
```

## Shared Hooks (web-core/src/shared/hooks/, 85+)

**Auth:** useAuth, useCurrentUser, useAuthStatus, useAuthMutations
**Workspace:** useWorkspaceContext, useWorkspaces, useWorkspaceSessions
**Project:** useProjectContext, useOrganizationProjects
**Execution:** useExecutionProcesses, useAttemptExecution, useRetryProcess
**Git:** useGitOperations, useRepoBranches, usePush, useRebase, useMerge, useForcePush
**PR:** useGitHubComments, usePrComments
**Preview:** usePreviewUrl, usePreviewNavigation, usePreviewSettings
**Data:** useLogStream, useDiffStream, useJsonPatchWsStream
**Org:** useUserOrganizations, useOrganizationMembers, useOrganizationMutations
**UI:** useTheme, useIsMobile, usePageTitle, useCommandBarShortcut

## UI Library (packages/ui/)

**Components:** CommandBar, PreviewBrowser, ContextBar, SearchableDropdown, ChatMarkdown, ChatTodoList, IssueListView, FileTreeNode, WYSIWYGEditor (Lexical), AutoResizeTextarea, StatusDot, PropertyDropdown, Toggle, Toolbar, Alert, Tooltip

## Path Aliases

| Alias | Target |
|-------|--------|
| `@web` | packages/local-web/src |
| `@remote` | packages/remote-web/src |
| `@/` | packages/web-core/src/ |
| `shared` | shared/ |
