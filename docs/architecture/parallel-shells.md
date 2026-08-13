---
tags: [feature/electron, feature/vscode-extension, area/server]
---

# Parallel shells: Electron + VS Code extension

ithyno's north-star is **UI-driven parallel agent execution in
isolated git worktrees**. The two shell-packaging changes
(`add-electron-shell`, `add-vscode-extension`) are the first real-world
test of that workflow: both are independent in scope, both want to land,
and both can run as separate agents in separate worktrees thanks to
`add-agent-runner`.

This document explains the moving parts and where to look.

## The three changes

| change | role |
|---|---|
| `prep-parallel-shells` | **This change.** Lays down workspaces, the `build:server` script, and gitignore entries so the two parallel runs do not collide on the root `package.json`. |
| `add-electron-shell` | Adds `electron/` — a desktop app shell that spawns the existing server and loads it in a BrowserWindow. Embedded terminal stays. |
| `add-vscode-extension` | Adds `vscode-extension/` — an extension that spawns the server and loads it in a webview, delegating the terminal to VS Code's terminal panel. |

## Shared substrate (already in place)

- `bin/ithyno.js` — both shells spawn this.
- `add-csrf-protection` — both shells consume the session-token launch URL.
- `add-agent-runner` — both shells will themselves be implemented by agents
  running in `.worktrees/add-electron-shell/` and
  `.worktrees/add-vscode-extension/`.

## Why this preparation exists

Before this change, both shell proposals quietly assumed they'd be the
only one adding `electron/` (or `vscode-extension/`) to the root
`workspaces` array. The first to merge wins; the second's `git merge`
hits a conflict on a single line. Pre-staging both entries up-front
removes that contention.

## Agents spawn under `child_process` with piped stdio

The runner spawns each agent via `child_process` with piped stdio; stdout
and stderr are read separately and land in the ring buffer as
`stream: "stdout"` vs `stream: "stderr"`. Claude Code (and equivalents)
run under `-p "<prompt>"` (print mode) and emit plain lines that stream
over WebSocket as `agent-job-output` events.

The prior PTY / `node-pty` layer described in an earlier version of this
doc has been reverted — see
[revert-agent-pty-layers](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-04-revert-agent-pty-layers/proposal.md).
The `node-pty` binding still powers the embedded Manager terminal, but
not agent jobs.

## Orphan worktrees are adopted on server startup

Restarting the server no longer strands the `.worktrees/` on disk. On
startup the runner reads `git worktree list --porcelain`, keeps
entries under `.worktrees/<change-id>/` with branch `agent/<change-id>`,
and inserts each as a synthetic job with `status: "orphaned"`. The
Kanban card renders the change with an `orphaned` badge and the
familiar Merge / Discard actions — Cancel is hidden because there is
no process to signal. Landed by
[add-orphan-worktree-adoption](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-orphan-worktree-adoption/).

## Live progress from the worktree

Agents running under Claude Code's `-p` (print) mode produce no PTY
output until they exit — the transcript stays silent for the entire
implementation window. To keep the Kanban card's progress bar honest
while the agent works, the runner starts a per-job filesystem watcher
on the worktree's `openspec/changes/<id>/tasks.md`. Every `[x]` tick
becomes a `worktree-progress-updated` WebSocket event; the card's
`N/M` count moves in real time regardless of what the PTY does or
does not print. Landed by
[add-worktree-tasks-watcher](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-worktree-tasks-watcher/).

## Feeding agents their first task

`agents.yaml` entries declare per-role prompts under `prompts:`, and the
runner delivers the resolved prompt via one of two dispatch modes:

