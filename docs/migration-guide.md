---
tags: [feature/migration, area/docs]
---

# Migrating an existing project to ithyno

A step-by-step guide for adopting OpenSpec + this dashboard on a project that
already exists.

## Fast path — `ithyno init`

For projects that don't yet have OpenSpec or ithyno's project-side files, the
one-shot bootstrap is:

```bash
cd /path/to/your-project
git init                    # if the project is not already a git repo
npx ithyno init .           # scaffold ithyno-side files (see below)
npx -y -p @fission-ai/openspec@latest openspec init . --tools claude
npx ithyno                  # start the dashboard at http://localhost:4321
```

`ithyno init` drops these files at your project root:

- `CLAUDE.md` — generic project rules (uses your project's verification
  commands via a placeholder — edit the `# Replace with your project's
  verification commands` line).
- `LICENSE` — project license file.
- `.claude/skills/openspec-flow/SKILL.md` — the spec-driven workflow skill,
  synced from ithyno's in-repo copy.
- `.claude/skills/ithy-opsx-{apply,archive,dispatch-multi,import,merge,revert}/`
  — Claude-driven skills that back the `/ithy-opsx:*` slash surface the
  Kanban action buttons wire into. Bundled with `init` deliberately so
  target projects can use the Manager/Worker skills out of the box.
- `.claude/commands/ithy-opsx/{answer,apply,archive,dispatch,dispatch-multi,escalate,import,merge,review,revert,verify}.md`
  — the 11 slash-command definitions that pair with the skills above.
- `agents.yaml.example` — sample agent configuration.
- `agents.yaml.tmpl` — template variant consumed by dispatch tooling.
- `docs/`, `docs/ideas/` — placeholder directories for stage 1 / 2 docs.
- `.gitignore` — appends `.worktrees/` and `.ithyno/` if missing.

Idempotent by default (existing files are skipped). Use `--force` to
overwrite, `--no-gitignore` to leave the file alone, `--quiet` for
minimal output. Preflight checks refuse to run against a non-git
directory (exit 2 with a clear message).

Once the dashboard opens, the embedded Terminal auto-manages a
**per-project Claude Code session**. On first open, ithyno mints a
UUID and writes it to `.ithyno/session-claude`, then starts
`claude --session-id <uuid>` — a fresh conversation bound to that
id. On every subsequent open, ithyno reads the same file and starts
`claude --resume <uuid>`, resuming the conversation with its history
intact. `.ithyno/` is added to `.gitignore` automatically (it's
local project state, not source of truth). To reset the session
(start a brand-new conversation), delete `.ithyno/session-claude` and
reopen the Terminal. The legacy `.ithyno/session-id` filename is still
honored as a read-only fallback for dev environments that predate the
per-CLI rename. Users who prefer a different flow — a manager
entry, a specific `--resume <fixed-id>`, or a plain fresh `claude`
each time — override this via a `roles: [manager]` entry in
`agents.yaml` or the `ITHYNO_TERMINAL_STARTUP` env var.

If you need to install OpenSpec / agent runner manually — for example
because you want to customize the workflow skill or your project has a
non-standard layout — read the sections below.

## Prerequisites

- **Node 18+** is available locally.
- **git 2.5+** (worktree support).
- The target project is **ideally** a git repository. It does not have to
  be one when you open the dashboard — the header's Git chip offers a
  one-click `git init`; worktree-mode Start additionally requires an
  initial commit, which the same Git identity modal calls out inline
  ("No commits yet. Worktree-mode Start needs a HEAD to branch from…").
  Non-agent use (specs, changes, tasks, docs) works without git either way.

## Stage 1 — Initialize OpenSpec in the target project

Use the official CLI; it scaffolds the directory layout and installs the
Claude Code skills.

```bash
cd /path/to/your-project

npx -y -p @fission-ai/openspec@latest openspec init . --tools claude
```

What gets created:

```
your-project/
  openspec/
    config.yaml
    specs/         # current behavior of the system
    changes/       # in-flight proposals
  .claude/
    commands/opsx/ # /opsx:propose etc.
    skills/        # openspec-propose / apply / archive ...
```

## Stage 2 — Run ithyno against the target

Pick whichever entry point matches how you already work.

| method | command | when |
|---|---|---|
| **Direct** | `node /path/to/ithyno/bin/ithyno.js --dir /path/to/your-project` | quick trial |
| **devDep install** | `cd your-project && npm install --save-dev /path/to/ithyno` | pin to the project |
| **Global link** | `cd ithyno && npm link` → `cd your-project && ithyno` | call from anywhere |
| **Electron app** | download the DMG / NSIS installer / AppImage and open — pick the project folder on first launch | no editor / non-VS Code editor / prefer a native window |
| **VS Code extension** | build `vscode-extension/ithyno.vsix` → **Install from VSIX…** → run `ithyno: Show Dashboard` | for VS Code users; workspace folder becomes the OpenSpec root automatically |

```bash
# Direct: open http://localhost:4321 in your browser
node /path/to/ithyno/bin/ithyno.js --dir . --port 4321
```

