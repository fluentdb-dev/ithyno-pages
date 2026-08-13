# Technical Architecture

Technical design of ithyno. Assumes a **local browser-based dashboard** model and strict compliance with **OpenSpec**.

---

## 1. Goals and Non-Goals

### Goals
- Treat the OpenSpec `openspec/` directory as the sole source of truth and **visualize** progress.
- Support **bidirectional editing** (UI <-> file) of checkboxes in `tasks.md` from the dashboard UI.
- **Instantly reflect** external edits made by AI agents back to the UI.
- Keep markdown clean (do not embed custom HTML comments or proprietary dialects).

### Non-Goals (Out of Scope for v1)
- Strict mutual exclusion controls for multiple repositories, remote sync, or multi-user co-authoring.
- Replacing the CLI functionalities of OpenSpec itself (e.g., `openspec change`).
- Rich WYSIWYG editing of specification content (requirements/scenarios). Other write paths (execution mode, phase transitions, needs-human answers, agent dispatch, `agents.yaml`, `.openspec.yaml`) are handled by dedicated APIs — see §7.

---

## 2. Target OpenSpec Directory Structure

```
openspec/
  specs/
    [domain]/
      spec.md              # Active specification (source of truth)
  changes/
    [change-name]/
      proposal.md          # Why & what to change (## Intent / ## Scope / ## Approach)
      design.md            # Technical approach
      tasks.md             # Implementation checklist (core progress store)
      .openspec.yaml       # Sidecar metadata
      specs/
        [domain]/
          spec.md      # Delta specifications (## ADDED/MODIFIED/REMOVED)
    archive/
      [YYYY-MM-DD-change-name]/   # Completed changes
```

### Parse Target Formats

**tasks.md (The Core of Progress)**
```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [x] 1.2 Add CSS custom properties for colors

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
```
- Group logically using `## N. <section>`.
- Individual tasks defined as `- [ ] N.M <text>` or `- [x] N.M <text>`, using hierarchical numbering (e.g., 1, 1.1, 1.2).

**spec.md / delta spec**
```markdown
## Purpose
...
### Requirement: User Authentication
The system SHALL ...
#### Scenario: Valid credentials
- GIVEN ...
- WHEN ...
- THEN ...
```
Deltas use `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements`.

**proposal.md** — Contains `## Intent` / `## Scope` / `## Approach`.

---

## 3. System Architecture

A 3-tier architecture, completely self-contained locally.

| Layer | Role | Primary Technologies |
|---|---|---|
| **Client** | Dashboard rendering and interactions | Vite + React + TypeScript |
| **Server** | Parsing, surgical edits, and file watching | Node.js + Fastify + chokidar |
| **Store** | Source of truth | `.md` files under `openspec/` |

Designed so that the client and server can run inside a single process (where Fastify serves static assets) or through a Vite dev server + proxy setup during development.

### Data Flow

1. **Initial Load** — The server recursively scans `openspec/` -> Parses into a domain model -> Returns via REST `GET /api/state`.
2. **UI to File (Toggle)** — Checkbox clicked -> sends `POST /api/tasks/toggle` -> Server rewrites **only the target line** in `tasks.md` -> Saves.
3. **File to UI (External Edits)** — chokidar detects changes -> Parses diffs -> Pushes to all clients via WebSockets.

---

## 4. Technology Stack & Rationale

| Area | Technology | Rationale / Alternatives |
|---|---|---|
| Frontend | **React + TypeScript + Vite** | Type safety, HMR, rich ecosystem. Alternative: Svelte (lightweight, but prioritized developer familiarity). |
| Server | **Node.js + Fastify** | Language unification with frontend, lightweight, fast. Alternatives: Express (mature but slower), standalone Vite plugin (rejected as it complicates watching logic). |
| Markdown Parser | **unified / remark + remark-gfm** | Safely processes GFM task lists via AST. Retrieves position details (`position`), allowing accurate line identification. Alternatives: custom regex (too fragile, rejected). |
| File Watching | **chokidar** | Stable and cross-platform. Bypasses half-written file detections via `awaitWriteFinish`. |
| Real-time Sync | **WebSocket (`ws`)** | Bidirectional, low latency. Alternative: SSE (viable if server-to-client is sufficient, but WebSockets chosen for simplicity). |
| Client State | **Zustand** | Lightweight. Easy to replace state entirely on WebSocket events. Alternative: Redux (overkill). |
| UI | **Vanilla CSS with custom-property theming** | Semantic `--bg-*` / `--fg-*` variables under `[data-theme=light\|dark]` (see `web/src/styles.css`). No Tailwind, no drag-and-drop library. |
| CLI | **Node bin + `commander`** | Launches via `npx ithyno`. Also exposes `ithyno init` / `ithyno doctor` subcommands. |
| Distribution | **npm package** | Instantly executable via `npx ithyno`. |

