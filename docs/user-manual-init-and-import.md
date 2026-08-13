# ithyno User Manual — Initialization and Import

Audience: First-time ithyno users, and users who want to apply OpenSpec to an existing project.
Last Updated: 2026-08-01.

---

## Table of Contents

1. [Prerequisites: Project State](#prerequisites-project-state)
2. [Flow A: Initializing a New or Uninitialized Project](#flow-a-initializing-a-new-or-uninitialized-project)
3. [Flow B: Importing an Existing Project (LLM Generation)](#flow-b-importing-an-existing-project-llm-generation)
4. [Troubleshooting](#troubleshooting)

---

## Prerequisites: Project State

When ithyno opens a folder, there are two possible paths:

| Folder State | Display |
|---|---|
| `openspec/changes/` exists | Navigates to the normal Kanban dashboard |
| `openspec/` is missing | Displays `NoProjectDecisionPanel` (2-branch decision panel) |

The `NoProjectDecisionPanel` provides two buttons:

- **Initialize openspec here** — Initializes this folder as an OpenSpec project (Go to [Flow A](#flow-a-initializing-a-new-or-uninitialized-project))
- **Open dashboard anyway** — Opens an empty Kanban dashboard without initialization (the dashboard will be empty)

Import can be launched from either of the states above (Go to [Flow B](#flow-b-importing-an-existing-project-llm-generation)).

---

## Flow A: Initializing a New or Uninitialized Project

### Prerequisites

Required:
- At least one agent CLI (`claude`, `codex`, `agy`, `copilot`, `gemini`, `opencode`, or `cursor`)

Optional (can be auto-installed from the dashboard):
- `tmux` — Multi-pane support to wrap the embedded terminal inside tmux
- `agmsg` — Cross-communication for multi-agent dispatch

### Steps

**1. Open a folder**

Electron version: Select the target folder from `File → Open Project…`, or specify `--dir <path>` at startup.

**2. NoProjectDecisionPanel is displayed**

- Folder path shown in the header
- Two buttons: `Initialize openspec here` and `Open dashboard anyway`

**3. Click `Initialize openspec here`**

Navigates to the Onboarding page (`/onboarding?target=<path>`). Two sections inside the card are displayed:

**Prerequisites** — Checks for CLI availability
- [x] = installed / [ ] = missing
- Lists the 7 agent CLIs, `tmux`, and `agmsg` (optional)
- Only `agmsg` shows an `[Install]` button, and only inside the post-Continue Agmsg configuration section on the Onboarding page (not the pre-Continue Prerequisites list). tmux is status-only — install it via your platform's package manager and reload.
- If no agent CLI is found: `Continue` is disabled, and a link to "Settings > Prerequisites" is displayed.

**Manager CLI** — Select the CLI to use as the Manager
- Only lists installed AND Manager-eligible CLIs — currently `claude`, `agy`, and `opencode` (the last is labeled `(unverified)`). Other installed CLIs (`codex`, `copilot`, `gemini`, `cursor`, `antigravity`) appear in the Prerequisites list but not in the picker.
- Initial selection defaults to `Default Manager` in Settings (if not configured, priority order among Manager-eligible CLIs is `claude > agy > opencode`). The full `CLI_PRIORITY` list (used elsewhere) is `claude > codex > agy > copilot > gemini > opencode > cursor`.
- Select via radio button. The chosen one is highlighted in the accent color.

**4. Click `Continue`**

Switches to the `Setting up ithyno project` screen (within the same card), showing a 4-step progression:

1. **Check prerequisites** — Re-runs the doctor check
2. **Scaffold ithyno files** — Copies everything under `templates/` into the project: `CLAUDE.md`, `LICENSE`, `agents.yaml.example`, `agents.yaml.tmpl`, `docs/ideas/`, the `.claude/skills/ithy-opsx-*` and `.claude/skills/openspec-flow` skill definitions, and the `.claude/commands/ithy-opsx/*` slash-command files that back `/ithy-opsx:*`. Also ensures `.gitignore` contains both `.worktrees/` and `.ithyno/`.
3. **Install OpenSpec** — Adds `@fission-ai/openspec` as a project devDependency (`npm install --save-dev @fission-ai/openspec@latest`), then runs `npx openspec init <target> --tools <tool>` where `<tool>` is derived from the picked Manager CLI (`claude`, `codex`, `gemini`, `opencode`, `cursor`, `agy → antigravity`, `copilot → github-copilot`). Creates `openspec/config.yaml`, `openspec/specs/`, and `openspec/changes/`.
4. **Write agents.yaml** — Places `agents.yaml` with the selected Manager CLI in the repository root

Status of each step: pending -> in-progress (accent color, pulse) -> done (green) / failed (red).
Subprocess stdout/stderr are displayed live in the terminal-style log pane at the bottom.

**5. Upon Completion**

- The `Open Project` button is enabled. Clicking it redirects to the dashboard to show the Kanban view.
- After navigating, since `agents.yaml` is present, the embedded terminal auto-launches the Manager.

### Retrying mid-setup

You can return to the Prerequisites / Manager picker using the `← Back` button (located at the bottom-left of the "Setting up" screen). It is disabled while execution is running.

---

## Flow B: Importing an Existing Project (LLM Generation)

### What It Does

An LLM sub-agent reads the existing project's `README.md`, `CLAUDE.md`, `docs/`, and source code to generate a first-draft set of `openspec/specs/<capability>/spec.md`.

The generated specs are editable drafts that the user reviews and commits.

### Prerequisites

- ithyno must be running in a project that has an `agents.yaml` (the Manager PTY must be active)
- The Manager must be an agent capable of calling the Task tool. Verified today: `claude`. `agy` (Antigravity) is picker-eligible and expected to support Task, but Import has not been end-to-end verified against it. `opencode` is picker-eligible but marked `(unverified)`.

### Steps

**1. Launch from the Electron menu or VS Code**

- Electron: `File → Import Existing Project…`
- VS Code: Run `ithyno.importProject` command

A folder picker will open. Select the folder you wish to import.

**2. `ImportConfirmModal` — Preflight Confirmation**

- Displays the target path, the scan size of code and docs, and the estimated token usage
- Preflight Checks:
  - **400 reject** if the size exceeds 50 MB
  - **403 reject** if the path is unauthorized (e.g., system directories)
  - **409 reject** if doctor reports `readyForManager: false`
  - **503 reject** if the Manager PTY on the ithyno side is not running
- Re-imports over an existing `openspec/` are allowed — the sub-agent's `openspec init` step is idempotent and only per-capability `spec.md` files are (over)written.

**3. Click `Confirm`**

- The target path is categorized into **Pattern B** (same as current project) or **Pattern A** (external project)
- The server injects `/ithy-opsx:import <target>` into the Manager PTY
- The Manager runs the `/ithy-opsx:import` skill, spawning a sub-agent via the Task tool
- The sub-agent performs the following:
  1. `cd` into `<target>`
  2. Reads README, CLAUDE.md, docs, and source tree samples
  3. Runs `openspec init`
  4. Writes `openspec/specs/<capability>/spec.md` for each capability
  5. Writes `openspec/GENERATED.md` (completion marker)
  6. Does NOT perform a commit

**4. Progress and Completion Notifications**

- **Pattern B** (in-place): The dashboard watches the current project. Upon detecting `openspec/GENERATED.md`, it navigates to the Kanban view and displays an "LLM-generated" banner.
- **Pattern A** (external target): Displays a notification card in the top-right with the title `Import complete` and the target path underneath, plus `[Open imported project]` / `[Dismiss]` buttons (`[Copy path]` in the browser fallback).
  - Clicking Open calls the Electron bridge `window.ithyno.openProject(targetPath)`, which switches ithyno's active project via `POST /api/project/switch`.

**5. Verifying Generated Artifacts**

- `git status` of the target project: `openspec/` and `openspec/GENERATED.md` appear as untracked files.
- Automatic commits never occur — the user must review and commit manually.
- Banner displays: "Specs are LLM-generated drafts — review before relying on them"

### Constraints

- Maximum **20 concurrent import jobs** (returns 429 if exceeded)
- Job TTL is 1 hour (aborted/left jobs are automatically cleaned up)
- The sub-agent runs inside the Manager's own CLI session via its Task tool and is bounded by that session's limits — ithyno does not enforce a separate SIGTERM/SIGKILL timeout on the sub-agent.

---

## Troubleshooting

### `Prerequisites: Could not check prerequisites: GET /api/doctor failed: 401`

This occurs with an outdated build where the session token is not sent. Run `npm run build` and restart Electron.

### `Setting up ithyno project` fails at the Scaffold step

- Project is not initialized with Git: `autoGitInit: true` is passed, so it should initialize automatically, but if it fails, check the log pane.
- Templates cannot be read: Suspect ithyno's installation state (run `npm install` again).

### `Install OpenSpec` fails

- Network disconnection: `npx` cannot fetch the package.
- Incorrect npm registry proxy settings.
- Node.js version mismatch (check via `node --version`, v22+ is expected).

### Import returns 503 (Manager PTY not running)

This indicates that `agents.yaml` is missing in the active project, or terminal auto-launch is disabled. Resolve by one of the following:
- Re-open ithyno in a different project that has `agents.yaml`.
- Add `agents.yaml` to the current project and retry the import.

### Terminal panel is not displayed

If the target project lacks `agents.yaml`, the terminal sidebar is hidden per the `guard-terminal-autolaunch-on-agents-yaml` spec. Add `agents.yaml` and restart ithyno to display it.

### Kanban remains empty (Initialization is not reflected)

- `openspec init` might not have executed: Check devtools console errors and server logs.
- Verify if `openspec/config.yaml` exists in the target folder via `ls <target>/openspec/config.yaml`.
- If it exists but is not reflected, check the WebSocket connection (Live / Offline indicator at the top right of the dashboard).

### Nothing shown in the `Manager CLI` picker

No agent CLI is installed. Check Settings > Prerequisites and install according to the documentation of each CLI vendor (e.g., Claude Code: `npm i -g @anthropic-ai/claude-code`).

---

## Related Documents

- [Architecture Overview](./architecture.md) — Comprehensive architecture of ithyno<!-- TODO: restore link after translation -->
- [Roadmap](./roadmap.md) — Future plans<!-- TODO: restore link after translation -->
- `openspec/specs/dashboard/spec.md` — Detailed specifications of the dashboard
- `openspec/changes/archive/2026-07-22-unify-open-project-3-branch/` — Initial implementation of the decision panel
- `openspec/changes/archive/2026-07-23-refactor-import-to-task-tool-subagent/` — Current implementation of the Import feature
