# Advanced: tmux and agmsg

tmux and agmsg are optional. A normal multi-agent dispatch does not require
either one: ithyno can run workers as one-shot processes in isolated Git
worktrees.

| Feature | Use it when | What it changes |
|---|---|---|
| **Parallel execution** | You want isolated worktrees or concurrent changes | Where each change is edited |
| **tmux** | You want the Manager terminal to survive dashboard reloads and temporary disconnects | Wraps only the Manager terminal in a persistent session |
| **agmsg** | Workers need persistent shells and explicit messages between agents | Uses tmux panes and an agmsg team for workers; implies tmux |

Start with parallel execution alone. Add tmux or agmsg only when you need the
behavior described below.

## Use tmux for the Manager terminal

tmux keeps the Manager CLI inside a project-scoped terminal session. Reloading
the dashboard or reconnecting the terminal attaches to that session instead of
starting a second Manager.

tmux does **not** configure worker roles, enable multi-change dispatch, or
provide agent-to-agent messages.

### Install tmux

=== "macOS"

    ```sh
    brew install tmux
    tmux -V
    ```

=== "Debian / Ubuntu"

    ```sh
    sudo apt update
    sudo apt install tmux
    tmux -V
    ```

=== "Fedora / RHEL"

    ```sh
    sudo dnf install tmux
    tmux -V
    ```

=== "Arch Linux"

    ```sh
    sudo pacman -S tmux
    tmux -V
    ```

