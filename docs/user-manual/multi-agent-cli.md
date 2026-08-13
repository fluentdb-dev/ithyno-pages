---
title: Agent Configuration — Supported CLIs and agents.yaml
audience: end-user
---

# Agent Configuration — Supported CLIs and agents.yaml

This page explains how to configure "worker agents" in `agents.yaml` that are dispatched from ithyno's Kanban board, categorized by CLI.

Target CLIs (detected by `server/doctor.ts`):

**Manager-eligible** (spawns the Manager PTY):

- **claude** — Anthropic Claude Code (verified)
- **agy** — Antigravity CLI (verified)
- **opencode** — opencode CLI (unverified — allowed but not fully exercised)

**Worker-only** (spawn via `agents.yaml`, cannot serve as Manager):

- **copilot** — GitHub Copilot CLI
- **codex** — OpenAI Codex CLI
- **gemini** — Google Gemini CLI
- **cursor** — Cursor CLI
- **antigravity** — Antigravity (long-form binary name)

Only claude, copilot, agy, and codex have worked-out `agents.yaml` templates in this page today. The rest are detected by the doctor endpoint and can be wired up manually with the same `command` / `args` / `prompts` schema.

## Quick Start

1. Open `agents.yaml` at the root of the repository (if it does not exist, create it from the "Agents" tab).
2. Verify that the CLI you want to use is resolvable with `which <cli>`.
3. Copy and paste the corresponding block from the "CLI-Specific Templates" section below.
4. Save the file to instantly apply changes in the "Agents" tab (no reload required).

## Comparison Table

| CLI | Non-interactive Execution | Permission Auto-Approve | Works Out of the Box? |
|---|---|---|---|
| claude | `-p, --print <prompt>` | `--dangerously-skip-permissions` | ✅ |
| copilot | `-p, --prompt <text>` | `--yolo` (`--allow-all` alias) | ✅ |
| agy | `-p` / `--prompt` | `--dangerously-skip-permissions` | ✅ |
| codex | `codex exec [PROMPT]` (subcommand + positional arg) | `--dangerously-bypass-approvals-and-sandbox` | ⚠️ Workaround required (see below) |

> **Session persistence is not wired up for worker agents.** ithyno does not currently substitute a per-change UUID into worker CLI flags — the `${session_id}` template variable was removed (see `revert-session-id-cli-wiring`, archived 2026-07-15). Only the Manager PTY (Claude only) persists a session id, stored at `.ithyno/session-claude`. Do not add `--session-id`, `--conversation`, or similar flags to a worker `args:` list unless you supply the id yourself.

## Basic Structure of agents.yaml

```yaml
- name: <Any identifier name>          # Displayed in the UI
  mode: single-prompt          # Runs one prompt headlessly
  roles: [code]                # Roles this agent accepts
  command: <CLI executable filename>
  args:
    - <CLI-specific flags>
  prompts:
    code: <Prompt passed when role=code>
```

When the agent declares `prompts.<role>`, the runner appends `-p <resolved-prompt>` to `args` — unless `args` already contains `-p`, in which case nothing is added. Agents with no `prompts:` block are spawned with `args` exactly as written; the built-in `/opsx:apply` / `/ithy-opsx:review` / `/ithy-opsx:verify` defaults do **not** auto-append. If the CLI does not accept `-p` at all, refer to the "codex (Workaround Required)" section.

Template variables substituted inside `args` and `prompts` values (see `server/agents/registry.ts` `resolve()`): `${change_id}`, `${worktree_path}`, `${branch}`. No other variables are recognized.

## CLI-Specific Templates

### claude (code role)

```yaml
- name: claude
  mode: single-prompt
  roles: [code]
  command: claude
  args:
    - --dangerously-skip-permissions
    - --model
    - sonnet
  prompts:
    code: /opsx:apply ${change_id}
```

- Excluding `--model sonnet` will fall back to the default model of Claude Code.
- To persist a session across dispatches, hard-code your own `--session-id <uuid>` — ithyno does not populate this for workers.

### copilot (review role)

```yaml
- name: copilot-review
  mode: single-prompt
  roles: [review]
  command: copilot
  args:
    - --yolo         # Skips permission confirmation
    - -s             # silent: outputs only the agent's response
  prompts:
    review: /ithy-opsx:review ${change_id}
```

The prompt `/ithy-opsx:review` (not `/opsx:review`) is what the ithyno review flow expects — it writes the `review.md` artifact that the phase API reads back. `/opsx:review` still runs but bypasses that integration.

### agy (code role)

```yaml
- name: agy-worker
  mode: single-prompt
  roles: [code]
  command: agy
  args:
    - --dangerously-skip-permissions
  prompts:
    code: /opsx:apply ${change_id}
```

If you want to pin a model, add the flag agy's own docs specify — this repo has no live check for agy's model flag surface, so verify against your installed agy version.

### codex (Workaround Required)

Unlike other CLIs, codex **does not support the `-p` flag**. Instead, it accepts prompts via subcommand + positional argument like `codex exec [PROMPT]`. Since the ithyno runner auto-appends prompts in the format `-p <prompt>` when `prompts.<role>` is set, codex will reject that format as an unknown flag out of the box.

**Workaround: embed the prompt directly in `args` and omit `prompts:`.** Because auto-append fires only when `prompts.<role>` is declared, leaving it undefined skips injection entirely.

```yaml
- name: codex-worker
  mode: single-prompt
  roles: [code]
  command: codex
  args:
    - exec
    - --dangerously-bypass-approvals-and-sandbox
    - /opsx:apply ${change_id}   # ← Embed the prompt as a positional argument
  # Do NOT set prompts.code — if undefined, auto-append is bypassed
```

`${change_id}` is substituted inside the `args` template.

> **codex + session resume is unsupported**: The flow using `codex exec resume <SESSION_ID>` requires session-tracking that ithyno does not currently provide for workers.

## Multi-Role Configuration

You can either assign multiple roles to a single agent, or split CLI configurations per role.

### Pattern 1: One CLI handles all roles

```yaml
- name: claude-all
  mode: single-prompt
  roles: [code, review, verify]
  command: claude
  args:
    - --dangerously-skip-permissions
  prompts:
    code: /opsx:apply ${change_id}
    review: /ithy-opsx:review ${change_id}
    verify: /ithy-opsx:verify ${change_id}
```

Dispatched sequentially from the Kanban board (`code` -> `review` -> `verify`). Each dispatch is a fresh Claude Code invocation — conversation history is **not** shared across roles by default. If you need continuity, hard-code a `--session-id <your-uuid>` under `args`.

### Pattern 2: Different CLIs per role

```yaml
- name: claude
  mode: single-prompt
  roles: [code]
  command: claude
  args: [--dangerously-skip-permissions]
  prompts: { code: /opsx:apply ${change_id} }

- name: copilot-review
  mode: single-prompt
  roles: [review]
  command: copilot
  args: [--yolo, -s]
  prompts: { review: /ithy-opsx:review ${change_id} }
```

The dispatcher automatically selects the agent according to the active role.

## Constraints and Notes

- **No concurrent dispatches on the same change**: Only one job per change may run at a time; the runner returns HTTP 409 on the second dispatch. For example, starting `review` while `code` is running fails until `code` completes.
- **Dispatch fails if the CLI is not in your PATH**: You can verify installation via the Prerequisites section in the Init dialog, or under Settings › Prerequisites.

## Related Pages

- Agent Roles — Distinguishing code / review / verify / manager (Not yet written. Documentation planned.)<!-- TODO: restore link once translated -->
