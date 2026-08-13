# Implementation Roadmap

> **Note:** This is the original design-time roadmap. Phases 0–4 have shipped; current backlog lives in `openspec/changes/`. See `openspec/changes/archive/` for completed work.

A phased plan for taking ithyno from design to implementation. Each phase is defined as an independent, testable milestone.

---

## Phase 0 — Project Foundation

Goal: Running `npx ithyno` launches an empty server and automatically opens a browser.

- [x] Initialize repository (single npm root package with top-level `server/`, `web/`, and `bin/`; `electron/` and `vscode-extension/` added later as npm workspaces)
- [x] Configure TypeScript (ESLint / Prettier not adopted)
- [x] Setup Fastify server scaffold (healthcheck `GET /api/health`)
- [x] Setup `web` client scaffold (Vite + React + plain CSS with CSS variables, theme-aware via `data-theme` on `<html>`)
- [x] CLI (`commander`): Port resolution, server startup, and auto-open browser (`open`)
- [x] Development scripts (running Vite dev server and Fastify server concurrently, proxy configuration)

**Definition of Done**: Launches locally and renders an empty dashboard.

---

## Phase 1 — Read-Only Dashboard (MVP Foundation)

Goal: Parse `openspec/` and **view** development progress.

- [x] Define domain model (`model.ts`)
- [x] Parser: `tasks.md` (retrieving line numbers using `remark` AST `position`)
- [x] Parser: `proposal.md`, `design.md`, delta `spec.md`, and `specs/`
- [x] Workspace scanner (prioritize `changes/`, lazy-load `archive/`)
- [x] Implement `GET /api/state`
- [x] Overview screen (change cards, progress bars, and overall workspace summary)
- [x] Change details screen (Tasks, Proposal, Design, and Delta tabs; view-only)
- [x] Specs browser (pretty-rendering Given-When-Then scenarios)
- [x] Plain-text fallback for files that fail parsing

**Definition of Done**: Renders a real OpenSpec project, showing accurate progress visualization.

---

## Phase 2 — Bidirectional Synchronization (Core Experience)

Goal: Toggling checkboxes in the UI rewrites the file, and external edits are automatically pushed back to the UI.

- [x] `surgicalEdit.ts`: Strict regular expression replacing only the check state character (`/^(\s*[-*]\s*\[)[ xX](\]\s+)/`)
- [x] `surgicalEdit.ts` unit tests (covering multi-line tasks, tab indentations, `*` markers, and uppercase `X`)
- [x] Optimistic locking (baseHash verification) + `expectedText` fallback (automatic line shift correction, restricted 409 conflicts)
- [x] Implement `POST /api/tasks/toggle` (`baseHash` + `expectedText` payload)
- [x] Setup chokidar watcher (enabling `awaitWriteFinish`)
- [x] Echo suppression (recording post-write hashes -> ignoring self-fired watcher events)
- [x] Diff parser for external edits -> WebSocket pushes
- [x] Client: Zustand store + WebSocket event handlers (`state-replaced`, `change-updated`)
- [x] UI: Optimistic updates + local conflict recovery (inline "Check again" prompts) + flashing lines for incoming external edits

**Definition of Done**: UI operations write minimal diffs to markdown; AI edits automatically sync with the UI; conflicts are handled safely.

---

## Phase 3 — Kanban & Polish

Goal: Refine the visual progress management experience.

- [x] Three-column change Kanban (Backlog / In Progress / Done) via `@dnd-kit`, driven by a phase state machine derived from `agents.yaml` roles
- [x] Change-level search filter (`add-kanban-search-filter`)
- [ ] "AI is writing..." lightweight WebSocket events and badge indicators (Architecture 6.5) — in-flight via `add-writing-status`
- [x] Archive listing (lazyloaded)
- [x] Keyboard navigation and accessibility
- [x] Dark / Light themes

**Definition of Done**: Daily progress management flows comfortably entirely through the UI.

---

## Phase 4 — Distribution and Cleanup

Goal: Ready for public usage via `npx ithyno`.

- [x] Serve `web` build assets statically from the server (running as a single process)
- [x] SPA fallback: Redirect all GET requests except `/api/*` to `index.html` (prevents 404s on direct access to `/change/:id` or page reloads)
- [x] npm packaging (defining `bin` and filtering `files` block)
- [x] Update README usage guide and add screenshots
- [x] Error handling (e.g., instructions when `openspec/` is absent)
- [x] Finalize licensing (GPL-3.0-or-later; see `LICENSE` and `LICENSE-NOTICE.md`)

**Definition of Done**: Runs successfully as a publishable npm package. Distribution has since expanded beyond npm — see `.github/workflows/release.yml`, `scripts/release-*.mjs`, and `docs/release.md` for the automated release-build + GitHub Releases pipeline, plus Electron packaging (`npm run electron:package:*`).

---

## Future Considerations (Post-v1)

- Git Integration: Show last commits and assignees per change/task.
- Inline editing of specification bodies (requirements/scenarios).
- VS Code / Cursor extensions (sharing the same server logic in a WebView).
- Multi-repository support / remote browsing.

---

## Milestone Decisions

The minimum viable value is realized at the **completion of Phase 2** (where bidirectional synchronization is active, delivering the core experience of `idea.md`).
Phase 0 -> 1 -> 2 is our highest priority, while Phases 3 and 4 will be adjusted based on real usage feedback.
