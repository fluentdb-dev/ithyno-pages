# 各Agent CLIで利用可能なモデルを確認する

実際に選択できるモデルは、契約プラン、組織ポリシー、接続先Provider、地域、
CLIのバージョンによって変わります。モデル一覧は頻繁に更新されます。このページの
一覧は **2026年8月26日** に確認したスナップショットであり、ログイン済みCLIが
表示するPickerまたは一覧を正としてください。

## 確認方法の一覧

使用するCLIのカードからコマンドをコピーしてください。`/`から始まる
コマンドはShellではなく、起動後のCLI画面へ入力します。

<div class="grid cards" markdown>

-   **Claude Code**

    ```console
    claude
    ```

    起動後に入力:

    ```text
    /model
    ```

-   **Codex**

    ```console
    codex
    ```

    起動後に入力:

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

    起動後に入力（`/models`も利用可能）:

    ```text
    /model
    ```

</div>

ithynoが利用するアカウントでログインした状態で確認してください。ProviderのAPIで
公開されているモデルが、必ずしもCLIの契約で利用できるとは限りません。

## Claude Code

現在選択中のモデルは`/status`で確認できます。起動時に指定する場合は次のように
します。

```console
claude --model sonnet
```

Claude Codeでは`sonnet`、`opus`、`haiku`、`fable`などのAlias、または完全な
Model IDを指定できます。Anthropicが現在案内しているClaudeモデルは次のとおりです。

| モデル | 完全なModel ID |
|---|---|
| Claude Fable 5 | `claude-fable-5` |
| Claude Opus 4.8 | `claude-opus-4-8` |
| Claude Sonnet 5 | `claude-sonnet-5` |
| Claude Haiku 4.5 | `claude-haiku-4-5` |

`fable`など一部のモデルには、対応する契約またはアカウント権限が必要な場合が
あります。Amazon Bedrock、Google Cloud、Microsoft Foundry、LLM Gatewayを
利用する場合はAliasの参照先も異なる可能性があります。API全体の一覧から推測せず、
`/model`に表示された結果を確認してください。

ithynoのWorkerでは、例えば次の値を**Args**へ設定します。

```text
--model sonnet
```

出典: [Claude CodeのModel設定](https://code.claude.com/docs/en/model-config)、
[Claudeモデル一覧](https://platform.claude.com/docs/en/about-claude/models/overview)。

## Codex

Model Pickerに表示される一覧が、アカウントで実際に利用できるモデルです。選択後は
`/status`で確認できます。起動時だけ指定する場合は`-m`または`--model`を使います。

```console
codex -m gpt-5.6-terra
```

このドキュメントの確認環境で表示されたCodexモデルは次のとおりです。

- `gpt-5.6-sol`
- `gpt-5.6-terra`
- `gpt-5.6-luna`
- `gpt-5.5`
- `gpt-5.4`
- `gpt-5.4-mini`

OpenAI APIのモデル一覧はCodexのPickerより広いため、APIのModel IDをそのまま
`agents.yaml`へ転記しないでください。先にログイン済みCodexの`/model`に表示される
ことを確認します。

ithynoのWorkerでは、例えば次の値を**Args**へ設定します。

```text
-m gpt-5.6-terra
```

出典: [Codex Developer Commands](https://developers.openai.com/codex/cli/slash-commands)、
[OpenAIモデル一覧](https://developers.openai.com/api/docs/models)。

## Antigravity CLI（AGY）

このドキュメントの確認環境では次の一覧が返りました。

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

表示されたslugを`--model`へ指定します。

```console
agy --model gemini-3.7-flash-medium
```

ithynoのWorkerでは、対応する次の値を**Args**へ設定します。

```text
--model gemini-3.7-flash-medium
```

利用可能なモデルはGoogle AIのプランによって異なります。このスナップショットへ
依存せず、`agy models`を再実行してください。

出典: [Antigravity CLI Headless Mode](https://antigravity.google/docs/cli/headless/)、
[Antigravityのモデル一覧](https://antigravity.google/docs/models/)。

## GitHub Copilot CLI

Model Pickerの`/models`も同じ用途で利用できます。現在のCopilot CLI公式リファレンスには次の
モデルが掲載されています。

- `claude-sonnet-4.6`（Default）
- `gpt-5.4`
- `claude-haiku-4.5`
- `gpt-5.3-codex`
- `gemini-3.1-pro-preview`
- `gemini-3.5-flash`
- `gemini-3.6-flash`
- `gemini-3.7-flash`
- `mai-code-1-flash`
- `auto`（Copilotが利用可能なモデルを選択）

組織設定によって選択肢が制限される場合があります。インストール済みバージョンの
`--model`オプションは`copilot help`でも確認できます。

起動時だけ指定する例:

```console
copilot --model=claude-sonnet-4.6
```

ithynoのWorkerでは、例えば次の値を**Args**へ設定します。

```text
--model=claude-sonnet-4.6
```

出典: [GitHub Copilot CLI Command Reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)。

## 設定済みモデルが利用できなくなった場合

1. CLIを更新し、必要に応じて再ログインします。
2. 上記の方法でアカウント固有のモデル一覧を確認します。
3. Agents画面の**Args**にあるモデル名を置き換えます。
4. Agentを保存し、Managerターミナルをリフレッシュしてから再度Dispatchします。

このページの一覧を恒久的なAllowlistとして扱わないでください。これは特定時点の
記録であり、実行時にはCLIのModel Pickerが正本です。