=== "Windows"

    Native Windows does not include tmux, and ithyno does not install a Windows
    replacement automatically. The **Install** action in Prerequisites therefore
    opens manual guidance instead of installing it. Use the latest
    [psmux](https://github.com/psmux/psmux), which provides a `tmux.exe`
    compatibility command.

    Install with WinGet:

    ```powershell
    winget install marlocarlo.psmux
    ```

    Alternatively, download the installer or architecture-matching portable
    archive from [psmux Releases](https://github.com/psmux/psmux/releases).
    For a portable install, extract it and add the directory containing
    `tmux.exe` to your **User PATH**.

    Open a new PowerShell window and verify:

    ```powershell
    where.exe tmux
    tmux -V
    ```

    Completely restart the Electron app, or reload the VS Code window, after
    changing `PATH`. Also restart the ithyno server before reopening the Manager
    terminal. An already running process does not inherit later environment
    changes, and ithyno caches its first tmux detection result.

### Enable it

1. Open **Settings → Prerequisites** and confirm that tmux is detected.
2. Open **Settings → Execution**.
3. Enable **Wrap Manager terminal in tmux**.
4. Select the refresh button in the upper-right corner of the Manager terminal
   to restart it inside tmux.

This writes the following setting to `agents.yaml` at the project root:

```yaml
tmux: true
```

Each project receives a separate derived tmux session name. Ithyno also passes
the current dashboard endpoint and session credentials into the session when
it creates or reattaches it, so a recovered Manager uses the current project
context.

To stop using tmux, disable the toggle and restart the Manager from the refresh
button in the upper-right corner of its terminal. If tmux is enabled but cannot
be found on `PATH`, ithyno displays a warning and does not start the Manager.
Install tmux or disable the setting, restart ithyno, and then reopen the Manager
terminal.

## Use agmsg for persistent workers and messaging

agmsg adds a shared local team inbox and launches workers in tmux panes. The
Manager waits for an explicit stage-completion message from each worker before
judging the artifact and advancing the change.

Use agmsg when you need one or more of these behaviors:

- a Worker should remain available in a live shell;
- workers must send explicit completion messages to the Manager;
- several agent CLIs need a shared local messaging channel.

Do not enable agmsg only to run multiple changes. **Parallel execution** and
`dispatch-multi` already provide that without agmsg.

### Install agmsg prerequisites

- tmux must be installed; enabling agmsg turns tmux wrapping on implicitly;
- the agent CLIs must already be installed and authenticated;
- agmsg itself consists of Bash scripts and uses the `sqlite3` command.

=== "macOS"

    macOS normally provides `sqlite3`. Confirm it before installing agmsg:

    ```sh
    sqlite3 --version
    ```

    If it is unavailable, install it with Homebrew:

    ```sh
    brew install sqlite
    ```

=== "Debian / Ubuntu"

    ```sh
    sudo apt update
    sudo apt install sqlite3
    ```

=== "Fedora / RHEL"

    ```sh
    sudo dnf install sqlite
    ```

=== "Arch Linux"

    ```sh
    sudo pacman -S sqlite
    ```

=== "Windows"

    Windows requires three separate prerequisites before ithyno will install
    agmsg:

    1. Install [Git for Windows](https://gitforwindows.org/). This supplies the
       real Git Bash used to run agmsg's `.sh` files. Do not use the Windows
       `bash.exe` WSL launcher as a substitute.
    2. Download the architecture-matching **sqlite-tools for Windows** archive
       from the [official SQLite download page](https://www.sqlite.org/download.html).
       Extract it and add the directory containing `sqlite3.exe` to your User
       `PATH`.
    3. Install psmux as described in the tmux section above. `tmux.exe` must be
       visible from native PowerShell, not only from a manually configured
       Git Bash session.

    Open a new PowerShell window and verify all three commands:

    ```powershell
    where.exe git
    where.exe sqlite3
    where.exe tmux
    sqlite3 --version
    tmux -V
    & 'C:\Program Files\Git\bin\bash.exe' -lc 'sqlite3 --version'
    ```

    If Git for Windows was installed to another directory, adjust the last
    path. Ithyno derives Git Bash from `git --exec-path`; it deliberately does
    not trust a bare `bash` command because that may resolve to WSL. For a
    non-standard installation, set the Windows user environment variable
    `GIT_BASH` to the absolute path of Git Bash, for example
    `D:\\Apps\\Git\\bin\\bash.exe`, and restart ithyno. `AGMSG_BASH` is also
    accepted by agmsg's Codex delivery hook.

    Completely close and restart ithyno after changing `PATH`. Then open
    **Settings → Prerequisites → Refresh**. The agmsg installer remains blocked
    until both Git Bash and `sqlite3` are detected. tmux is checked separately
    before terminal wrapping.

### Install agmsg

1. Open **Settings → Prerequisites**.
2. Find **agmsg** and select **Install** if it is missing.
3. Wait until installation completes, then select **Refresh** and confirm that
   agmsg is shown as installed.
4. Restart the Manager terminal so it can recognize the newly installed agmsg
   command and skill.

The ithyno installer copies its bundled, compatible agmsg tree to
`~/.agents/skills/agmsg/`. It preserves the local database on later updates.
If the packaged copy is unavailable, install from the
[agmsg project](https://github.com/fujibee/agmsg) with `npx agmsg`, restart
ithyno, and refresh Prerequisites.

### Configure agmsg for the project

1. In **Settings → Agmsg (multi-agent messaging)**, select **Configure**.
2. Enable agmsg and enter a team name unique to the project, such as
   `my-project`.
3. Leave **Storage path** empty to use agmsg's default local SQLite database,
   unless every participating process has been configured to use the same
   custom path.
4. Save the configuration.
5. Open **Agents**, edit each worker that should use agmsg, and save it again.
   The UI updates those workers to the agmsg-backed execution mode.
6. Restart the Manager terminal before dispatching.

The project setting is stored in `agents.yaml`:

```yaml
agmsg:
  team: my-project
```

Because agmsg implies tmux, you do not also need `tmux: true` unless you want
tmux to remain enabled after removing the agmsg configuration.

### Supported worker commands

Ithyno currently maps these worker commands to agmsg agent types:

| Worker command | agmsg type |
|---|---|
| `claude` | `claude-code` |
| `codex` | `codex` |
| `copilot` | `copilot` |
| `gemini` | `gemini` |
| `antigravity` | `antigravity` |
| `opencode` | `opencode` |
| `cursor` | `cursor` |

An unmapped command cannot be launched through agmsg. Use the command shown in
the table or disable agmsg for that worker.

When an agmsg-enabled worker is saved, ithyno synchronizes its supported
long-form CLI options into `~/.agmsg/config/spawn_options.yaml`. Model selection
is passed separately when dispatch starts. Edit worker options in ithyno rather
than maintaining the generated entry by hand.

### Disable agmsg

1. Open **Settings → Agmsg (multi-agent messaging) → Configure**.
2. Turn off **Enable** and save.
3. Open **Agents**, edit and save each worker again so the UI restores normal
   one-shot execution.
4. Disable **Wrap Manager terminal in tmux** separately if you do not want to
   keep Manager session persistence.
5. Restart the Manager terminal.

Disabling the project integration does not uninstall agmsg or delete its local
message database.

## Troubleshooting

| Symptom | Check |
|---|---|
| tmux is enabled but the Manager does not start | Confirm `tmux -V` works in the environment that launched ithyno, then restart ithyno. To run without tmux, disable the setting first. |
| A previous Manager uses an old dashboard endpoint | Restart the Manager from the active dashboard so the tmux session receives the current `ITHYNO_BASE` and session token. |
| Worker still runs as a one-shot process after enabling agmsg | Edit and save that worker from **Agents**, then dispatch again. |
| Dispatch reports an unknown agmsg type | Use one of the mapped commands listed above. |
| Manager waits after a worker finishes | Check the team name and worker pane; the worker must send its stage-completion message to the same team. |
| Windows shows agmsg as installed but spawning fails | agmsg detection does not include tmux. Confirm Git Bash and `sqlite3`, then check `tmux.exe` separately and restart the app. |

Return to [Set Up Multiple Agents and Dispatch a Change](../multi-agent-setup-and-dispatch.md)
for the standard workflow.
