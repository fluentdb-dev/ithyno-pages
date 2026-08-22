# Antigravity CLI configuration example

This example uses **Claude Sonnet 4.6 for code** and
**Gemini 3.1 Pro (High) for review** through Antigravity CLI (`agy`).

```text
AGY Manager
    ├── Claude Sonnet 4.6     — code
    └── Gemini 3.1 Pro (High) — review
```

!!! info "Before you start"
    Install and sign in to Antigravity CLI. In ithyno, open
    **Settings → Prerequisites**, confirm that AGY is available, and use
    **Manage skills** to install its OpenSpec and ithyno skills.

!!! warning "AGY models change frequently"
    The model list provided by AGY may change as the CLI is updated. The names
    below are a current example. Use `agy models` when you need to replace them
    with models available in your installed version.

## Configure the Agents screen

Open **Agents** and configure the following three entries. Leave **Prompt**
blank.

| Name | Role | Command | Args |
|---|---|---|---|
| `manager` | `manager` | `agy` | leave empty |
| `agy-sonnet-code` | `code` | `agy` | `--model claude-sonnet-4-6` |
| `agy-gemini-review` | `review` | `agy` | `--model gemini-3.1-pro-high` |

## `agents.yaml` example

You can also use the following `agents.yaml` at the project root:

```yaml
agents:
  - name: manager
    mode: live-shell
    roles: [manager]
    command: agy
    args: []

  - name: agy-sonnet-code
    mode: single-prompt
    roles: [code]
    command: agy
    args:
      - --model
      - claude-sonnet-4-6

  - name: agy-gemini-review
    mode: single-prompt
    roles: [review]
    command: agy
    args:
      - --model
      - gemini-3.1-pro-high

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
