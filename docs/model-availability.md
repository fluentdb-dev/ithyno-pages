# Check models available to each agent CLI

The model you can actually select depends on your plan, organization policy,
provider, region, and CLI version. Model catalogs change frequently. Treat the
picker or list returned by your signed-in CLI as authoritative; the lists below
are a snapshot checked on **August 26, 2026**.

## Quick check

Copy the commands from your CLI's card. Commands beginning with `/` are entered
inside the running CLI, not in your shell.

<div class="grid cards" markdown>

-   **Claude Code**

    ```console
    claude
    ```

    Then enter:

    ```text
    /model
    ```

-   **Codex**

    ```console
    codex
    ```

    Then enter:

    ```text
    /model
    ```

-   **Antigravity CLI**

    ```console
    agy models
    ```

-   **GitHub Copilot CLI**

    ```console
    copilot
    ```

    Then enter (`/models` is also available):

    ```text
    /model
    ```

</div>

Do this while signed in with the same account that ithyno will use. A model in
the provider's general API catalog is not necessarily enabled for your CLI
account.

## Claude Code

Use `/status` to check the active model. You can also select a model when
starting a session:

```console
claude --model sonnet
```

Claude Code accepts aliases such as `sonnet`, `opus`, `haiku`, and `fable`, or
a full model ID. The current Claude model family advertised by Anthropic is:

| Model | Full model ID |
|---|---|
| Claude Fable 5 | `claude-fable-5` |
| Claude Opus 4.8 | `claude-opus-4-8` |
| Claude Sonnet 5 | `claude-sonnet-5` |
| Claude Haiku 4.5 | `claude-haiku-4-5` |

`fable` and some other models may require a particular plan or account access.
Aliases can also resolve differently when Claude Code uses Amazon Bedrock,
Google Cloud, Microsoft Foundry, or an LLM gateway. Confirm the result in
`/model` instead of assuming that a full API catalog is available.

In an ithyno Worker entry, put the selection in **Args**, for example:

```text
--model sonnet
```

Sources: [Claude Code model configuration](https://code.claude.com/docs/en/model-config),
[Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview).

## Codex

The model picker is the reliable account-specific list. Run `/status` after selecting
a model. For a one-off launch, use `-m` or `--model`:

```console
codex -m gpt-5.6-terra
```

The visible Codex catalog checked for this documentation contained:

- `gpt-5.6-sol`
- `gpt-5.6-terra`
- `gpt-5.6-luna`
- `gpt-5.5`
- `gpt-5.4`
- `gpt-5.4-mini`

The OpenAI API model catalog is broader than the Codex picker. Do not copy an
arbitrary API model ID into `agents.yaml` without first confirming that it
appears in your signed-in Codex `/model` picker.

In an ithyno Worker entry, an example **Args** value is:

```text
-m gpt-5.6-terra
```

Sources: [Codex developer commands](https://developers.openai.com/codex/cli/slash-commands),
[OpenAI models](https://developers.openai.com/api/docs/models).

## Antigravity CLI (AGY)

The account checked for this documentation returned:

```text
gemini-3.7-flash-high
gemini-3.7-flash-medium
gemini-3.7-flash-low
gemini-3.6-flash-high
gemini-3.6-flash-medium
gemini-3.6-flash-low
gemini-3.5-flash-high
gemini-3.5-flash-medium
gemini-3.5-flash-low
gemini-3.1-pro-high
gemini-3.1-pro-low
claude-sonnet-4-6
claude-opus-4-6-thinking
gpt-oss-120b-medium
```

Use the slug in `--model`:

```console
agy --model gemini-3.7-flash-medium
```

In an ithyno Worker entry, the corresponding **Args** value is:

```text
--model gemini-3.7-flash-medium
```

AGY availability varies by Google AI plan. Re-run `agy models` instead of
relying on this snapshot.

Sources: [Antigravity CLI headless mode](https://antigravity.google/docs/cli/headless/),
[Antigravity models](https://antigravity.google/docs/models/).

## GitHub Copilot CLI

The model picker's `/models` command is an alias. The current Copilot CLI reference lists:

- `claude-sonnet-4.6` (default)
- `gpt-5.4`
- `claude-haiku-4.5`
- `gpt-5.3-codex`
- `gemini-3.1-pro-preview`
- `gemini-3.5-flash`
- `gemini-3.6-flash`
- `gemini-3.7-flash`
- `mai-code-1-flash`
- `auto` (Copilot chooses an available model)

Your organization can restrict this list. `copilot help` also describes the
`--model` option available in the installed version.

For a one-off launch:

```console
copilot --model=claude-sonnet-4.6
```

In an ithyno Worker entry, an example **Args** value is:

```text
--model=claude-sonnet-4.6
```

Source: [GitHub Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference).

## When a configured model stops working

1. Update the CLI and sign in again if required.
2. Run the account-specific model check above.
3. Replace the model in the Agent's **Args** field.
4. Save the Agent and refresh the Manager terminal before dispatching again.

Avoid treating the lists in this page as a permanent allowlist. They document a
known point in time; the CLI picker is the source of truth for an actual run.
