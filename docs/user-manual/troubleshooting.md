---
title: Troubleshooting
audience: end-user
---

# Troubleshooting

This page lists common errors you might encounter while using ithyno and their workarounds.

## `claude --resume <uuid>` Fails with "No conversation found with session ID"

**Symptoms**

When opening the dashboard, the following error is displayed in the embedded terminal (Electron/Browser xterm or VS Code terminal):

```
$ claude --resume 1c79f6ee-689a-4988-a184-3cef5aec7308
No conversation found with session ID: 1c79f6ee-689a-4988-a184-3cef5aec7308
```

Claude Code fails to launch.

**Cause**

ithyno saves a UUID inside `<project>/.ithyno/` for each project. It manages Claude Code sessions using a two-step process:

- **First-time startup**: Runs `claude --session-id <uuid>` to create a session on the Claude Code side.
- **Subsequent startups**: Runs `claude --resume <uuid>` to resume the existing session.

The filename differs by channel:

- **Electron and Browser** (routed through the server PTY) — writes `.ithyno/session-claude`. The legacy filename `.ithyno/session-id` from older projects is still read as a fallback.
- **VS Code extension** — reads and writes `.ithyno/session-id` verbatim.

However, Claude Code's internal storage **does not persist a session until the user sends at least one message**. If:

- `claude --session-id <uuid>` was executed in the terminal,
- But you closed the terminal or exited VS Code/Electron before sending a message,

The session ID record is not saved on the Claude side, while the UUID remains stored on disk (`.ithyno/session-claude` for Electron/Browser, `.ithyno/session-id` for VS Code). On the next startup, running `--resume` with that UUID fails with the "unknown session" error.

**Workaround**

Delete the session-id file(s) in the target project and restart. The following covers both the current filename and the legacy fallback:

```bash
rm -f <project>/.ithyno/session-claude <project>/.ithyno/session-id
```

When you reopen the dashboard, the extension will issue a new UUID and fall back to `claude --session-id <new-uuid>`. Make sure to **send at least one message in the terminal before closing it** so that the session is persisted on the Claude side, making future `--resume` calls succeed.

**To permanently disable automatic session management**

In the VS Code extension, you can explicitly override `ithyno.terminalStartup` settings:

- `"claude"` — Launches a fresh Claude session every time (does not resume sessions).
- `"claude --continue"` — Resumes the last session in the directory (default Claude Code behavior).
- `""` (default) — Uses the automatic session-id management described above.

For the Electron and Browser versions, since configuration hooks are not yet available, please delete `.ithyno/session-claude` (and the legacy `.ithyno/session-id` if present) as a workaround.

## Sending `claude --continue` to the Embedded Terminal

Setting `claude --continue` in `ithyno.terminalStartup` (VS Code extension settings) will override the startup command. However, running `--continue` in a fresh project will fail with `No conversation found to continue`, so the automatic session-id management above is recommended.

## VS Code Extension: "did not observe launch URL within 20000ms" Error at Dashboard Startup

The cold start of the ithyno server (`bin/ithyno.js` -> `tsx server/index.ts`) has exceeded the timeout limit. Check the server-side logs in `View → Output → ithyno`. Common causes include:

- `Cannot find module` — Dependency resolution failure during VSIX packaging.
- `EACCES` — Permission issues.

The VS Code extension picks a fresh ephemeral port for each window, so port collisions between VS Code windows do not occur. A `port already in use` error would only surface when running `ithyno` directly from a terminal (CLI mode) with the fixed default port `4321` already held by another CLI-mode `ithyno` process.

The exact cause will be detailed in the logs. Please paste the log content when creating an issue.

## Created Folder via `ithyno: New Project` Remains Empty

You might have closed the onboarding panel before it finished. ithyno does not kill the background subprocess (`openspec init` via `npx`) even after receiving the `onboarding-close` event, so aborting mid-way leaves the folder in an incomplete state. Delete the folder and try again.

## Agy Does Not Start in the macOS Electron App

On macOS, the Electron app needs to wrap the Manager terminal in tmux for the
Agy interface to display correctly.

1. Install tmux if it is not already available:

   ```shell
   brew install tmux
   ```

2. Open **Settings → Execution**.
3. Enable **Wrap Manager terminal in tmux**.
4. Restart the Manager terminal.

## An Agy Worker Never Finishes

An Agy Worker is supported only when it is delegated by an Agy Manager through
Agy's native `invoke_subagent` mechanism. An Agy Worker cannot currently be
called from another Manager CLI.

In rare cases, an Agy-to-Agy dispatch may incorrectly start the Worker through
the server-side AgentRunner instead of `invoke_subagent`, causing it to hang.
Confirm that:

- the Manager command is `agy`;
- the Agy Worker is launched through `invoke_subagent`; and
- the dispatch does not route that Worker through `POST /api/agents/run`.

If AgentRunner was selected, stop that job and dispatch it again through
`invoke_subagent`.

## The macOS Electron App Does Not Open After Installation

If macOS blocks the installed application, first confirm that it came from the
official ithyno release, then clear the downloaded-file quarantine attributes:

```shell
xattr -cr /Applications/ithyno.app
```

Open `ithyno.app` again after the command completes.