> **Bookmarking the URL:** the launch URL now carries a per-process session
> token (`?token=<hex>`). Bookmarking the *bare* `http://localhost:<port>/`
> and revisiting will land on the session-expired banner because the token
> query param is missing. Pin the full URL printed at startup — or just
> re-open via the CLI / Electron / VS Code entry that regenerates it. This
> is the tradeoff for the CSRF defense described in the root README.

The Electron and VS Code channels spawn the same `bin/ithyno.js` under
the hood — the only difference is how the UI is presented (native window vs.
browser vs. VS Code webview). See [`electron/README.md`](https://github.com/fluentdb-dev/ithyno/blob/main/electron/README.md)
for build instructions and [`vscode-extension/README.md`](https://github.com/fluentdb-dev/ithyno/blob/main/vscode-extension/README.md)
for the VSIX pipeline.

### Install via VS Code extension

Instead of running a standalone CLI, VS Code users can install the packaged
extension and open the dashboard inside the editor as a webview panel.

```bash
# from the ithyno checkout
npm install
npm --workspace=vscode-extension run package
# → vscode-extension/ithyno.vsix
```

Then in VS Code: **Extensions** view → `⋯` menu → **Install from VSIX…** →
pick the file. Open the target project folder as your VS Code workspace and
run **ithyno: Show Dashboard** from the Command Palette. The dashboard
opens beside the editor; Apply / Archive / Merge / Start commands are typed
into VS Code's own terminal panel (a persistent terminal named "ithyno")
which auto-launches a per-project Claude session (`claude --session-id
<uuid>` on first launch, `claude --resume <uuid>` on subsequent),
configurable via `ithyno.terminalStartup`. No `--dir` or `--port` flag
needed — the workspace folder is the project root, and the port is picked
automatically.

## Stage 3 — Add project-level configuration

These are optional but recommended.

### `docs/` for stage-1 ideas and stage-2 documentation

```bash
mkdir -p docs/ideas
# Copy or move existing READMEs / ADRs into docs/ as appropriate
```

### `agents.yaml` for the agent runner

```bash
cp /path/to/ithyno/agents.yaml.example agents.yaml
# Edit to define which agents you want exposed
echo ".worktrees/" >> .gitignore
```

### `CLAUDE.md` and the openspec-flow skill

Copying these from this repository gives Claude Code the same workflow rules
(propose-first discipline, idea capture, in-flight pivot guidance, etc.) when
it works inside your project.

```bash
cp /path/to/ithyno/CLAUDE.md /path/to/your-project/CLAUDE.md
cp -r /path/to/ithyno/.claude/skills/openspec-flow \
      /path/to/your-project/.claude/skills/
```

Edit the copied `CLAUDE.md` to remove the ithyno-specific command lines
(`npm test` etc.) and replace with your project's checks.

## Retrofitting existing assets

| You have | OpenSpec home |
|---|---|
| README / ARCHITECTURE.md | `docs/architecture.md` |
| ADRs | `docs/adr/` |
| Loose TODOs or issues | Promote the important ones via `/opsx:propose` |
| Old design conversations | `docs/ideas/<date>-<topic>.md` with `status: promoted` |
| Current system behavior | `openspec/specs/<capability>/spec.md` |
| Historical changes | `openspec/changes/archive/<YYYY-MM-DD>-<id>/` with `outcome.md` |

## First loop after migration

1. Open the dashboard at `http://localhost:4321`. Overview shows an empty
   Kanban.
2. Click **+ New Change** → describe what you want to build → the dashboard
   types `/opsx:propose "..."` into the embedded terminal, where Claude Code
   generates the four artifacts.
3. The new change appears in TODO. Click **Start** to spawn the agent in
   `.worktrees/<change-id>/` and watch progress in `/agents`.
4. When the agent finishes, **Merge** sends `/ithy-opsx:merge <id>` (or
   `git merge --no-ff <branch>` in CLI mode) to the terminal. Review the
   diff, accept, and tasks.md updates flow back to the kanban via the file
   watcher.
5. When all tasks are complete and `outcome.md` is written, click **Archive**.
   The change moves to `/archive` with its history preserved.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Start button is hidden | `agents.yaml` is missing or empty. Check `/agents` page for the parse error if any. |
| Kanban doesn't react to terminal edits | The dashboard server and Claude Code must run in the **same environment** (both WSL or both native on Windows). See `add-embedded-terminal` outcome notes. |
| Embedded terminal won't open | PTY backend failed to load. `/api/health` shows `terminal.available: false`. The dashboard still works — drag/buttons just won't be able to inject commands. |
| `npx openspec` resolves a different version | The local `@fission-ai/openspec` devDep installs into your project's `node_modules`. Run `npm install` after migration. |

## Future improvements (not yet shipped)

- Publishing `ithyno` to npm so `npx ithyno …` works without a local
  checkout. (Currently `package.json` still marks the package as
  `0.0.1-alpha.0` and is not published.)
