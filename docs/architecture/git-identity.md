---
status: settled
tags: [feature/git, area/server, area/web]
---

# Git identity in the dashboard

The dashboard is a first-class client for the workspace's git state: it
detects whether the project is a git repository, displays the identity that
commits would use, lets the user edit local `user.name` / `user.email`, and
can run `git init` from the UI when the workspace is not yet a repo.

## Capability boundary

- **Local scope only.** `--global` is never written from the dashboard.
  Users who want a fallback identity set it once outside the app.
- **No commit creation.** `git init` does not make an initial commit —
  branch name, gitignore, and first content are user decisions.
- **Read-only identity display for effective values.** The chip and
  modal show the resolved chain (`local > global > system`) but can only
  mutate the local scope.

## Endpoints

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/git/status` | `{ isRepo, root?, headBranch?, hasCommits?, reason? }` | local |
| GET | `/api/git/config` | `{ effective, local }` — requires `isRepo` | local |
| POST | `/api/git/config` | Write `--local user.name` / `user.email`; empty string → unset | local + CSRF |
| POST | `/api/git/init` | Idempotent `git init` in project root | local + CSRF |

`hasCommits` is `true` iff `git rev-parse --verify HEAD` succeeds; the
modal uses it to warn before a would-fail worktree Start (which needs a
HEAD to branch from).

WebSocket: `{ type: "git-status-updated", gitStatus }` fires after any
successful mutation.

## Shell scope

The header chip and identity modal mount only in the **local-server** and
**Electron** shells. The **VS Code extension** shell delegates to VS
Code's own Source Control panel — mounting our chip there would compete
with a first-class native affordance. Detection combines `typeof
window.acquireVsCodeApi === "function"` (top-level webview) with a
`?vscode=1` URL flag (nested iframe, where the React app actually runs
and `acquireVsCodeApi` is not injected) in `web/src/runtime/shell.ts`.

## Interaction with agent-runner (worktrees)

`git worktree add` requires a git repository. The Start flow itself no
longer gates on `gitStatus.isRepo` — the dispatcher skill runs
`git worktree add` in the embedded terminal and surfaces any failure
there. The UI's pre-flight signals today are:

- The chip's warning dot when `!isRepo`.
- The modal's warning banner when `!hasCommits`
  ("Worktree-mode Start needs a HEAD to branch from") — see
  `web/src/components/GitIdentityModal.tsx`.
- The modal's one-click `git init` to unblock a non-repo workspace.

## Source layout

| Path | Role |
|---|---|
| `server/git/status.ts` | `.git` fast-path + `git rev-parse` detection |
| `server/git/config.ts` | `--show-scope --get` parsing + serialized local writes |
| `server/git/init.ts` | Idempotent `git init`, re-reads status after |
| `server/index.ts` | Four endpoints + WS `git-status-updated` |
| `web/src/runtime/shell.ts` | `isVsCodeShell()` — the one shell branch |
| `web/src/components/GitIdentityChip.tsx` | Header chip |
| `web/src/components/GitIdentityModal.tsx` | Modal (two states) |
