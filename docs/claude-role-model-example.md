# Claude example: Sonnet for code, Fable for review

This example configures Claude so that **Sonnet implements Changes** and
**Fable reviews the result**.

```text
Claude Manager
    ├── Sonnet — code
    └── Fable  — review
```

!!! info "Before you start"
    Install and sign in to Claude Code. In ithyno, open
    **Settings → Prerequisites**, confirm that Claude is available, and use
    **Manage skills** to install its OpenSpec and ithyno skills.

## Configure the Agents screen

Open **Agents** and configure the following three entries. Leave **Prompt**
blank.

| Name | Role | Command | Args |
|---|---|---|---|
| `manager` | `manager` | `claude` | leave empty |
| `claude-sonnet-code` | `code` | `claude` | `--model sonnet` |
| `claude-fable-review` | `review` | `claude` | `--model fable` |

## `agents.yaml` example

You can also use the following `agents.yaml` at the project root:

```yaml
agents:
  - name: manager
    mode: live-shell
    roles: [manager]
    command: claude
    args: []

  - name: claude-sonnet-code
    mode: single-prompt
    roles: [code]
    command: claude
    args:
      - --model
      - sonnet

  - name: claude-fable-review
    mode: single-prompt
    roles: [review]
    command: claude
    args:
      - --model
      - fable

parallelExecution: true
```

## Start a Change

1. After saving the configuration, refresh the Manager terminal.
2. Create a Change or open an existing proposed Change.
3. Select **Start**.
4. Follow the code and review progress from the Change card or **Agents**.

This example covers code and review. Add a Worker with the `verify` role when
you also want a separate verification step.

For configurations that mix different CLIs, see
[Set Up Multiple Agents and Dispatch a Change](multi-agent-setup-and-dispatch.md).
