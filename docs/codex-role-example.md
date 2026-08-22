# Codex configuration example

This example uses **GPT-5.6-Sol for code** and **GPT-5.6-Terra for review**.

```text
Codex Manager
    ├── GPT-5.6-Sol   — code
    └── GPT-5.6-Terra — review
```

!!! info "Before you start"
    Install and sign in to Codex. In ithyno, open
    **Settings → Prerequisites**, confirm that Codex is available, and use
    **Manage skills** to install its OpenSpec and ithyno skills.

!!! warning "Codex settings change frequently"
    Codex CLI options and available models may change between releases. The
    model names below are a current example; replace them when your installed
    Codex version provides newer or different models.

## Configure the Agents screen

Open **Agents** and configure the following three entries. Leave **Prompt**
blank.

| Name | Role | Command | Args |
|---|---|---|---|
| `manager` | `manager` | `codex` | leave empty |
| `codex-sol-code` | `code` | `codex` | `-m gpt-5.6-sol` |
| `codex-terra-review` | `review` | `codex` | `-m gpt-5.6-terra` |

## `agents.yaml` example

You can also use the following `agents.yaml` at the project root:

```yaml
agents:
  - name: manager
    mode: live-shell
    roles: [manager]
    command: codex
    args: []

  - name: codex-sol-code
    mode: single-prompt
    roles: [code]
    command: codex
    args:
      - -m
      - gpt-5.6-sol

  - name: codex-terra-review
    mode: single-prompt
    roles: [review]
    command: codex
    args:
      - -m
      - gpt-5.6-terra

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