- **`cli-arg`** — the prompt is unshifted into `args` as
  `[promptFlag, initialInput]` (e.g. Claude Code's `-p "<prompt>"`,
  Aider's `--message "<prompt>"`). This is the default for most CLIs
  that expose a print/one-shot flag.
- **`stdin`** — the prompt is written to `child.stdin` at spawn time,
  for REPL-style runtimes without a print flag.

Which mode is used comes from the runtime's `promptStyle` and the
agent's `mode`. Manager `mode: live-shell` agents are a third path:
they inject the prompt via PTY keystrokes into the embedded terminal
rather than through a spawned child. Governed by
[reshape-agents-yaml-mode-roles](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-14-reshape-agents-yaml-mode-roles/proposal.md)
and [add-runtime-abstraction](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-07-add-runtime-abstraction/proposal.md).
The earlier stdin-only `initialInput` mechanism was reverted — see
[revert-add-agent-initial-input](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-19-revert-add-agent-initial-input/proposal.md).

## Viewing agent output from the UI

Each running job's output is rendered as a plain scrolling log with
ANSI-color escapes converted to `<span>` elements (see
`web/src/components/AgentOutputView.tsx`). Only two per-job actions are
exposed by the server: `GET /api/agents/jobs/:id/diff` and
`POST /api/agents/jobs/:id/cancel`.

Interactive TTY prompts are not supported — the `-p`-mode / YOLO-flag
workflow is the assumed contract. The earlier xterm.js terminal and
keystroke-relay endpoint (`POST /api/agents/jobs/:id/input`) described
in an earlier version of this doc have been reverted (see
[revert-agent-pty-layers](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-04-revert-agent-pty-layers/proposal.md)).
Worktree isolation remains the safety net for any YOLO / auto-approve
flags declared in `args`.

## Launching parallel work from the UI

**Use `npm run dev:test` (not `npm run dev`)** when dogfooding this. `dev`
runs the server under `tsx watch`, which restarts on any server-file save
and SIGTERMs every child agent along with it. `dev:test` runs the server
once and keeps web HMR. Landed by
[add-dev-test-script](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-dev-test-script/).

The Kanban TODO column exposes a **`Start ▾ (N)`** bulk launcher next to
`+ New Change` in the column header. Landed by
[add-parallel-start-launcher](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-02-add-parallel-start-launcher/proposal.md).
IN-PROGRESS and DONE have no column-header launcher (see
[hide-start-in-progress-column](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-21-hide-start-in-progress-column/proposal.md)):
the bulk-start action is TODO-only because bulk-starting TODO→IN-PROGRESS
is the semantics that makes sense.
The launcher lists every startable change (has non-verify work, not
running, agents available) so users can start a second/third change
alongside a running one.

- Candidate predicate: `startableCandidates()` in `web/src/util/changeState.ts`,
  shared with the card-level Start gate.
- Dispatch: reuses `useStartFlow().startImplementation` — same ExecutionPicker
  and same worktree/terminal branches as the card-level Start.
- Concurrency: no queueing. If the user picks 3, 3 agents spawn.

## The Claude default agent auto-commits at end-of-apply

Today, `agents.yaml`'s bundled Claude entry runs `/opsx:apply
${change_id}` — the upstream apply flow with no auto-commit. Once
[add-ithy-opsx-apply](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/add-ithy-opsx-apply/proposal.md)
lands and `agents.yaml` is switched to `/ithy-opsx:apply ${change_id}`,
the wrapping skill (`.claude/skills/ithy-opsx-apply/SKILL.md`) will
delegate to the upstream flow and then add a single `git commit` at the
end, so the agent branch ends with the implementation recorded rather
than as a dirty tree waiting for the archive skill's safety net to
notice. That takes the total to two commits per completed change: one
for implementation (via merge), one for the archive move.

## Archiving as a single git commit

The Kanban DONE column's Archive button injects **`/ithy-opsx:archive
<id>`** in Claude mode (CLI mode still uses `npx openspec archive
<id>`). The Claude command follows the
[`ithy-opsx-archive`](https://github.com/fluentdb-dev/ithyno/blob/main/.claude/skills/ithy-opsx-archive/SKILL.md)
skill, which handles the full flow: preflight, optional worktree merge
(`git merge --no-ff agent/<id>`), `openspec archive`, and one auto-drafted
git commit the user reviews before it lands. Landed by
[add-ithy-opsx-archive](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-ithy-opsx-archive/).

## Viewing the worktree from the dashboard

While an agent job runs, the change lives in two places on disk: the
main tree at `openspec/changes/<id>/` (the frozen proposal) and the
worktree at `.worktrees/<id>/openspec/changes/<id>/` (the agent's
in-flight edits). The dashboard reads either version based on the
URL. Adding **`?tree=worktree`** to a change URL — e.g.
`/change/add-vscode-extension?tree=worktree` — makes the server
return the worktree copy, and the ChangeDetail head shows a "viewing
worktree - switch to main" pill for the return trip. Kanban cards
whose job is running link to the worktree URL automatically, so the
card's progress ticks and the ChangeDetail page stay in sync. When
the worktree disappears (job discarded, worktree removed manually),
the `?tree=worktree` URL degrades to the main-tree view with a small
notice. Landed by
[add-worktree-change-view](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-worktree-change-view/)
(archived).

## Parallel dispatch across N changes

`/ithy-opsx:dispatch <id>` (landed by add-manager-loop-skill) drives
ONE change through `code → review → verify`. When multiple changes
are ready to fan out, `/ithy-opsx:dispatch-multi <id1> [id2] ...`
(landed by add-multi-dispatch-orchestrator) orchestrates them
concurrently:

- **Concurrency cap**: `agents.yaml.maxParallel` (default `3`,
  range `[1, 10]`). Excess ids queue and start as running ones
  finish.
- **Message routing**: workers append `change:<id>` to their
  report token (`stage:$S status:done change:<id>`) so a single
  Manager inbox can disambiguate across in-flight changes. The
  existing single-dispatch skill also emits the extended shape;
  the Manager parser accepts both new and legacy shapes.
- **Per-change independence**: one change escalating (e.g., after
  `MAX_REWORK_ROUNDS = 5` — sourced from
  `agents.yaml.maxReworkRounds`, range `[1, 10]`) does NOT stop the
  others. Each change advances on its own clock.
- **Report**: on exit, a per-id summary lists the final phase,
  iteration count, and elapsed time (or the escalation reason).

Prefer `dispatch-multi` when you have 2+ ready-to-implement
changes; the wall-clock drops from `sum(each)` to
`max(slowest) + queue drain time`. Single dispatch stays correct
for the common case of one change at a time. Landed by
[add-multi-dispatch-orchestrator](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-multi-dispatch-orchestrator/)
(archived after impl).

## Reading order

For someone new joining the parallel-shells story:

1. Electron folder layout idea (Japanese; not yet translated)<!-- TODO: restore link once ideas/2026-06-29-electron-shell-folder-layout is translated -->


2. [add-electron-shell proposal](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/add-electron-shell/proposal.md)
3. [add-vscode-extension proposal](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/add-vscode-extension/proposal.md)
4. [Archived changes](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/archive/) or
   [add-agent-runner](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-agent-runner/) while in flight
5. [add-parallel-start-launcher](https://github.com/fluentdb-dev/ithyno/tree/main/openspec/changes/add-parallel-start-launcher/) for the UI launcher