---

## 5. Domain Model (Server Internal Representation)

The parsed result is represented as a normalized read-only model. **We do not re-serialize the entire Markdown from this model** (due to the synchronization policy described below).

The authoritative type definitions live in [`server/model.ts`](https://github.com/fluentdb-dev/ithyno/blob/main/server/model.ts). Rather than mirror the full shape (which has evolved with the phase-state-machine, worktrees, needs-human, doctor, git status, and agent-runner surfaces), the following excerpt captures **only the fields load-bearing for §6 (bidirectional sync)**:

```ts
// Excerpt — see server/model.ts for the full shape.
type WorkspaceState = {
  root: string;                 // Absolute path to openspec/
  specs: SpecDomain[];          // Active specifications
  changes: Change[];            // Active changes
  archive: ChangeSummary[];     // Completed changes (list only)
  // ...also: exists, gitStatus, lock, hasClaudeMd, hasAgentsYaml, generatedMarkerPresent
};

type Change = {
  id: string;                   // Directory name = change-name
  proposal: ProposalDoc | null; // Intent/Scope/Approach
  design: RawDoc | null;
  tasks: TaskList;
  deltaSpecs: SpecDomain[];
  progress: { done: number; total: number };
  // ...also: hasOutcome, phase, priorPhase, escalatedAt, needsHumanQuestion,
  //          worktree: { path, branch, tasksProgress }
};

type TaskList = {
  filePath: string;
  sections: TaskSection[];
  baseHash: string;             // File hash observed at parse time — sent back on toggle
  // ...also: parseError, raw
};

type TaskSection = { title: string; tasks: Task[] };

type Task = {
  id: string;        // E.g., "1.2"
  text: string;
  checked: boolean;
  line: number;      // 0-indexed line number in tasks.md (used for targeting edits)
  filePath: string;
  raw: string;       // Exact original line — used as expectedText for the line-shift fallback (6.2)
};
```

Retaining `line` (plus `raw` as the expected line text and `baseHash` as the file version) is key to bidirectional synchronization. Toggling from the UI sends "file path + line number + expected line text + observed file hash," and the server edits only that specific line.

---

## 6. Bidirectional Synchronization Design (Core of the Project)

This section directly addresses the main trade-offs raised in `idea.md`: "concurrent edit conflicts" and "markdown dialects."

### 6.1 Core Principle: "Surgical Edits" Instead of Full Serialization

We **do not regenerate and overwrite** `tasks.md` from the model on UI updates. Rationale:
- Full serialization destroys custom comments, empty lines, and formatting nuances written by AI agents, producing unnecessary diffs.
- It violates the design goal of "preserving markdown readability."

Instead, we replace **only the single checkbox character on the target line**.

```
Before: - [ ] 1.2 Add CSS custom properties for colors
After:  - [x] 1.2 Add CSS custom properties for colors
        ↑ Only this single character changes. No other bytes are touched.
```

Implementation: Reads the target file, replaces `- [ ]` <-> `- [x]` on the specific `line` using a **strict regular expression** exactly once, and writes it back. Indentations, task numbers, and body text remain unchanged.

**The regex must strictly capture only the checkbox marker**. Rebuilding the entire line risks breaking multi-line tasks (indented continuation lines).

```markdown
- [ ] 1.2 Add CSS custom properties for colors
      (Note: Use OKLCH color space)        ← Continuation line. Must not be touched.
```

Chosen pattern (replaces only the checked state character, preserving text via backreferences):
```
/^([ \t]*[-*][ \t]*\[)[ xX](\][ \t]+)/
-> Inserts only the replaced state character (' ' or 'x')
```
The character class is deliberately `[ \t]` rather than `\s`: `\s` would match `\n` and misbehave on multi-line input. See [`server/sync/surgicalEdit.ts`](https://github.com/fluentdb-dev/ithyno/blob/main/server/sync/surgicalEdit.ts) for the current source.
- Captures leading whitespace, list markers (`-`/`*`), and whitespace after `[` and `]`, then overwrites only the single character between them.
- Accepts uppercase `X` as a checked status on read (normalized to lowercase `x` on write).
- Does not affect continuation lines, task text, or tailing comments.
- This strictness is guaranteed via **mandatory unit tests** for `surgicalEdit.ts` (covering multi-line tasks, tab indents, `*` markers, and uppercase `X`).

### 6.2 Conflict Detection (Optimistic Locking)

The toggle request includes the file **hash (or mtime)** last observed by the UI, alongside the **original line text (`expectedText`)**.

```
POST /api/tasks/toggle
{ filePath, line, desiredChecked: true, baseHash: "sha1:...", expectedText: "- [ ] 1.2 Add CSS custom properties for colors" }
```

Before writing, the server re-reads the file and evaluates it in **two stages**:

1. **Hash matches**: Executes the surgical edit directly (fast path).
2. **Hash mismatches** (meaning an external edit occurred in between): Instead of rejecting immediately, it tries a **fallback mechanism to absorb line shifts**:
   - If the target `line` matches `expectedText` exactly: Edits the line as-is (line number and content match).
   - Otherwise, scans the entire file for **exactly one line matching** `expectedText`: If found, edits that line (**automatically correcting line shifts**).
   - If 0 or 2+ lines match (ambiguous): Aborts the write, returning a **409 Conflict** along with the latest state.

Design Intent: When an AI agent simply inserts lines at the top of a document (leaving the target task line content unchanged), the hash changes, but the target can still be identified via `expectedText`. In this case, **the operation succeeds without a 409 error**. This eliminates the frustration of being rejected on every click. A true 409 conflict is limited to the rare case where **the specific task line clicked was edited by the AI**.

This prevents lost updates. It does not rely on OS file locking (prioritizing robustness and portability).

### 6.3 Echo Suppression (Preventing Write Loops)

If the server's own writes trigger chokidar, it causes redundant re-parsing and pushes. Countermeasures:
- Record the **new hash immediately after a server write**, and ignore watcher events that match this hash (self-fire suppression).
- Enable chokidar's `awaitWriteFinish` to ensure it doesn't process partially written files.

### 6.4 Flow for Reflecting External Edits

```
AI edits tasks.md
  -> chokidar change event (after awaitWriteFinish)
  -> Hash comparison: Ignored if self-fired, continues if external
  -> Re-parses only the modified file (no full scans)
  -> Pushes { type: "change-updated", changeId, ... } via WebSocket to all clients
  -> UI updates the corresponding component (progress bar and checks sync instantly)
```

### 6.5 AI Streaming Writes and Live Worker State

While `awaitWriteFinish` (6.3) is correct for delaying re-parsing until writes stabilize, it has a side-effect: **Cursor or Claude Code often stream edits to a file over several seconds to tens of seconds rather than overwriting it instantly**. During this time, `tasks.md` itself is silent between the first partial write and the stabilized flush.

- **File-level batching (`change-updated`)**: acceptable. Data integrity is maintained, and the final state is eventually reflected once `awaitWriteFinish` fires.
- **Live worker state is surfaced elsewhere, not from the file watcher.** The dashboard now emits `agent-job-started` / `agent-job-output` / `agent-job-finished` events over the WebSocket (7), a per-change worker state signal rendered by `WorkerStateIndicator`, and `manager-activity-updated` broadcasts. These make the earlier "AI is writing..." proposal (streaming pre-stabilization chokidar events) redundant — that proposal is not implemented and is not planned.

### 6.6 Parser Robustness

- Retrieves task line numbers using `remark`'s AST `position` details. This is more robust than regex scans, avoiding false positives in nested lists or code blocks.
- If parsing fails (invalid markdown), returns the file with a `parseError` property, causing the UI to fall back to plain-text rendering. This guarantees **the UI does not crash**.

---

## 7. REST & WebSocket API

The authoritative surface lives in [`server/index.ts`](https://github.com/fluentdb-dev/ithyno/blob/main/server/index.ts) (roughly 30 endpoints plus two WebSocket upgrades). The list below is a **navigation aid, not an exhaustive spec** — treat `server/index.ts` as source of truth.

### REST — core Sync API (the v1 surface this document is about)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/state` | Returns the normalized workspace state |
| `GET` | `/api/changes/:id` | Details of a single change (including body content) |
| `POST` | `/api/tasks/toggle` | Surgical edit of checkboxes (optimistic locking + line-shift correction, see 6.2) |
| `GET` | `/api/file?path=` | Raw text of a markdown file (fallback view) |

### REST — everything else (grouped, see source for exact paths)

<!-- TODO(doc-drift): expand each family into a proper subsection or link to a per-family reference; for now this is a pointer, not a spec. -->

- **Doctor & install**: `/api/doctor`, `/api/doctor/install` (SSE) — prerequisite checks and streaming installer.
- **Init & import**: `/api/init`, `/api/init/stream` (SSE) — project scaffold and spec import.
- **Git**: `/api/git/status`, `/api/git/config` (GET/POST), `/api/git/init` — identity, status, and repo bootstrap.
- **Manager**: `/api/manager/activity` (GET/POST), `/api/manager/status` — surface for who's working what.
- **Phase state machine**: `/api/changes/:id/phase` (GET/POST), `/api/changes/:id/needs-human`, `/api/changes/:id/needs-human/answer`.
- **Agents runner**: `/api/agents/config` (GET/POST), `/api/config/parallel-execution`, `/api/config/agmsg`, `/api/agents/jobs`, `/api/agents/jobs/:id`, `/api/agents/run`.
- **Proposal editing**: `/api/changes/:id/proposal/execution`, `/api/changes/:id/git-state`, `/api/changes/:id/commit-proposal`.
- **Docs browse**: `/api/browse/markdown-tree`, `/api/browse/markdown`.
- **Meta**: `/api/health`, `/api/about`, `/api/auth/check`.

### WebSocket (Server-to-Client Push)

Two upgrades: `/ws` for dashboard events, plus a dedicated PTY WebSocket (used by the embedded Terminal component).

```ts
// Regenerate from server/index.ts when this drifts — that file is the source of truth.
type ServerEvent =
  | { type: "state-replaced" }                              // No payload; clients re-fetch /api/state
  | { type: "change-updated"; changeId: string; change: Change }
  | { type: "worktree-change-updated"; changeId: string; change: Change }
  | { type: "spec-updated"; domain: string; spec: SpecDomain }
  | { type: "doc-updated"; path: string }
  | { type: "tags-updated" }
  | { type: "agent-job-started"; jobId: string; ... }
  | { type: "agent-job-output"; jobId: string; chunk: string; ... }
  | { type: "agent-job-finished"; jobId: string; ... }
  | { type: "agent-job-removed"; jobId: string }
  | { type: "worktree-progress-updated"; changeId: string; ... }
  | { type: "git-status-updated" }
  | { type: "import-completed"; ... }
  | { type: "agents-updated" }
  | { type: "doctor-updated" }
  | { type: "manager-activity-updated" };
```

Conflict handling is **not** a WebSocket event — the toggle endpoint returns a REST `409 Conflict` in-band (see 6.2), and the client reconciles from that response.

---

## 8. UI Design

### Screen Layout

1. **Overview (Dashboard Top)**
   - Renders active changes as cards. Each card displays a **progress bar (done/total)**, title, and Intent summary.
   - Workspace summary (total tasks, completion rate).
2. **Change Details**
   - Tabs: `Tasks`, `Proposal`, `Design`, and `Delta Specs`.
   - The `Tasks` tab features a **progress tree** (sections to tasks hierarchy).
   - Checkboxes toggle instantly on click. Conflicts trigger toast notifications.
3. **Kanban (Overview)**
   - Static three-lane board — **TODO / IN-PROGRESS / DONE** — where placement is **folder-driven**: `.worktrees/<id>/` present → IN-PROGRESS, all-ticked → DONE, else TODO. See [`web/src/components/Kanban.tsx`](https://github.com/fluentdb-dev/ithyno/blob/main/web/src/components/Kanban.tsx).
   - No drag-and-drop. Kanban is a *state monitor*: user-facing affordances are limited to per-card action buttons (`Start` / `Apply` / `Archive` / `Merge` / `Discard`).
   - An optional **Phase-lane view toggle** (see `PhaseLaneBoard`) re-groups the same cards by phase-state-machine phase.
4. **Specs Browser**
   - List of domains under `openspec/specs/` -> Formats requirements/scenarios (Given-When-Then format) (**view-only**).
5. **Archive**
   - List of completed changes.

### Sync UX Principles

- For incoming external edits, parts not currently interacted with are **updated smoothly** (flashing lines to indicate changes).
- Conflicts (409) do not destructively overwrite; always alert the user before re-fetching state.

### Conflict Recovery UX (409)

As a premise, because of the `expectedText` fallback (6.2), **409 errors are limited to rare cases where the target task line itself was edited by the AI**. Therefore, **we do not use destructive global actions** like dimming the whole screen or forcing a reload (which are overkill for low-frequency, local issues and disrupt the user's flow).

Instead, we adopt a three-tier model: **Optimistic Updates + Background Reconciliation + Local Confirmation Prompts**:

1. **Optimistic Update**: Toggle the check status in the UI instantly on click (zero perceived latency).
2. **Background Reconciliation**: On a 409 error, the UI **silently swaps** the screen with the latest state returned in the response. No toast is displayed, only flashing changed parts. This handles all other task updates seamlessly.
3. **Local Confirmation**: Only if the **exact task line** the user interacted with has conflicted, the optimistic update rolls back, and an inline message is displayed directly on that line:
   - "This item was updated by the AI" along with the **new post-update text**.
   - A single-click **"Check again"** button (re-sends using the new `expectedText`/`baseHash`).
   - Accompanied by a subtle, auto-dismissing toast. **No modals or screen locks are used.**

Design Philosophy: **Respect the user's intent, keep errors local, and guide the user to re-apply changes with minimal friction without seizing the entire screen.**

---

## 9. Directory Structure (Implementation)

The repo directory on disk is `openspec-ui/`; the npm package and CLI are `ithyno`. The tree below is an **intentionally-partial orientation map for the sync core** — it does not enumerate the current server surface (`agents/`, `git/`, `skill-renderer/`, `doctor.ts`, `init-handler.ts`, `phases.ts`, `manager-activity.ts`, `needs-human.ts`, ...), the ~35 web components, or the `electron/` and `vscode-extension/` workspaces. See the repository root for the full layout.

<!-- TODO(doc-drift): rewrite as a real orientation map organized by area (server sync / agents / git / doctor; web pages / components / hooks / runtime; bin CLI; electron workspace). -->

```
ithyno/                # package/CLI name (repo dir on disk: openspec-ui/)
  package.json
  bin/
    ithyno.js          # CLI entry (commander): default = dashboard, plus `init` / `doctor` subcommands
  server/
    index.ts                # Fastify server, static assets, and WebSocket handler
    parser/                 # remark-based parser modules
      tasks.ts
      spec.ts
      proposal.ts
    sync/
      watcher.ts          # chokidar watcher with echo suppression
      surgicalEdit.ts     # surgical checkbox line edits with optimistic locking
    model.ts                # Domain types
  web/                        # Vite + React client
    src/
      store.ts            # Zustand store & WebSocket event handler
      pages/{Overview,ChangeDetail,Specs}.tsx
      components/{ProgressBar,Kanban,TaskTree}.tsx
    index.html
  docs/
    architecture.md
    roadmap.md
  README.md
```

---

## 10. Risks & Countermeasures (Addressing Trade-offs in `idea.md`)

| Risk | Countermeasure |
|---|---|
| **Concurrent Edit Conflicts (Lost Updates)** | Optimistic locking (baseHash verification) + re-fetch on 409. Avoid full serialization. |
| **High 409 Frequency due to Line Shifts** | `expectedText` fallback automatically corrects line shifts by content matching. Restrict true 409 prompts to local affected task lines (6.2 / Section 8). |
| **Destroying Multi-line tasks/Tabs/`*` markers** | Overwrite only the single check state character using strict regular expressions supported by robust unit tests (6.1). |
| **UI Silence during Streaming Writes** | Accept batched updates for v1. Stream "AI is writing..." status events via WebSockets in Phase 3 (6.5). |
| **Echo Loops (Self-firing)** | Track post-write hashes, suppress self-fired watcher events, and utilize `awaitWriteFinish`. |
| **Markdown Dialects** | Avoid embedding UI metadata in markdown files. Derive everything from plain OpenSpec GFM. |
| **Parsing Failures** | Return `parseError` metadata on failure and fall back to plain-text rendering. Prevent errors in one file from crashing the entire app. |
| **Scaling on Large Repositories** | Load active changes in `changes/` preferentially at startup. Lazy-load `archive/`. |
