# CLI waiting notifications

ithyno can show a desktop notification when a CLI worker finishes or waits for
input. Notifications are configured per CLI from **Settings → Prerequisites**.
The notification hook is optional and does not require the ithyno server to be
running.

## What happens when the notification is clicked?

The hook records the CLI and project in the notification group. The project
path is hashed for grouping, so notifications from different projects do not
replace one another. The visible message contains the CLI name and project
folder name, but not the full path.

| Host OS | Runtime | Notification | Click behavior |
| --- | --- | --- | --- |
| macOS | Electron | `alerter` | Activate ithyno |
| macOS | VS Code extension | `alerter` | Activate VS Code |
| macOS | Direct CLI | `alerter` or `osascript` | No application is forced open |
| Windows | Electron / VS Code | BurntToast or `NotifyIcon` | Activate the known host app when available |
| Windows | Direct CLI | BurntToast or `NotifyIcon` | No application is forced open |
| Linux | Electron / VS Code | `notify-send` | Desktop-environment dependent; no application is forced open |
| Linux | Direct CLI | `notify-send` | No application is forced open |

The notification group follows this form:

```text
ithyno:<cli>:<project-id>
```

On macOS, the default timeout is 24 hours so a notification remains available
while you are away. Other hosts use the timeout rules of their native
notification provider.

## Installation and safety

Enabling a bell in Settings installs the project-local hook and script. `init`
does not enable hooks automatically. On macOS, `alerter` is optional; on
Windows, BurntToast is optional and the script falls back to the standard
notification API. Hook failures are non-fatal to the CLI.
