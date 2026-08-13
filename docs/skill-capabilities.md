# Skill capability tokens (v1)

Skills written under `ithyno/skills/<name>/SKILL.md` express
CLI-dependent primitives as **capability tokens** rather than
CLI-native syntax. Renderers translate each token into the target
CLI's invocation at install time.

Landed by `generalize-skills-cross-cli`.

## v1 vocabulary

The v1 vocabulary is deliberately minimal — three tokens covering
the primitives every current ithyno skill needs. Extend by demand;
overspecifying up-front is worse than iterating.

### `<capability:subagent_spawn>`

> Launch a sub-worker with a boot prompt and wait for its completion.

All seven renderers are implemented today under
`server/skill-renderer/renderers/`; each expands
`<capability:subagent_spawn>` into a CLI-native phrasing in the
rendered skill body.

- **Claude renderer** → Task tool invocation, with
  `/ithy-opsx:dispatch` offered as a live-shell alternative in the
  expanded body — see
  `server/skill-renderer/renderers/claude.ts`.
- **Codex renderer** → subprocess phrasing (`codex exec …` for a
  nested run) — see
  `server/skill-renderer/renderers/codex.ts`.
- **Antigravity renderer** → `agy exec` for a nested run — see
  `server/skill-renderer/renderers/antigravity.ts`.
- **Cursor renderer** → "invoke via Cursor's agent tool"; emits
  `.cursor/commands/<namespace>-<command>.md` — see
  `server/skill-renderer/renderers/cursor.ts`.
- **Gemini renderer** → subprocess `gemini` call — see
  `server/skill-renderer/renderers/gemini.ts`.
- **Copilot renderer** → emits
  `.github/prompts/<namespace>-<command>.prompt.md`; the
  `subagent_spawn` token renders as a subprocess phrasing with a
  note that Copilot lacks a subagent tool. Capability-gated
  skipping is a spec goal
  (`openspec/specs/cross-cli-skill-installer/spec.md`), not
  currently implemented — the renderer always emits the file and
  surfaces the warning in the body — see
  `server/skill-renderer/renderers/copilot.ts`.
- **OpenCode renderer** → `opencode run` for a nested run — see
  `server/skill-renderer/renderers/opencode.ts`.

Skills using this token MUST list `subagent_spawn` in
`capabilities_required`.

### `<capability:file_write>`

> Modify a project file at a given path.

- Every CLI supports file writes (or the user wouldn't be running
  it as an agent). Renderers translate to whichever tool the CLI
  uses (Edit / Write / str_replace_editor / ...) via a canonical
  reference in the rendered body.

Named as a capability so the renderer can insert the CLI's
tool-name convention. Not intended to be strictly gated.

### `<capability:bash>`

> Shell out to run a command.

- Same story as `file_write` — universally supported but named so
  renderers can inject the CLI's shell-invocation convention.

## Adding a new token

1. Update this doc with the token name, one-line semantics, and how
   each renderer should translate it.
2. Update `schemas/skill-manifest.schema.json`'s
   `capabilities_required.items.enum`.
3. Update `scripts/lint-skill-tokens.mjs`'s known-token set.
4. Update each renderer to handle the new token (or fall back to
   soft-fail with a clear message).

## Linter

`scripts/lint-skill-tokens.mjs` scans every
`ithyno/skills/**/SKILL.md` for `<capability:*>` tokens and rejects
any that are not in the v1 vocabulary. Run as part of `npm test`.

## Rationale

Skill bodies are 95% workflow prose. The remaining 5% is
"invoke a sub-worker" / "modify this file" / "run this command".
Naming those three lets renderers substitute CLI-native syntax
while the prose stays universal.
